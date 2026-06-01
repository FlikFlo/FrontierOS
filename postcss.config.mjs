/* Tailwind CSS v4 PostCSS plugin. This is the ONLY build wiring v4 needs —
   there is no tailwind.config.js (config lives in globals.css @theme).
   Place this file at your project root as `postcss.config.mjs`. */
const config = {
  plugins: {
    "@tailwindcss/postcss": {},
  },
};

export default config;
