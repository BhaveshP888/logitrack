/**
 * Generates vercel.json at build time.
 * Reads VITE_WS_URL to set the API proxy rewrite destination.
 * This avoids hardcoding the backend URL in a static JSON file.
 *
 * Usage: node scripts/generate-vercel-config.mjs
 * Runs automatically as part of the Vercel build command.
 */
import { writeFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const backendUrl = process.env.VITE_WS_URL;

if (!backendUrl) {
  console.warn(
    '[generate-vercel-config] VITE_WS_URL is not set. ' +
    'API proxy rewrite will be skipped. Set it in Vercel environment variables.'
  );
}

const config = {
  rewrites: [
    // Proxy API requests to backend — keeps cookies first-party (avoids mobile Safari issues)
    ...(backendUrl
      ? [{ source: '/api/:path*', destination: `${backendUrl}/api/:path*` }]
      : []),
    // SPA fallback — all non-file routes serve index.html
    { source: '/(.*)', destination: '/index.html' }
  ]
};

const outputPath = join(__dirname, '..', 'vercel.json');
writeFileSync(outputPath, JSON.stringify(config, null, 2) + '\n');
console.log(`[generate-vercel-config] Wrote ${outputPath}`);
if (backendUrl) {
  console.log(`[generate-vercel-config] API proxy → ${backendUrl}`);
}
