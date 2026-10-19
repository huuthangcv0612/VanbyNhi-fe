/**
 * Kiểm tra tính hợp lệ của format URL web thông thường (http hoặc https)
 */
export function isValidHttpUrl(urlString?: string | null): boolean {
  if (!urlString || typeof urlString !== 'string' || urlString.trim() === '') {
    return false;
  }
  try {
    const url = new URL(urlString.trim());
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

/**
 * Kiểm tra tính hợp lệ của format URL Google Meet chính thức
 * Yêu cầu:
 * - Giao thức HTTPS (hoặc HTTP)
 * - Hostname chính xác là meet.google.com
 */
export function isValidMeetUrl(urlString?: string | null): boolean {
  if (!urlString || typeof urlString !== 'string' || urlString.trim() === '') {
    return false;
  }
  try {
    const url = new URL(urlString.trim());
    const isHttpOrHttps = url.protocol === 'https:' || url.protocol === 'http:';
    const isGoogleMeetHost = url.hostname.toLowerCase() === 'meet.google.com';
    return isHttpOrHttps && isGoogleMeetHost;
  } catch {
    return false;
  }
}
