import { auth } from '../lib/firebase';

/**
 * Reusable utility to perform authenticated fetch calls including the Firebase ID Token.
 */
export async function authFetch(url: string, options: RequestInit = {}): Promise<Response> {
  const headers = new Headers(options.headers || {});
  
  // Set JSON content-type if body is provided and not already set
  if (options.body && !headers.has('Content-Type') && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  if (auth.currentUser) {
    try {
      const token = await auth.currentUser.getIdToken();
      headers.set('Authorization', `Bearer ${token}`);
    } catch (err) {
      console.warn("Failed to retrieve Firebase ID token:", err);
    }
  }
  
  return fetch(url, {
    ...options,
    headers,
  });
}
