import http from 'node:http';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../frontend/', import.meta.url));
const ethersFile = fileURLToPath(new URL('../node_modules/ethers/dist/ethers.min.js', import.meta.url));
const types = { '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript' };
http.createServer(async (req, res) => {
  try {
    const pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
    const file = pathname === '/vendor/ethers.js' ? ethersFile : path.resolve(root, '.' + (pathname === '/' ? '/index.html' : pathname));
    if (file !== ethersFile && !file.startsWith(root)) {
      res.writeHead(403).end('Forbidden'); return;
    }
    const data = await fs.readFile(file);
    res.writeHead(200, { 'Content-Type': types[path.extname(file)] || 'application/octet-stream', 'Cache-Control': 'no-store' });
    res.end(data);
  } catch { res.writeHead(404).end('Not found'); }
}).listen(8080, '127.0.0.1', () => console.log('CampusGear: http://localhost:8080 (Ctrl+C to stop)'));
