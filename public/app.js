const log = document.querySelector('#log');
const status = document.querySelector('#status');
const composer = document.querySelector('#composer');
const input = document.querySelector('#input');

const protocol = location.protocol === 'https:' ? 'wss:' : 'ws';
const socket = new WebSocket(`${protocol}//${location.host}`);

function setStatus(state, text) {
  status.dataset.state = state;
  status.textContent = text;
}

function addLine(text) {
  const li = document.createElement('li');
  li.textContent = text;
  log.append(li);
  log.scrcollTop = log.scrollHeight;
}

socket.addEventListener('open', () => setStatus('online', 'connected'));
socket.addEventListener('close', () => setStatus('offline', 'disconnected'));

socket.addEventListener('message', (event) => {
  const msg = JSON.parse(event.data);
  if (msg.type === 'chat') {
    const time = new Date(msg.at).toLocaleTimeString();
    addLine(`[${time}] ${msg.text}`);
  }
});

composer.addEventListener('submit', (event) => {
  event.preventDefault();
  const text = input.value.trim();
  if (!text || socket.readyState !== WebSocket.OPEN) return;
  socket.send(JSON.stringify({ type: 'chat', text }));
  input.value = '';
})
