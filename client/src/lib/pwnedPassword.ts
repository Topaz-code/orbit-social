/**
 * Privacy-preserving password breach detection using HaveIBeenPwned k-Anonymity API.
 * The password never leaves the client: only the first 5 characters of its SHA-1 hash are sent.
 */
export async function checkPasswordBreached(password: string): Promise<{ isPwned: boolean; count: number }> {
  if (!password || password.length < 4) {
    return { isPwned: false, count: 0 };
  }

  try {
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hashBuffer = await crypto.subtle.digest('SHA-1', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('').toUpperCase();

    const prefix = hashHex.substring(0, 5);
    const suffix = hashHex.substring(5);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000);

    const response = await fetch(`https://api.pwnedpasswords.com/range/${prefix}`, {
      headers: {
        'Add-Padding': 'true', // Prevents response length analysis
      },
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (!response.ok) {
      return { isPwned: false, count: 0 };
    }

    const text = await response.text();
    const lines = text.split('\n');

    for (const line of lines) {
      const [entrySuffix, countStr] = line.trim().split(':');
      if (entrySuffix === suffix) {
        const count = parseInt(countStr, 10) || 1;
        return { isPwned: true, count };
      }
    }

    return { isPwned: false, count: 0 };
  } catch {
    // Fail-safe: if offline, firewall blocked, or timeout, do not break the UI
    return { isPwned: false, count: 0 };
  }
}
