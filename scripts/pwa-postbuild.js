/**
 * pwa-postbuild.js — runs after `expo export`.
 *  1. copies public/ → dist/ (manifest, sw, icons, offline shell)
 *  2. injects PWA meta tags + service-worker registration into dist/index.html
 *
 *   node scripts/pwa-postbuild.js
 */
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const pub = path.join(root, 'public');
const dist = path.join(root, 'dist');

if (!fs.existsSync(dist)) {
  console.error('✗ dist/ not found — run `npx expo export --platform all` first.');
  process.exit(1);
}

/* 1. copy public/ → dist/ */
function copyDir(from, to) {
  fs.mkdirSync(to, { recursive: true });
  for (const entry of fs.readdirSync(from, { withFileTypes: true })) {
    const src = path.join(from, entry.name);
    const dest = path.join(to, entry.name);
    if (entry.isDirectory()) copyDir(src, dest);
    else fs.copyFileSync(src, dest);
  }
}
if (fs.existsSync(pub)) {
  copyDir(pub, dist);
  console.log('✓ copied public/ → dist/');
}

/* 2. patch index.html */
const indexPath = path.join(dist, 'index.html');
let html = fs.readFileSync(indexPath, 'utf8');

const HEAD_TAGS = `
    <!-- PWA -->
    <link rel="manifest" href="/manifest.json" />
    <meta name="theme-color" content="#2563EB" media="(prefers-color-scheme: light)" />
    <meta name="theme-color" content="#0B1120" media="(prefers-color-scheme: dark)" />
    <meta name="description" content="Zed Earn — منصة تسويق بالعمولة جزائرية تدفع بالدينار الجزائري." />
    <meta name="mobile-web-app-capable" content="yes" />
    <meta name="apple-mobile-web-app-capable" content="yes" />
    <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
    <meta name="apple-mobile-web-app-title" content="Zed Earn" />
    <meta name="application-name" content="Zed Earn" />
    <link rel="apple-touch-icon" href="/icons/apple-touch-icon.png" />
    <link rel="icon" type="image/png" sizes="192x192" href="/icons/icon-192.png" />
    <meta property="og:title" content="Zed Earn" />
    <meta property="og:description" content="أنجز مهام تسويقية واربح بالدينار الجزائري." />
    <meta property="og:image" content="/icons/icon-512.png" />
    <meta property="og:type" content="website" />
`;

const SW_SCRIPT = `
    <script>
      if ('serviceWorker' in navigator) {
        window.addEventListener('load', function () {
          navigator.serviceWorker.register('/sw.js').catch(function (e) {
            console.warn('[Zed Earn] SW registration failed', e);
          });
        });
      }
    </script>
`;

if (!html.includes('rel="manifest"')) {
  html = html.replace('</head>', `${HEAD_TAGS}  </head>`);
}
if (!html.includes("serviceWorker.register('/sw.js')")) {
  html = html.replace('</body>', `${SW_SCRIPT}  </body>`);
}

fs.writeFileSync(indexPath, html);
console.log('✓ injected PWA meta + service-worker registration into dist/index.html');

/* 3. sanity report */
const required = ['manifest.json', 'sw.js', 'offline.html', 'icons/icon-192.png', 'icons/icon-512.png'];
const missing = required.filter((f) => !fs.existsSync(path.join(dist, f)));
if (missing.length) {
  console.error('✗ missing in dist:', missing.join(', '));
  process.exit(1);
}
console.log('✓ PWA build verified:', required.join(', '));
