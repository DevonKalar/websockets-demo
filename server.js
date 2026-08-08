import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { WebSocketServer } from 'ws';

const PORT = process.env.PORT || 3000;
const PUBLIC_DIR = path.join(path.dirname(fileURLToPath(import.meta.url)), 'public');

const MIME = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css'
};

const server = http.createServer((req, res) => {
  const urlPath = req.url === '/' ? '/index.html' : req.url;
  // strip any ../ so a request can't escape public/
  const safePath = path.normalize(urlPath).replace(/^(\.\.[/\\])+/, '');
  const filePath = path.join(PUBLIC_DIR, safePath)

  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      return res.end('Not found');
    }
    res.writeHead(200, {
      'Content-Type': MIME[path.extname(filePath)] || 'application/octet-stream',

    });
    res.end(data);
  });
});

const wss = new WebSocketServer({ server });

function broadcast(payload) {
  console.log('attempting to broadcast');
  const data = JSON.stringify(payload);
  console.log(`received: ${data}`)
  for (const client of wss.clients) {
    if (client.readyState === client.OPEN) client.send(data);
  }
}

wss.on('connection', (socket) => {
  console.log('client connected');

  socket.on('message', (raw) => {
    console.log('recived event... emitting now...')
    let msg;
    try {
      msg = JSON.parse(raw);
    } catch {
      return; //ignore malformed
    }
    if (msg.type !== 'chat' || typeof msg.text !== 'string') return;

    const text = msg.text.trim().slice(0, 500);
    if (!text) return;

    broadcast({ type: 'chat', text, at: Date.now() });
  });

  socket.on('close', () => console.log('client disconnected'));
});

server.listen(PORT, () => console.log(`http://localhost:${PORT}`));
