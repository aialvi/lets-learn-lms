/** Where to go after sign-in: a same-origin callbackUrl, or the dashboard. */
export function callbackDestination(search: string, origin: string): string {
  const target = new URLSearchParams(search).get('callbackUrl');
  if (!target) return '/dashboard';
  try {
    // Resolving catches forms browsers treat as external, such as //host and /\host.
    const url = new URL(target, origin);
    if (url.origin !== origin || url.pathname.startsWith('/auth/')) return '/dashboard';
    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return '/dashboard';
  }
}
