const trails = [
  { title: "溪谷小径", path: [12, 13, 9, 8, 4, 5, 1, 2, 6, 7, 3] },
  { title: "松林栈道", path: [12, 8, 9, 13, 14, 10, 6, 5, 1, 2, 3] },
  { title: "山脊环线", path: [12, 13, 14, 15, 11, 10, 6, 5, 4, 0, 1, 2, 3] },
];
const directions = ["north", "east", "south", "west"];
const directionLabels = ["上", "右", "下", "左"];
const offsets = [-4, 1, 4, -1];
const board = document.getElementById("board");
const statusLine = document.getElementById("status");
const signal = document.getElementById("signal");
const start = 12;
const goal = 3;
let trailIndex = 0;
let tiles;
let initialTurns;
let turns;
let budget;
let remaining;
let ended;

function makeTiles(path) {
  const layout = Array.from({ length: 16 }, () => ({ ports: [], period: 1 }));
  for (const [step, id] of path.entries()) {
    const neighbors = [path[step - 1], path[step + 1]].filter(Number.isInteger);
    const ports = neighbors.map(neighbor => offsets.indexOf(neighbor - id));
    let period = 1;
    if (ports.length === 2) period = Math.abs(ports[0] - ports[1]) === 2 ? 2 : 4;
    layout[id] = { ports, period };
  }
  return layout;
}

function rotatedPorts(id, rotation) {
  return tiles[id].ports.map(port => (port + rotation) % 4);
}

function newPuzzle() {
  const trail = trails[trailIndex];
  tiles = makeTiles(trail.path);
  initialTurns = tiles.map(tile => Math.floor(Math.random() * tile.period));

  // The first junction must begin disconnected so every puzzle needs at least one turn.
  const first = trail.path[1];
  const directionToStart = offsets.indexOf(start - first);
  const choices = Array.from({ length: tiles[first].period }, (_, i) => i)
    .filter(turn => !rotatedPorts(first, turn).includes(directionToStart));
  initialTurns[first] = choices[Math.floor(Math.random() * choices.length)];

  // Restoring every tile to the original route always fits, with three spare moves.
  budget = initialTurns.reduce((total, turn, id) => {
    const period = tiles[id].period;
    return total + (period - turn) % period;
  }, 3);
  document.getElementById("trail").textContent = trail.title;
  resetPuzzle();
}

function connectedTiles() {
  const connected = new Set([start]);
  const queue = [start];
  for (const id of queue) {
    for (const port of rotatedPorts(id, turns[id])) {
      const neighbor = id + offsets[port];
      if (neighbor < 0 || neighbor > 15 || connected.has(neighbor)) continue;
      if ((port === 1 || port === 3) && Math.floor(neighbor / 4) !== Math.floor(id / 4)) continue;
      if (rotatedPorts(neighbor, turns[neighbor]).includes((port + 2) % 4)) {
        connected.add(neighbor);
        queue.push(neighbor);
      }
    }
  }
  return connected;
}

function resetPuzzle() {
  turns = [...initialTurns];
  remaining = budget;
  board.replaceChildren();
  for (const [id, tile] of tiles.entries()) {
    const canTurn = tile.period > 1;
    const cell = document.createElement(canTurn ? "button" : "div");
    cell.className = "cell";
    if (canTurn) {
      cell.type = "button";
      cell.addEventListener("click", () => {
        if (ended) return;
        turns[id] = (turns[id] + 1) % tile.period;
        remaining -= 1;
        draw();
      });
    } else {
      cell.setAttribute("role", "img");
      if (id === start || id === goal) cell.classList.add("station-tile", id === start ? "start" : "goal");
      else cell.classList.add("woods");
    }
    board.append(cell);
  }
  draw();
}

function draw() {
  const connected = connectedTiles();
  const won = connected.has(goal);
  ended = won || remaining === 0;
  for (const [id, cell] of Array.from(board.children).entries()) {
    const ports = rotatedPorts(id, turns[id]);
    cell.classList.toggle("lit", connected.has(id));
    cell.replaceChildren();
    let label = "松林";
    if (ports.length) {
      const hub = document.createElement("span");
      hub.className = "hub";
      for (const port of ports) {
        const arm = document.createElement("span");
        arm.className = "arm " + directions[port];
        cell.append(arm);
      }
      cell.append(hub);
      label = ports.map(port => directionLabels[port]).join("、") + "相连";
      if (id === start) label = "固定电源";
      if (id === goal) label = "固定木塔";
      label += connected.has(id) ? "，有信号" : "，无信号";
    }
    const position = "第" + (Math.floor(id / 4) + 1) + "行，第" + (id % 4 + 1) + "列，";
    cell.setAttribute("aria-label", position + label);
    if (cell.tagName === "BUTTON") cell.setAttribute("aria-disabled", String(ended));
  }
  document.getElementById("charge").textContent = remaining + " / " + budget;
  signal.classList.toggle("on", won);
  signal.textContent = won ? "木塔已点亮" : "木塔待接通";
  statusLine.classList.toggle("ended", ended);
  if (won) statusLine.textContent = "木塔收到了信号！你用了 " + (budget - remaining) + " 格电量。";
  else if (ended) statusLine.textContent = "电量耗尽，木塔仍在等候。点「重试本图」重新接线。";
  else statusLine.textContent = "已接通 " + connected.size + " 处，沿亮线继续向山顶接线。";
}

document.getElementById("reset").addEventListener("click", resetPuzzle);
document.getElementById("next").addEventListener("click", () => {
  trailIndex = (trailIndex + 1) % trails.length;
  newPuzzle();
});
newPuzzle();
