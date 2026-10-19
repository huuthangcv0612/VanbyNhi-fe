import { describe, it, expect } from 'vitest';
import { isValidHttpUrl, isValidMeetUrl } from './url.utils';

describe('url.utils', () => {
  describe('isValidHttpUrl', () => {
    it('returns true for valid http and https urls', () => {
      expect(isValidHttpUrl('https://meet.google.com/abc-defg-hij')).toBe(true);
      expect(isValidHttpUrl('http://localhost:3000')).toBe(true);
      expect(isValidHttpUrl('https://example.com/page?query=1')).toBe(true);
    });

    it('returns false for invalid urls, non-http protocols, or falsy values', () => {
      expect(isValidHttpUrl('')).toBe(false);
      expect(isValidHttpUrl(null)).toBe(false);
      expect(isValidHttpUrl(undefined)).toBe(false);
      expect(isValidHttpUrl('javascript:alert(1)')).toBe(false);
      expect(isValidHttpUrl('not a url')).toBe(false);
    });
  });

  describe('isValidMeetUrl', () => {
    it('returns true for meet.google.com urls', () => {
      expect(isValidMeetUrl('https://meet.google.com/abc-defg-hij')).toBe(true);
      expect(isValidMeetUrl('https://meet.google.com/xyz-1234-567')).toBe(true);
      expect(isValidMeetUrl('http://meet.google.com/test-room')).toBe(true);
    });

    it('returns false for non-Google Meet hosts or invalid formats', () => {
      expect(isValidMeetUrl('https://zoom.us/j/123456789')).toBe(false);
      expect(isValidMeetUrl('https://evil-meet.google.com.attacker.com')).toBe(false);
      expect(isValidMeetUrl('https://google.com')).toBe(false);
      expect(isValidMeetUrl('javascript:alert(1)')).toBe(false);
      expect(isValidMeetUrl('')).toBe(false);
      expect(isValidMeetUrl(null)).toBe(false);
    });
  });
});
