import * as net from 'node:net';

type BlockResult = {
  blocked: boolean;
  reason?: string;
};

const BLOCKED_HOST_SUFFIXES = ['.localhost', '.internal', '.local', '.home.arpa'];

function parseIpv4ToInt(ipv4: string): number | null {
  const parts = ipv4.split('.');
  if (parts.length !== 4) return null;
  const bytes = parts.map((part) => Number(part));
  if (bytes.some((byte) => !Number.isInteger(byte) || byte < 0 || byte > 255)) {
    return null;
  }
  return bytes.reduce((acc, byte) => acc * 256 + byte, 0);
}

function isInIpv4Cidr(ipv4: string, cidrBase: string, prefix: number): boolean {
  const ipInt = parseIpv4ToInt(ipv4);
  const baseInt = parseIpv4ToInt(cidrBase);
  if (ipInt === null || baseInt === null) return false;

  if (prefix === 0) return true;
  const size = 2 ** (32 - prefix);
  const start = Math.floor(baseInt / size) * size;
  return ipInt >= start && ipInt < start + size;
}

function parseFlexibleIpv4(host: string): string | null {
  const parts = host.split('.');
  if (parts.length < 1 || parts.length > 4) return null;

  const values: number[] = [];
  for (const raw of parts) {
    if (!raw) return null;
    if (!/^(0x[0-9a-f]+|0[0-7]*|[0-9]+)$/i.test(raw)) return null;

    const base = /^0x/i.test(raw) ? 16 : /^0[0-7]+$/.test(raw) && raw.length > 1 ? 8 : 10;
    const value = Number.parseInt(raw, base);
    if (!Number.isFinite(value) || value < 0) return null;
    values.push(value);
  }

  const lastMax = (2 ** (8 * (5 - values.length))) - 1;
  if (values.slice(0, -1).some((v) => v > 255) || values[values.length - 1] > lastMax) {
    return null;
  }

  let ipInt = 0;
  if (values.length === 1) {
    ipInt = values[0];
  } else if (values.length === 2) {
    ipInt = values[0] * (2 ** 24) + values[1];
  } else if (values.length === 3) {
    ipInt = values[0] * (2 ** 24) + values[1] * (2 ** 16) + values[2];
  } else {
    ipInt = values[0] * (2 ** 24) + values[1] * (2 ** 16) + values[2] * (2 ** 8) + values[3];
  }

  if (ipInt < 0 || ipInt > 0xFFFFFFFF) return null;

  return [
    Math.floor(ipInt / (2 ** 24)) % 256,
    Math.floor(ipInt / (2 ** 16)) % 256,
    Math.floor(ipInt / (2 ** 8)) % 256,
    ipInt % 256,
  ].join('.');
}

function classifyIpv4(ipv4: string): BlockResult {
  const blockedCidrs: Array<[string, number, string]> = [
    ['0.0.0.0', 8, 'ipv4_unspecified'],
    ['10.0.0.0', 8, 'ipv4_private'],
    ['100.64.0.0', 10, 'ipv4_carrier_grade_nat'],
    ['127.0.0.0', 8, 'ipv4_loopback'],
    ['169.254.0.0', 16, 'ipv4_link_local'],
    ['172.16.0.0', 12, 'ipv4_private'],
    ['192.0.0.0', 24, 'ipv4_reserved'],
    ['192.0.2.0', 24, 'ipv4_documentation'],
    ['192.168.0.0', 16, 'ipv4_private'],
    ['198.18.0.0', 15, 'ipv4_benchmark'],
    ['198.51.100.0', 24, 'ipv4_documentation'],
    ['203.0.113.0', 24, 'ipv4_documentation'],
    ['224.0.0.0', 4, 'ipv4_multicast'],
    ['240.0.0.0', 4, 'ipv4_reserved'],
  ];

  for (const [base, prefix, reason] of blockedCidrs) {
    if (isInIpv4Cidr(ipv4, base, prefix)) {
      return { blocked: true, reason };
    }
  }
  return { blocked: false };
}

function classifyIpv6(ipv6: string): BlockResult {
  const normalized = ipv6.toLowerCase();
  if (normalized === '::' || normalized === '::1') {
    return { blocked: true, reason: 'ipv6_loopback' };
  }
  if (normalized.startsWith('fc') || normalized.startsWith('fd')) {
    return { blocked: true, reason: 'ipv6_unique_local' };
  }
  if (normalized.startsWith('fe80:')) {
    return { blocked: true, reason: 'ipv6_link_local' };
  }
  if (normalized.startsWith('fec0:')) {
    return { blocked: true, reason: 'ipv6_site_local' };
  }
  if (normalized.startsWith('::ffff:')) {
    const mapped = normalized.slice('::ffff:'.length);
    const mappedIpv4 = parseFlexibleIpv4(mapped);
    if (mappedIpv4) return classifyIpv4(mappedIpv4);
  }
  return { blocked: false };
}

export function getHostBlockReason(hostname: string): string | null {
  const host = hostname.trim().toLowerCase();
  if (!host) return 'empty_host';
  if (host.includes('%')) return 'encoded_or_zone_identifier_host';
  if (host === 'localhost' || host === '0.0.0.0' || host.endsWith('.localhost')) {
    return 'localhost';
  }
  if (BLOCKED_HOST_SUFFIXES.some((suffix) => host.endsWith(suffix))) {
    return 'internal_hostname_suffix';
  }

  const normalizedHost = host.startsWith('[') && host.endsWith(']')
    ? host.slice(1, -1)
    : host;

  const ipFamily = net.isIP(normalizedHost);
  if (ipFamily === 4) {
    return classifyIpv4(normalizedHost).reason ?? null;
  }
  if (ipFamily === 6) {
    return classifyIpv6(normalizedHost).reason ?? null;
  }

  const flexibleIpv4 = parseFlexibleIpv4(normalizedHost);
  if (flexibleIpv4) {
    return classifyIpv4(flexibleIpv4).reason ?? null;
  }

  return null;
}

export function isBlockedOutboundUrl(url: URL): BlockResult {
  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    return { blocked: true, reason: 'blocked_protocol' };
  }
  if (url.username || url.password) {
    return { blocked: true, reason: 'url_credentials_not_allowed' };
  }

  const reason = getHostBlockReason(url.hostname);
  if (reason) return { blocked: true, reason };
  return { blocked: false };
}
