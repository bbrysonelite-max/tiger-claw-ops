// Simple static file server for local dashboard development
import { createServer } from 'http';
import { readFileSync, existsSync } from 'fs';
import { join, extname } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PORT = process.env.SERVE_PORT || 3000;

const MIME_TYPES = {
  '.html': 'text/html',
  '.css': 'text/css',
  '.js': 'application/javascript',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon'
};

const server = createServer((req, res) => {
  let filePath = join(__dirname, 'website', req.url === '/' ? 'index.html' : req.url);
  
  // Default to .html extension for clean URLs
  if (!extname(filePath) && !existsSync(filePath)) {
    filePath += '.html';
  }
  
  if (!existsSync(filePath)) {
    res.writeHead(404);
    res.end('Not Found');
    return;
  }
  
  const ext = extname(filePath);
  const contentType = MIME_TYPES[ext] || 'application/octet-stream';
  
  try {
    const content = readFileSync(filePath);
    res.writeHead(200, { 'Content-Type': contentType });
    res.end(content);
  } catch (err) {
    res.writeHead(500);
    res.end('Server Error');
  }
});

server.listen(PORT, () => {
  console.log(`🐯 Tiger Claw Scout Dashboard: http://localhost:${PORT}`);
  console.log(`   Dashboard: http://localhost:${PORT}/dashboard.html`);
  console.log('   Press Ctrl+C to stop');
});
