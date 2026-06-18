import { createServer } from 'http';
import { readFile } from 'fs/promises';
import { extname, normalize, join } from 'path';

const ROOT = '/Users/katharina/Desktop/trees-zurich';
const TYPES = { '.html':'text/html', '.js':'text/javascript', '.mjs':'text/javascript', '.css':'text/css', '.svg':'image/svg+xml', '.png':'image/png', '.json':'application/json' };

createServer(async (req, res) => {
  try {
    let p = decodeURIComponent(req.url.split('?')[0]);
    if (p === '/' || p.endsWith('/')) p += 'index.html';
    const file = join(ROOT, normalize(p));
    if (!file.startsWith(ROOT)) { res.writeHead(403); return res.end('forbidden'); }
    const data = await readFile(file);
    res.writeHead(200, { 'Content-Type': TYPES[extname(file)] || 'application/octet-stream' });
    res.end(data);
  } catch (e) {
    res.writeHead(404); res.end('not found');
  }
}).listen(4178, () => console.log('serving trees-zurich on http://localhost:4178'));
