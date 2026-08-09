const log = document.querySelector('#log');
const status = document.querySelector('#status');
const composer = document.querySelector('#composer');
const input = document.querySelector('#input');

let socket;
let retryDelay = 500;

function setStatus(state, text) {
  status.dataset.state = state;
  status.textContent = text;
}

function addLine(text) {
  const li = document.createElement('li');
  li.textContent = text;
  log.append(li);
  log.scrollTop = log.scrollHeight;
}

function connect() {
  const protocol = location.protocol === 'https:' ? 'wss:' : 'ws:';
  socket = new WebSocket(`${protocol}//${location.host}`);

  socket.addEventListener('open', () => {
    retryDelay = 500; // reset backoff on a successful connect
    setStatus('online', 'connected');
  });

  socket.addEventListener('message', (event) => {
    const msg = JSON.parse(event.data);
    if (msg.type === 'chat') {
      const time = new Date(msg.at).toLocaleTimeString();
      addLine(`[${time}] ${msg.text}`);
    } else if (msg.type === 'presence') {
      setStatus('online', `connected · ${msg.count} online`);
    }
  });

  socket.addEventListener('close', () => {
    setStatus('offline', `disconnected · retrying in ${retryDelay}ms`);
    setTimeout(connect, retryDelay);
    retryDelay = Math.min(retryDelay * 2, 10000);
  });

  socket.addEventListener('error', () => socket.close());
}

composer.addEventListener('submit', (event) => {
  event.preventDefault();
  const text = input.value.trim();
  if (!text || socket.readyState !== WebSocket.OPEN) return;
  socket.send(JSON.stringify({ type: 'chat', text }));
  input.value = '';
});

connect();
