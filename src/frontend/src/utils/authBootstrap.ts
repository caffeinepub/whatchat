/**
 * Utilities for managing auto-login behavior after sign-out.
 * Uses sessionStorage to persist a one-time flag that prevents
 * automatic redirect to /chats immediately after signing out.
 */

const SKIP_AUTO_LOGIN_KEY = 'whatchat_skip_auto_login';

/**
 * Set a marker to skip auto-login/redirect on the next auth initialization.
 * This is used when the user explicitly signs out to prevent immediate re-entry.
 */
export function setSkipAutoLogin(): void {
  try {
    sessionStorage.setItem(SKIP_AUTO_LOGIN_KEY, 'true');
  } catch (error) {
    console.warn('Failed to set skip auto-login marker:', error);
  }
}

/**
 * Check if auto-login should be skipped.
 */
export function shouldSkipAutoLogin(): boolean {
  try {
    return sessionStorage.getItem(SKIP_AUTO_LOGIN_KEY) === 'true';
  } catch (error) {
    console.warn('Failed to read skip auto-login marker:', error);
    return false;
  }
}

/**
 * Clear the skip auto-login marker.
 * Should be called after the user explicitly initiates a new sign-in.
 */
export function clearSkipAutoLogin(): void {
  try {
    sessionStorage.removeItem(SKIP_AUTO_LOGIN_KEY);
  } catch (error) {
    console.warn('Failed to clear skip auto-login marker:', error);
  }
}
