/**
 * Extract a GitHub username from full URLs or plain input.
 */
export const extractGitHubUsername = (input: string): string => {
  if (!input || typeof input !== 'string') return '';

  let normalized = input.trim().replace(/^https?:\/\//, '').replace(/^www\./, '');

  // Remove query string or hash fragments
  normalized = normalized.split(/[?#]/)[0].replace(/\/+$/, '');

  const parts = normalized.split('/');

  const githubIndex = parts.findIndex((p) => p === 'github.com');
  if (githubIndex !== -1 && parts.length > githubIndex + 1) {
    return parts[githubIndex + 1];
  }

  // If it's a plain username
  if (/^[a-zA-Z0-9-]{1,39}$/.test(normalized)) {
    return normalized;
  }

  return '';
};
