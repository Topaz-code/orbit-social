/**
 * media.ts
 * ---------------------------------------------------------------------------
 * Defensive helpers for normalising media URLs coming back from the backend /
 * MQTT. The API occasionally serialises attachments in unexpected shapes:
 *   - plain string:            "https://cdn.example.com/photo.jpg"
 *   - JSON-stringified object: '{"url":"https://...","width":800}'
 *   - object:                  { url: "https://..." } | { uri: "..." }
 *   - Supabase shape:          { publicUrl: "https://..." }
 *   - array:                   [{ url: "..." }, ...]
 *
 * Passing any of the non-string shapes straight into
 * `<Image source={{ uri: media_url }} />` crashes expo-image / RN because the
 * `uri` becomes "[object Object]" / an object and the native view tries to
 * resolve an invalid source while also having no measurable dimensions.
 *
 * These helpers GUARANTEE that we only ever hand expo-image a non-empty
 * string that looks like a URL (http/https/file/content/data) or null.
 * ---------------------------------------------------------------------------
 */

/** Returns true when `value` is a usable remote/local image URI string. */
export function isValidMediaUri(value: unknown): value is string {
  if (typeof value !== 'string') return false;
  const v = value.trim();
  if (!v) return false;
  // Must be a URL / local file / data URI — never an object stringified.
  return (
    /^https?:\/\//i.test(v) ||
    v.startsWith('file://') ||
    v.startsWith('content://') ||
    v.startsWith('asset://') ||
    v.startsWith('data:') ||
    // local expo/caches paths
    /^\/(var|Users|storage|data)\//.test(v)
  );
}

/**
 * Best-effort extraction of a usable media URI from ANY untrusted payload.
 * Returns a trimmed, validated URI string or `null` when nothing renderable
 * can be found. Never throws.
 */
export function getSafeMediaUrl(value: unknown): string | null {
  try {
    if (value == null) return null;

    // Fast path: already a clean string.
    if (typeof value === 'string') {
      const str = value.trim();
      if (!str) return null;
      if (isValidMediaUri(str)) return str;

      // It might be a JSON-stringified object/array. Try to parse it once.
      if (str.startsWith('{') || str.startsWith('[')) {
        try {
          return getSafeMediaUrl(JSON.parse(str));
        } catch {
          // Not JSON — fall through.
        }
      }
      return null;
    }

    // Arrays: take the first element that resolves to a URI.
    if (Array.isArray(value)) {
      for (const item of value) {
        const found = getSafeMediaUrl(item);
        if (found) return found;
      }
      return null;
    }

    // Objects: probe the common keys, recurse for nested objects.
    if (typeof value === 'object') {
      const obj = value as Record<string, unknown>;
      const directKeys = [
        'url',
        'uri',
        'media_url',
        'mediaUrl',
        'publicUrl',
        'src',
        'path',
        'secure_url',
        'href',
      ];
      for (const key of directKeys) {
        const candidate = obj[key];
        if (typeof candidate === 'string' && isValidMediaUri(candidate)) {
          return candidate.trim();
        }
      }
      // Nested `data` envelope (axios) or Supabase { data: { publicUrl } }.
      if (obj.data) {
        const nested = getSafeMediaUrl(obj.data);
        if (nested) return nested;
      }
      // Last resort: scan every value for an object with a usable key.
      for (const v of Object.values(obj)) {
        if (typeof v === 'object' && v !== null) {
          const nested = getSafeMediaUrl(v);
          if (nested) return nested;
        }
      }
    }

    return null;
  } catch {
    return null;
  }
}
