const http = require('http');
const fs = require('fs');
const path = require('path');
const { WebSocketServer } = require('ws');

const PORT = process.env.PORT || 3000;
const rooms = {};

const server = http.createServer((req, res) => {
  let filePath = req.url === '/' ? '/index.html' : req.url;
  filePath = path.join(__dirname, 'public', filePath);
  const ext = path.extname(filePath);
  const mime = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css' };
  fs.readFile(filePath, (err, data) => {
    if (err) { res.writeHead(404); res.end('Not found'); return; }
    res.writeHead(200, { 'Content-Type': mime[ext] || 'text/plain' });
    res.end(data);
  });
});

const wss = new WebSocketServer({ server });

function broadcast(roomId, msg, exclude = null) {
  const room = rooms[roomId];
  if (!room) return;
  const str = JSON.stringify(msg);
  room.clients.forEach(client => {
    if (client !== exclude && client.readyState === 1) client.send(str);
  });
}

function broadcastAll(roomId, msg) {
  broadcast(roomId, msg, null);
}

function roomState(roomId) {
  const room = rooms[roomId];
  if (!room) return null;
  return {
    type: 'state',
    room: roomId,
    host: room.host,
    phase: room.phase,
    players: room.players,
    results: room.results,
    startTs: room.startTs
  };
}

wss.on('connection', ws => {
  ws.roomId = null;
  ws.name = null;

  ws.on('message', raw => {
    let msg;
    try { msg = JSON.parse(raw); } catch { return; }

    if (msg.type === 'join') {
      const { name, room: roomId } = msg;
      if (!name || !roomId) return;
      ws.name = name;
      ws.roomId = roomId;

      if (!rooms[roomId]) {
        ws.isHost = true;
        rooms[roomId] = {
          host: name,
          phase: 'lobby',
          players: [],
          results: {},
          startTs: null,
          clients: new Set()
        };
      } else {
        const room = rooms[roomId];
        if (room.phase !== 'lobby') {
          ws.send(JSON.stringify({ type: 'error', msg: 'ゲームが始まっています。参加できません。' }));
          return;
        }
        if (!room.players.includes(name)) room.players.push(name);
      }

      rooms[roomId].clients.add(ws);
      broadcastAll(roomId, roomState(roomId));
    }

    else if (msg.type === 'start') {
      const room = rooms[ws.roomId];
      if (!room || room.host !== ws.name || room.players.length < 1) return;
      room.phase = 'countdown';
      broadcastAll(ws.roomId, { type: 'countdown' });

      let n = 3;
      const tick = setInterval(() => {
        n--;
        if (n > 0) {
          broadcastAll(ws.roomId, { type: 'tick', n });
        } else {
          clearInterval(tick);
          room.phase = 'active';
          room.startTs = Date.now();
          room.results = {};
          broadcastAll(ws.roomId, { type: 'go', startTs: room.startTs });
        }
      }, 1000);
    }

    else if (msg.type === 'press') {
      const room = rooms[ws.roomId];
      if (!room || room.phase !== 'active') return;
      if (ws.isHost) return;
      if (room.results[ws.name] !== undefined) return;
      const elapsed = Date.now() - room.startTs;
      room.results[ws.name] = elapsed;
      broadcastAll(ws.roomId, { type: 'pressed', name: ws.name, ms: elapsed, results: room.results });
    }

    else if (msg.type === 'end_game') {
      const room = rooms[ws.roomId];
      if (!room || room.host !== ws.name || room.phase !== 'active') return;
      room.phase = 'done';
      broadcastAll(ws.roomId, { type: 'done', results: room.results });
    }

    else if (msg.type === 'restart') {
      const room = rooms[ws.roomId];
      if (!room || room.host !== ws.name) return;
      room.phase = 'lobby';
      room.results = {};
      room.startTs = null;
      broadcastAll(ws.roomId, roomState(ws.roomId));
    }
  });

  ws.on('close', () => {
    const room = rooms[ws.roomId];
    if (!room) return;
    room.clients.delete(ws);
    if (!ws.isHost) {
      room.players = room.players.filter(p => p !== ws.name);
    }
    if (room.clients.size === 0) {
      delete rooms[ws.roomId];
    } else {
      broadcastAll(ws.roomId, roomState(ws.roomId));
    }
  });
});

server.listen(PORT, () => console.log(`Button Race running on http://localhost:${PORT}`));
