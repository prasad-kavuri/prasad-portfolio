import { describe, it, expect } from 'vitest';
import { getHostBlockReason, isBlockedOutboundUrl } from '@/lib/url-security';

describe('url-security host classification', () => {
  it('allows public hostnames', () => {
    expect(getHostBlockReason('example.com')).toBeNull();
    expect(getHostBlockReason('www.prasadkavuri.com')).toBeNull();
  });

  it('blocks localhost and internal suffixes', () => {
    expect(getHostBlockReason('localhost')).toBe('localhost');
    expect(getHostBlockReason('api.localhost')).toBe('localhost');
    expect(getHostBlockReason('service.internal')).toBe('internal_hostname_suffix');
    expect(getHostBlockReason('router.home.arpa')).toBe('internal_hostname_suffix');
  });

  it('blocks private and loopback IPv4 ranges', () => {
    expect(getHostBlockReason('127.0.0.1')).toBe('ipv4_loopback');
    expect(getHostBlockReason('10.1.2.3')).toBe('ipv4_private');
    expect(getHostBlockReason('172.20.10.4')).toBe('ipv4_private');
    expect(getHostBlockReason('192.168.1.10')).toBe('ipv4_private');
    expect(getHostBlockReason('169.254.169.254')).toBe('ipv4_link_local');
  });

  it('blocks alternate IPv4 encodings that resolve to internal ranges', () => {
    expect(getHostBlockReason('2130706433')).toBe('ipv4_loopback'); // 127.0.0.1
    expect(getHostBlockReason('0x7f000001')).toBe('ipv4_loopback'); // 127.0.0.1
    expect(getHostBlockReason('127.1')).toBe('ipv4_loopback'); // 2-part shorthand
    expect(getHostBlockReason('127.0.1')).toBe('ipv4_loopback'); // 3-part shorthand (line 57)
  });

  it('returns null for out-of-range IPv4 byte (not classified as private)', () => {
    // 256.1.2.3 fails parseFlexibleIpv4 range check (line 48) — not a valid IP, not blocked
    expect(getHostBlockReason('256.1.2.3')).toBeNull();
  });

  it('blocks ipv6 local addresses and mapped local addresses', () => {
    expect(getHostBlockReason('::')).toBe('ipv6_loopback');
    expect(getHostBlockReason('::1')).toBe('ipv6_loopback');
    expect(getHostBlockReason('fe80::1')).toBe('ipv6_link_local');
    expect(getHostBlockReason('fc00::1234')).toBe('ipv6_unique_local');
    expect(getHostBlockReason('fec0::1')).toBe('ipv6_site_local');
    expect(getHostBlockReason('::ffff:127.0.0.1')).toBe('ipv4_loopback');
  });

  it('allows public IPv4 addresses', () => {
    expect(getHostBlockReason('8.8.8.8')).toBeNull();
    expect(getHostBlockReason('1.1.1.1')).toBeNull();
  });

  it('allows public IPv6 addresses', () => {
    expect(getHostBlockReason('2001:db8::1')).toBeNull();
    expect(getHostBlockReason('2606:4700:4700::1111')).toBeNull();
  });

  it('blocks empty host', () => {
    expect(getHostBlockReason('')).toBe('empty_host');
  });

  it('blocks host with percent-encoding or zone identifiers', () => {
    expect(getHostBlockReason('169.254.169.254%eth0')).toBe('encoded_or_zone_identifier_host');
  });
});

describe('isBlockedOutboundUrl', () => {
  it('blocks unsafe protocols and credentialed URLs', () => {
    expect(isBlockedOutboundUrl(new URL('ftp://example.com')).blocked).toBe(true);
    expect(isBlockedOutboundUrl(new URL('https://user:pass@example.com')).reason)
      .toBe('url_credentials_not_allowed');
  });

  it('allows standard public https URLs', () => {
    const result = isBlockedOutboundUrl(new URL('https://www.prasadkavuri.com'));
    expect(result.blocked).toBe(false);
  });
});

