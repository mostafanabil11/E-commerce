const fs = require('fs');
const path = require('path');
const OUT = path.join(__dirname, 'raw');
const BASE = 'https://ecommerce.routemisr.com/api/v1';

async function fetchAll(endpoint) {
  const all = [];
  let page = 1;
  for (;;) {
    const res = await fetch(`${BASE}/${endpoint}?limit=50&page=${page}`);
    if (!res.ok) throw new Error(`${endpoint} p${page} -> ${res.status}`);
    const json = await res.json();
    const batch = json.data || [];
    all.push(...batch);
    const next = json.metadata && json.metadata.nextPage;
    if (!next || batch.length === 0) break;
    page = next;
  }
  return all;
}

(async () => {
  for (const e of ['products', 'categories', 'brands', 'subcategories']) {
    const data = await fetchAll(e);
    fs.writeFileSync(path.join(OUT, `${e}.json`), JSON.stringify(data, null, 2));
    console.log(`${e.padEnd(15)} ${data.length} records`);
  }
})();
