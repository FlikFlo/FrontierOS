/**
 * Dev-only auth bypass.
 *
 * When active, the proxy skips the login redirect and the app renders as a
 * default `owner` (see the app layout), and server data reads use the service
 * key so RLS doesn't block the session-less requests.
 *
 * Engages ONLY when BOTH are true:
 *   - the build is not production (`NODE_ENV !== 'production'`), and
 *   - `DEV_BYPASS_AUTH=true` is set.
 *
 * `next build` / `next start` / Vercel run with NODE_ENV=production, so the
 * bypass can never reach a real deployment regardless of the flag.
 */
export function isAuthBypassed(): boolean {
  return process.env.NODE_ENV !== 'production' && process.env.DEV_BYPASS_AUTH === 'true'
}
