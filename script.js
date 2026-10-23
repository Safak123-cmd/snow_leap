const canvas = document.querySelector("#game-canvas");
const context = canvas.getContext("2d");
const stage = document.querySelector("#game-stage");
const overlay = document.querySelector("#game-overlay");
const playButton = document.querySelector("#play-button");
const buttonLabel = document.querySelector("#button-label");
const overlayEmoji = document.querySelector("#overlay-emoji");
const overlayKicker = document.querySelector("#overlay-kicker");
const overlayTitle = document.querySelector("#overlay-title");
const overlayCopy = document.querySelector("#overlay-copy");
const scoreElement = document.querySelector("#score");
const bestElement = document.querySelector("#best");
const jumpHint = document.querySelector("#jump-hint");
const difficultySelect = document.querySelector("#difficulty");
const powerStatus = document.querySelector("#power-status");

const width = 900;
const height = 340;
const groundY = 274;
const difficulties = {
  easy: {
    startSpeed: 300,
    maxSpeed: 570,
    speedStep: 12,
    pointsPerStep: 130,
    minObstacleGap: 1.35,
    maxObstacleGap: 2.05,
  },
  normal: {
    startSpeed: 350,
    maxSpeed: 700,
    speedStep: 16,
    pointsPerStep: 100,
    minObstacleGap: 1.1,
    maxObstacleGap: 1.75,
  },
  hard: {
    startSpeed: 410,
    maxSpeed: 820,
    speedStep: 20,
    pointsPerStep: 75,
    minObstacleGap: 0.95,
    maxObstacleGap: 1.45,
  },
};
const player = {
  x: 115,
  y: groundY - 48,
  width: 38,
  height: 48,
  velocityY: 0,
  grounded: true,
};

const game = {
  status: "ready",
  score: 0,
  best: 0,
  speed: difficulties.normal.startSpeed,
  obstacleTimer: 1.25,
  powerupTimer: 4,
  lastTime: 0,
  distance: 0,
  obstacles: [],
  powerups: [],
  flightTime: 0,
  shield: false,
  shieldFlash: 0,
};

bestElement.textContent = formatScore(game.best);

function formatScore(value) {
  return String(value).padStart(4, "0");
}

function resizeCanvas() {
  const pixelRatio = window.devicePixelRatio || 1;
  const bounds = canvas.getBoundingClientRect();
  canvas.width = Math.round(bounds.width * pixelRatio);
  canvas.height = Math.round(bounds.height * pixelRatio);
  context.setTransform(
    (bounds.width / width) * pixelRatio,
    0,
    0,
    (bounds.height / height) * pixelRatio,
    0,
    0,
  );
  draw();
}

function drawBackground() {
  const sky = context.createLinearGradient(0, 0, 0, height);
  sky.addColorStop(0, "#17263e");
  sky.addColorStop(0.62, "#476b88");
  sky.addColorStop(1, "#bdd9e5");
  context.fillStyle = sky;
  context.fillRect(0, 0, width, height);

  context.fillStyle = "rgba(255, 255, 255, 0.13)";
  context.beginPath();
  context.arc(742, 72, 43, 0, Math.PI * 2);
  context.fill();
  context.fillStyle = "#f7fbff";
  context.shadowColor = "#e8f6ff";
  context.shadowBlur = 24;
  context.beginPath();
  context.arc(742, 72, 23, 0, Math.PI * 2);
  context.fill();
  context.shadowBlur = 0;

  context.globalAlpha = 0.8;
  context.fillStyle = "#f5fbff";
  for (let index = 0; index < 38; index += 1) {
    const x = (index * 137 + 41 - game.distance * (0.08 + (index % 3) * 0.035) + width * 4) % width;
    const y = (index * 67 + 19 + game.distance * (0.13 + (index % 4) * 0.035)) % 224;
    context.beginPath();
    context.arc(x, y, index % 5 === 0 ? 2.5 : 1.5, 0, Math.PI * 2);
    context.fill();
  }
  context.globalAlpha = 1;

  context.fillStyle = "#9bbdce";
  context.beginPath();
  context.moveTo(0, 234);
  context.lineTo(124, 94);
  context.lineTo(238, 234);
  context.lineTo(356, 120);
  context.lineTo(498, 234);
  context.lineTo(673, 81);
  context.lineTo(848, 234);
  context.lineTo(900, 182);
  context.lineTo(900, groundY);
  context.lineTo(0, groundY);
  context.fill();
  context.fillStyle = "#eef8fc";
  context.beginPath();
  context.moveTo(124, 94);
  context.lineTo(174, 156);
  context.lineTo(147, 148);
  context.lineTo(129, 171);
  context.lineTo(110, 151);
  context.lineTo(81, 160);
  context.closePath();
  context.moveTo(356, 120);
  context.lineTo(399, 174);
  context.lineTo(373, 165);
  context.lineTo(355, 184);
  context.lineTo(333, 166);
  context.lineTo(311, 176);
  context.closePath();
  context.moveTo(673, 81);
  context.lineTo(730, 148);
  context.lineTo(695, 139);
  context.lineTo(676, 160);
  context.lineTo(654, 137);
  context.lineTo(623, 150);
  context.closePath();
  context.fill();

  for (let index = 0; index < 13; index += 1) {
    const treeWidth = 42 + ((index * 17) % 34);
    const treeHeight = 48 + ((index * 29) % 76);
    const x = index * 78 - (game.distance * 0.18) % 78;
    const y = groundY - treeHeight;
    context.fillStyle = index % 2 === 0 ? "#294b58" : "#355966";
    context.fillRect(x + treeWidth * 0.45, y + treeHeight * 0.52, treeWidth * 0.12, treeHeight * 0.48);
    context.fillStyle = "#315a63";
    context.beginPath();
    context.moveTo(x + treeWidth * 0.5, y);
    context.lineTo(x + treeWidth, y + treeHeight * 0.48);
    context.lineTo(x, y + treeHeight * 0.48);
    context.closePath();
    context.fill();
    context.beginPath();
    context.moveTo(x + treeWidth * 0.5, y + treeHeight * 0.2);
    context.lineTo(x + treeWidth * 0.92, y + treeHeight * 0.72);
    context.lineTo(x + treeWidth * 0.08, y + treeHeight * 0.72);
    context.closePath();
    context.fill();
    context.fillStyle = "#e5f3f5";
    context.beginPath();
    context.moveTo(x + treeWidth * 0.5, y);
    context.lineTo(x + treeWidth * 0.72, y + treeHeight * 0.28);
    context.lineTo(x + treeWidth * 0.58, y + treeHeight * 0.24);
    context.lineTo(x + treeWidth * 0.49, y + treeHeight * 0.34);
    context.lineTo(x + treeWidth * 0.38, y + treeHeight * 0.24);
    context.closePath();
    context.fill();
  }

  context.fillStyle = "#deedf1";
  context.fillRect(0, groundY, width, height - groundY);
  context.fillStyle = "#ffffff";
  context.shadowColor = "#ecfaff";
  context.shadowBlur = 12;
  context.fillRect(0, groundY, width, 3);
  context.shadowBlur = 0;
  context.strokeStyle = "rgba(112, 164, 187, 0.22)";
  context.lineWidth = 1;
  for (let x = -((game.distance * 0.75) % 68); x < width; x += 68) {
    context.beginPath();
    context.ellipse(x, groundY + 17 + (x % 3) * 5, 3, 7, -0.5, 0, Math.PI * 2);
    context.ellipse(x + 13, groundY + 37 + (x % 2) * 4, 2, 5, 0.5, 0, Math.PI * 2);
    context.stroke();
  }
}

function drawPlayer() {
  const { x, y, width: playerWidth, height: playerHeight } = player;
  const flying = game.flightTime > 0;

  context.fillStyle = "rgba(171, 216, 233, 0.33)";
  context.beginPath();
  context.ellipse(x + 20, groundY + 1, player.grounded ? 22 : 13, 5, 0, 0, Math.PI * 2);
  context.fill();

  context.save();
  if (game.shield) {
    context.strokeStyle = "#a7f2ff";
    context.lineWidth = 3;
    context.shadowColor = "#a7f2ff";
    context.shadowBlur = 17;
    context.beginPath();
    context.ellipse(x + 20, y + 25, 29, 32, 0, 0, Math.PI * 2);
    context.stroke();
  }
  if (flying) {
    context.strokeStyle = "#d3f5ff";
    context.lineWidth = 3;
    context.shadowColor = "#d3f5ff";
    context.shadowBlur = 12;
    context.beginPath();
    context.moveTo(x - 10, y + 34);
    context.lineTo(x - 4, y + 42);
    context.lineTo(x + 1, y + 32);
    context.moveTo(x - 10, y + 21);
    context.lineTo(x - 4, y + 29);
    context.lineTo(x + 1, y + 19);
    context.stroke();
  }

  context.shadowColor = "#78d8ed";
  context.shadowBlur = 12;
  context.fillStyle = "#74c9e0";
  context.beginPath();
  context.roundRect(x + 3, y + 7, playerWidth - 4, playerHeight - 7, 13);
  context.fill();

  context.shadowBlur = 0;
  context.fillStyle = "#e6f9ff";
  context.beginPath();
  context.arc(x + 18, y + 13, 11, Math.PI, Math.PI * 2);
  context.fill();

  context.fillStyle = "#193344";
  context.beginPath();
  context.roundRect(x + 22, y + 17, 9, 4, 2);
  context.fill();

  context.fillStyle = "#a98be2";
  context.beginPath();
  context.roundRect(x - 1, y + 28, 11, 8, 4);
  context.fill();

  context.strokeStyle = "#bbc9ee";
  context.lineWidth = 5;
  context.lineCap = "round";
  const stride = game.status === "running" && player.grounded
    ? Math.sin(game.distance * 0.04) * 5
    : 0;
  context.beginPath();
  context.moveTo(x + 13, y + playerHeight - 4);
  context.lineTo(x + 12 - stride, y + playerHeight + 1);
  context.moveTo(x + 29, y + playerHeight - 4);
  context.lineTo(x + 30 + stride, y + playerHeight + 1);
  context.stroke();
  context.restore();
}

function drawObstacle(obstacle) {
  const { x, width: obstacleWidth, height: obstacleHeight } = obstacle;
  const y = groundY - obstacleHeight;

  context.save();
  context.shadowColor = "#a8e9ff";
  context.shadowBlur = 12;
  context.fillStyle = "#537d91";
  context.beginPath();
  context.roundRect(x, y + 3, obstacleWidth, obstacleHeight - 3, 5);
  context.fill();
  context.fillStyle = "#d5f4ff";
  context.beginPath();
  context.roundRect(x + 4, y, obstacleWidth - 8, 7, 4);
  context.fill();
  context.strokeStyle = "rgba(235, 251, 255, 0.9)";
  context.lineWidth = 2;
  context.beginPath();
  context.moveTo(x + obstacleWidth * 0.45, y + 11);
  context.lineTo(x + obstacleWidth * 0.45, groundY - 7);
  context.stroke();
  context.restore();
}

function drawPowerup(powerup) {
  const colors = {
    flight: "#d4f6ff",
    shield: "#a7f2ff",
    gem: "#ffd98a",
  };
  const symbols = {
    flight: "↑",
    shield: "◆",
    gem: "✦",
  };
  const color = colors[powerup.type];
  const bob = Math.sin(game.distance * 0.035 + powerup.x) * 4;
  const centerY = powerup.y + bob;

  context.save();
  context.shadowColor = color;
  context.shadowBlur = 19;
  context.fillStyle = "rgba(15, 9, 31, 0.88)";
  context.strokeStyle = color;
  context.lineWidth = 2;
  context.beginPath();
  context.arc(powerup.x, centerY, 14, 0, Math.PI * 2);
  context.fill();
  context.stroke();
  context.shadowBlur = 0;
  context.fillStyle = color;
  context.font = "bold 16px sans-serif";
  context.textAlign = "center";
  context.textBaseline = "middle";
  context.fillText(symbols[powerup.type], powerup.x, centerY + 1);
  context.restore();
}

function draw() {
  context.clearRect(0, 0, width, height);
  drawBackground();
  game.obstacles.forEach(drawObstacle);
  game.powerups.forEach(drawPowerup);
  drawPlayer();
}

function jump() {
  if (game.status !== "running" || !player.grounded) return;
  player.velocityY = -690;
  player.grounded = false;
}

function startGame() {
  game.status = "running";
  game.score = 0;
  const settings = difficulties[difficultySelect.value];
  game.speed = settings.startSpeed;
  game.obstacleTimer = settings.minObstacleGap;
  game.powerupTimer = 3.5;
  game.distance = 0;
  game.obstacles = [];
  game.powerups = [];
  game.flightTime = 0;
  game.shield = false;
  game.shieldFlash = 0;
  player.y = groundY - player.height;
  player.velocityY = 0;
  player.grounded = true;
  scoreElement.textContent = formatScore(game.score);
  difficultySelect.disabled = true;
  updatePowerStatus();
  overlay.classList.add("is-hidden");
  jumpHint.classList.add("is-visible");
  game.lastTime = performance.now();
  requestAnimationFrame(gameLoop);
}

function endGame() {
  game.status = "over";
  const finalScore = Math.floor(game.score);
  game.best = Math.max(game.best, finalScore);
  bestElement.textContent = formatScore(game.best);
  jumpHint.classList.remove("is-visible");
  overlayEmoji.textContent = "✦";
  overlayKicker.textContent = `${difficultySelect.value.toUpperCase()} MODE COMPLETE`;
  overlayTitle.textContent = "One more run?";
  overlayCopy.textContent = `You scored ${finalScore} points. Choose your next mode and beat your best.`;
  buttonLabel.textContent = "Run it back";
  difficultySelect.disabled = false;
  overlay.classList.remove("is-hidden");
  draw();
}

function spawnObstacle() {
  const obstacleHeight = 34 + Math.random() * 18;
  const obstacleWidth = 26 + Math.random() * 15;
  game.obstacles.push({
    x: width + 20,
    width: obstacleWidth,
    height: obstacleHeight,
  });
  const settings = difficulties[difficultySelect.value];
  game.obstacleTimer = settings.minObstacleGap
    + Math.random() * (settings.maxObstacleGap - settings.minObstacleGap);
}

function spawnPowerup() {
  const powerupTypes = ["flight", "shield", "gem"];
  const type = powerupTypes[Math.floor(Math.random() * powerupTypes.length)];
  game.powerups.push({
    type,
    x: width + 24,
    y: groundY - 58 - Math.random() * 77,
  });
  game.powerupTimer = 7 + Math.random() * 4;
}

function updatePowerStatus() {
  const active = [];
  if (game.flightTime > 0) active.push(`FLIGHT ${game.flightTime.toFixed(1)}s`);
  if (game.shield) active.push("SHIELD READY");
  powerStatus.textContent = active.length
    ? active.join(" · ")
    : "POWER-UPS: FLIGHT · SHIELD · GEMS";
  powerStatus.parentElement.classList.toggle("has-power", active.length > 0);
}

function collectPowerup(powerup) {
  if (powerup.type === "flight") {
    game.flightTime = 5;
  } else if (powerup.type === "shield") {
    game.shield = true;
  } else {
    game.score += 50;
    scoreElement.textContent = formatScore(Math.floor(game.score));
  }
  updatePowerStatus();
}

function collidesWithObstacle(obstacle) {
  const playerBounds = {
    left: player.x + 7,
    right: player.x + player.width - 5,
    top: player.y + 8,
    bottom: player.y + player.height,
  };
  const obstacleBounds = {
    left: obstacle.x + 3,
    right: obstacle.x + obstacle.width - 3,
    top: groundY - obstacle.height + 5,
    bottom: groundY,
  };

  return playerBounds.right > obstacleBounds.left
    && playerBounds.left < obstacleBounds.right
    && playerBounds.bottom > obstacleBounds.top
    && playerBounds.top < obstacleBounds.bottom;
}

function collectsPowerup(powerup) {
  const centerY = powerup.y + Math.sin(game.distance * 0.035 + powerup.x) * 4;
  return player.x + player.width > powerup.x - 14
    && player.x < powerup.x + 14
    && player.y + player.height > centerY - 14
    && player.y < centerY + 14;
}

function update(deltaTime) {
  const step = Math.min(deltaTime, 0.04);
  game.score += step * 10;
  const settings = difficulties[difficultySelect.value];
  const speedLevel = Math.floor(game.score / settings.pointsPerStep);
  game.speed = Math.min(
    settings.maxSpeed,
    settings.startSpeed + speedLevel * settings.speedStep,
  );
  game.distance += game.speed * step;
  scoreElement.textContent = formatScore(Math.floor(game.score));

  if (game.flightTime > 0) {
    game.flightTime = Math.max(0, game.flightTime - step);
    const flightHeight = groundY - player.height - 102;
    player.y += (flightHeight - player.y) * Math.min(1, step * 7);
    player.velocityY = 0;
    player.grounded = false;
  } else {
    player.velocityY += 1900 * step;
    player.y += player.velocityY * step;
    if (player.y + player.height >= groundY) {
      player.y = groundY - player.height;
      player.velocityY = 0;
      player.grounded = true;
    }
  }
  game.shieldFlash = Math.max(0, game.shieldFlash - step);

  game.obstacleTimer -= step;
  if (game.obstacleTimer <= 0) spawnObstacle();

  game.powerupTimer -= step;
  if (game.powerupTimer <= 0) spawnPowerup();

  for (let index = game.obstacles.length - 1; index >= 0; index -= 1) {
    const obstacle = game.obstacles[index];
    obstacle.x -= game.speed * step;
    if (collidesWithObstacle(obstacle)) {
      if (game.shield) {
        game.shield = false;
        game.shieldFlash = 0.45;
        game.obstacles.splice(index, 1);
        updatePowerStatus();
      } else {
        endGame();
        return;
      }
    }
  }
  game.obstacles = game.obstacles.filter((obstacle) => obstacle.x + obstacle.width > -10);

  for (const powerup of game.powerups) powerup.x -= game.speed * step;
  game.powerups = game.powerups.filter((powerup) => powerup.x > -24);
  for (let index = game.powerups.length - 1; index >= 0; index -= 1) {
    if (collectsPowerup(game.powerups[index])) {
      collectPowerup(game.powerups[index]);
      game.powerups.splice(index, 1);
    }
  }
  updatePowerStatus();
}

function gameLoop(timestamp) {
  if (game.status !== "running") return;
  const deltaTime = (timestamp - game.lastTime) / 1000;
  game.lastTime = timestamp;
  update(deltaTime);
  draw();
  if (game.status === "running") requestAnimationFrame(gameLoop);
}

playButton.addEventListener("click", startGame);

stage.addEventListener("pointerdown", (event) => {
  if (!event.target.closest("button, select") && game.status === "running") jump();
});

window.addEventListener("keydown", (event) => {
  if (event.code !== "Space" && event.code !== "ArrowUp" && event.code !== "KeyW") return;
  if (document.activeElement === difficultySelect) return;
  event.preventDefault();
  if (game.status === "ready" || game.status === "over") startGame();
  else jump();
});

window.addEventListener("resize", resizeCanvas);

resizeCanvas();
