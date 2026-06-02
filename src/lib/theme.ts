// Client-safe theme constants/types (no server-only imports here, so client
// components can import them). The cookie reader lives in ./theme-server.
export type Theme = 'dark' | 'light'
export const THEME_COOKIE = 'fos_theme'
