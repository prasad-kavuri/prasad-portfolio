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
    expect(getHostBlockReason('127.1')).toBe('ipv4_loopback'); // shorthand
  });

  it('blocks ipv6 local addresses and mapped local addresses', () => {
    expect(getHostBlockReason('::1')).toBe('ipv6_loopback');
    expect(getHostBlockReason('fe80::1')).toBe('ipv6_link_local');
    expect(getHostBlockReason('fc00::1234')).toBe('ipv6_unique_local');
    expect(getHostBlockReason('::ffff:127.0.0.1')).toBe('ipv4_loopback');
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

