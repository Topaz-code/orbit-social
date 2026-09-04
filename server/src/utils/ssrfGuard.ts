import dns from 'dns/promises';
import net from 'net';

/**
 * Parses IPv4 into a 32-bit unsigned integer.
 */
function ipv4ToInt(ip: string): number {
  return ip
    .split('.')
    .reduce((acc, octet) => ((acc << 8) + parseInt(octet, 10)) >>> 0, 0);
}

/**
 * Checks if an integer IPv4 address falls within a CIDR block.
 */
function isInRange(ipInt: number, cidrBase: string, prefixLen: number): boolean {
  const baseInt = ipv4ToInt(cidrBase);
  const mask = prefixLen === 0 ? 0 : (~0 << (32 - prefixLen)) >>> 0;
  return (ipInt & mask) === (baseInt & mask);
}

/**
 * Checks if an IPv4 address is in a private, loopback, link-local, or reserved range.
 */
export function isPrivateIPv4(ip: string): boolean {
  if (!net.isIPv4(ip)) return false;
  const ipInt = ipv4ToInt(ip);

  const blockedRanges: [string, number][] = [
    ['0.0.0.0', 8],          // "This" network (RFC 1122)
    ['10.0.0.0', 8],         // Private-use (RFC 1918)
    ['100.64.0.0', 10],      // Carrier-grade NAT (RFC 6598)
    ['127.0.0.0', 8],        // Loopback (RFC 1122)
    ['169.254.0.0', 16],     // Link-local / Cloud metadata (RFC 3927, AWS/GCP/Azure)
    ['172.16.0.0', 12],      // Private-use (RFC 1918)
    ['192.0.0.0', 24],       // IETF Protocol Assignments
    ['192.0.2.0', 24],       // Documentation (TEST-NET-1)
    ['192.168.0.0', 16],     // Private-use (RFC 1918)
    ['198.18.0.0', 15],      // Network benchmark tests
    ['198.51.100.0', 24],    // Documentation (TEST-NET-2)
    ['203.0.113.0', 24],     // Documentation (TEST-NET-3)
    ['224.0.0.0', 4],        // Multicast (RFC 5771)
    ['240.0.0.0', 4],        // Reserved for future use (RFC 1112)
    ['255.255.255.255', 32], // Broadcast
  ];

  for (const [cidrBase, prefix] of blockedRanges) {
    if (isInRange(ipInt, cidrBase, prefix)) {
      return true;
    }
  }

  return false;
}

/**
 * Checks if an IPv6 address is private, loopback, link-local, unique-local, or IPv4-mapped private.
 */
export function isPrivateIPv6(ip: string): boolean {
  if (!net.isIPv6(ip)) return false;
  const normalized = ip.toLowerCase();

  // Loopback / Unspecified
  if (normalized === '::1' || normalized === '::') return true;

  // IPv4-mapped IPv6 (::ffff:192.168.1.1)
  if (normalized.startsWith('::ffff:')) {
    const v4Part = normalized.slice('::ffff:'.length);
    if (net.isIPv4(v4Part)) {
      return isPrivateIPv4(v4Part);
    }
  }

  // Unique Local Address (fc00::/7) -> starts with fc or fd
  if (/^f[cd][0-9a-f]{2}:/i.test(normalized)) return true;

  // Link-Local Unicast (fe80::/10) -> starts with fe8, fe9, fea, feb
  if (/^fe[89ab][0-9a-f]:/i.test(normalized)) return true;

  // Multicast (ff00::/8)
  if (/^ff[0-9a-f]{2}:/i.test(normalized)) return true;

  return false;
}

/**
 * Validates a target URL against SSRF attacks.
 * Throws an Error if the URL is dangerous, internal, or malformed.
 */
export async function validateUrlForSSRF(rawUrl: string): Promise<URL> {
  let urlObj: URL;
  try {
    urlObj = new URL(rawUrl);
  } catch {
    throw new Error('Invalid URL format');
  }

  // 1. Only allow HTTP and HTTPS
  if (urlObj.protocol !== 'http:' && urlObj.protocol !== 'https:') {
    throw new Error(`Forbidden protocol: ${urlObj.protocol}`);
  }

  const hostname = urlObj.hostname.toLowerCase();

  // 2. Reject known dangerous hostnames
  const forbiddenHostnames = [
    'localhost',
    'metadata.google.internal',
    'instance-data',
  ];
  if (
    forbiddenHostnames.includes(hostname) ||
    hostname.endsWith('.localhost') ||
    hostname.endsWith('.local') ||
    hostname.endsWith('.internal')
  ) {
    throw new Error(`Forbidden host: ${hostname}`);
  }

  // 3. Direct IP check (e.g. http://127.0.0.1/ or http://[::1]/)
  if (net.isIP(hostname)) {
    if (isPrivateIPv4(hostname) || isPrivateIPv6(hostname)) {
      throw new Error(`Forbidden IP target: ${hostname}`);
    }
    return urlObj;
  }

  // 4. DNS resolution check (prevent DNS rebinding / internal host resolution)
  try {
    const records = await dns.lookup(hostname, { all: true });
    if (!records || records.length === 0) {
      throw new Error(`Could not resolve hostname: ${hostname}`);
    }

    for (const record of records) {
      if (record.family === 4 && isPrivateIPv4(record.address)) {
        throw new Error(`Resolved to private IP: ${record.address}`);
      }
      if (record.family === 6 && isPrivateIPv6(record.address)) {
        throw new Error(`Resolved to private IPv6: ${record.address}`);
      }
    }
  } catch (err: any) {
    throw new Error(`SSRF guard DNS validation failed: ${err.message}`);
  }

  return urlObj;
}
