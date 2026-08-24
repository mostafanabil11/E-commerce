const fs = require('fs');
const path = require('path');

const urls = fs.readFileSync(path.join(__dirname, 'image-urls.txt'), 'utf8')
  .split('\n').map(s => s.trim()).filter(Boolean);

// Route serves images under /Route-Academy-{products,categories,brands}/<file>
const DEST = path.join(__dirname, '..', 'uploads', 'seed');
const folderMap = {
  'Route-Academy-products': 'products',
  'Route-Academy-categories': 'categories',
  'Route-Academy-brands': 'brands',
};

for (const f of Object.values(folderMap)) {
  fs.mkdirSync(path.join(DEST, f), { recursive: true });
}

function localPathFor(url) {
  const parts = new URL(url).pathname.split('/').filter(Boolean);
  const folder = folderMap[parts[0]] || 'misc';
  return { folder, file: parts[parts.length - 1] };
}

let ok = 0, skipped = 0;
const failed = [];

async function download(url) {
  const { folder, file } = localPathFor(url);
  const dest = path.join(DEST, folder, file);
  if (fs.existsSync(dest) && fs.statSync(dest).size > 0) { skipped++; return; }
  const res = await fetch(url);
  if (!res.ok) { failed.push(`${res.status} ${url}`); return; }
  const buf = Buffer.from(await res.arrayBuffer());
  if (buf.length === 0) { failed.push(`empty ${url}`); return; }
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.writeFileSync(dest, buf);
  ok++;
}

(async () => {
  const CONCURRENCY = 8;
  const queue = [...urls];
  await Promise.all(Array.from({ length: CONCURRENCY }, async () => {
    while (queue.length) {
      const url = queue.shift();
      try { await download(url); } catch (e) { failed.push(`${e.message} ${url}`); }
    }
  }));
  console.log(`downloaded=${ok} skipped=${skipped} failed=${failed.length}`);
  if (failed.length) {
    fs.writeFileSync(path.join(__dirname, 'failed-images.txt'), failed.join('\n'));
    console.log(failed.slice(0, 10).join('\n'));
  }
})();
