const $ = (id) => document.getElementById(id);
const save = (key, value) => localStorage.setItem(key, JSON.stringify(value));
const load = (key, fallback) => { try { return JSON.parse(localStorage.getItem(key)) ?? fallback; } catch { return fallback; } };

const scoreKey = "game-night-leaderboard";
function playerName() { return $("player-name").value.trim() || "Player"; }
function recordScore(game, score) {
  const scores = load(scoreKey, []);
  const name = playerName();
  const existing = scores.find((item) => item.name.toLowerCase() === name.toLowerCase() && item.game === game);
  if (existing) existing.score = Math.max(existing.score, score);
  else scores.push({ name, game, score });
  save(scoreKey, scores); renderLeaderboard();
}
function renderLeaderboard() {
  const scores = load(scoreKey, []).sort((a, b) => b.score - a.score || a.name.localeCompare(b.name));
  $("leaderboard-list").innerHTML = scores.length
    ? `<ol>${scores.map((item) => `<li><span><b>${item.name}</b><small>${item.game}</small></span><strong>${item.score}</strong></li>`).join("")}</ol>`
    : "<p class=empty-scores>Play a game to put your name on the board.</p>";
}
function showHome() {
  clearInterval(numberTimer);
  document.querySelectorAll(".game-screen").forEach((screen) => screen.classList.add("hidden"));
  $("home").classList.remove("hidden"); window.scrollTo({ top: 0, behavior: "smooth" }); renderLeaderboard();
}
function openGame(game) {
  const name = $("player-name").value.trim();
  save("game-night-player-name", name); $("home").classList.add("hidden");
  document.querySelectorAll(".game-screen").forEach((screen) => screen.classList.add("hidden"));
  $(game).classList.remove("hidden"); window.scrollTo({ top: 0, behavior: "smooth" });
  if (game === "number") newNumberGame();
  if (game === "rps") { rps = newRps(); renderRps(); }
  if (game === "tic-tac-toe") { ttt = newTtt(); renderTtt(); }
}
$("player-name").value = localStorage.getItem("game-night-player-name") || "";
$("player-name").addEventListener("change", () => save("game-night-player-name", $("player-name").value.trim()));
document.querySelectorAll("[data-home]").forEach((button) => button.addEventListener("click", (event) => { event.preventDefault(); showHome(); }));
document.querySelectorAll("[data-open-game]").forEach((button) => button.addEventListener("click", () => openGame(button.dataset.openGame)));

// Rock Paper Scissors
const moves = ["rock", "paper", "scissors"];
const newRps = () => ({ round: 1, player: 0, computer: 0, points: 0, over: false });
let rps = newRps();
function renderRps(message = "Make your move.") {
  $("rps-player-score").textContent = rps.player; $("rps-computer-score").textContent = rps.computer;
  $("rps-round").textContent = rps.over ? "Game complete" : `Round ${rps.round} / 5`;
  $("rps-points").textContent = `${rps.points} points`; $("rps-message").textContent = message;
}
document.querySelectorAll("[data-rps-move]").forEach((button) => button.addEventListener("click", () => {
  if (rps.over) return renderRps("This game is over — start a new one!");
  const you = button.dataset.rpsMove, computer = moves[Math.floor(Math.random() * moves.length)];
  let message;
  if (you === computer) { rps.points += 5; message = `Tie — you both chose ${you}. +5 points`; }
  else if ((you === "rock" && computer === "scissors") || (you === "paper" && computer === "rock") || (you === "scissors" && computer === "paper")) { rps.player++; rps.points += 20; message = `${you[0].toUpperCase()+you.slice(1)} beats ${computer}. You win! +20 points`; }
  else { rps.computer++; message = `Computer chose ${computer}. Better luck next round.`; }
  if (rps.round === 5) { rps.over = true; const result = rps.player === rps.computer ? "It is a draw!" : rps.player > rps.computer ? "You won the game!" : "Computer won the game."; message += ` ${result}`; recordScore("Rock Paper Scissors", rps.points); }
  else rps.round++;
  renderRps(message);
}));
$("rps-reset").addEventListener("click", () => { rps = newRps(); renderRps(); });

// Number Challenge — the timer starts only when this game is opened.
let numberGame = null, numberTimer = null;
function newNumberGame() { clearInterval(numberTimer); numberGame = { round: 1, secret: randomSecret(), attempts: 0, points: 0, remaining: 120, waiting: false, over: false }; numberTimer = setInterval(tickNumberGame, 1000); renderNumber("Pick a number from 1 to 100."); }
function randomSecret() { return Math.floor(Math.random() * 100) + 1; }
function tickNumberGame() { if (!numberGame || numberGame.waiting || numberGame.over) return; numberGame.remaining--; if (numberGame.remaining <= 0) finishNumberRound(`Time's up! The number was ${numberGame.secret}.`); else renderNumber(); }
function renderNumber(message) { if (!numberGame) return; const seconds = Math.max(0, numberGame.remaining); $("number-round").textContent = `${numberGame.round} / 3`; $("number-timer").textContent = `${Math.floor(seconds/60)}:${String(seconds%60).padStart(2,"0")}`; $("number-points").textContent = numberGame.points; $("number-attempts").textContent = `${numberGame.attempts} guess${numberGame.attempts === 1 ? "" : "es"} this round`; if (message) $("number-message").textContent = message; $("number-form").classList.toggle("hidden", numberGame.waiting || numberGame.over); $("number-next").classList.toggle("hidden", !numberGame.waiting); $("number-next").textContent = numberGame.round === 3 ? "Finish game 🏆" : "Next round →"; }
function finishNumberRound(message) { numberGame.waiting = true; clearInterval(numberTimer); renderNumber(message); }
$("number-form").addEventListener("submit", (event) => { event.preventDefault(); const input = $("number-guess"), guess = Number(input.value); if (!Number.isInteger(guess) || guess < 1 || guess > 100) return renderNumber("Please enter a whole number from 1 to 100."); numberGame.attempts++; input.value = ""; if (guess === numberGame.secret) { const earned = Math.max(10, 110 - numberGame.attempts * 10 - Math.floor((120 - numberGame.remaining) / 10) * 2); numberGame.points += earned; finishNumberRound(`Correct! You earned ${earned} points.`); } else renderNumber(guess < numberGame.secret ? "Too low — try higher." : "Too high — try lower."); });
$("number-next").addEventListener("click", () => { if (numberGame.round === 3) { numberGame.over = true; numberGame.waiting = false; recordScore("Number Challenge", numberGame.points); renderNumber(`Game complete! You scored ${numberGame.points} points.`); } else { numberGame.round++; numberGame.secret = randomSecret(); numberGame.attempts = 0; numberGame.remaining = 120; numberGame.waiting = false; numberTimer = setInterval(tickNumberGame, 1000); renderNumber("Next round: pick a number from 1 to 100."); } });
$("number-reset").addEventListener("click", newNumberGame);

// Tic-Tac-Toe
const newTtt = () => ({ board: Array(9).fill(""), turn: "X", x: 0, o: 0, done: false });
let ttt = newTtt();
const winningLines = [[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]];
function winner() { return winningLines.find((line) => line.every((i) => ttt.board[i] && ttt.board[i] === ttt.board[line[0]])); }
function renderTtt(message) { $("ttt-board").innerHTML = ""; ttt.board.forEach((mark, i) => { const cell = document.createElement("button"); cell.className = `cell ${mark.toLowerCase()}`; cell.textContent = mark; cell.disabled = Boolean(mark) || ttt.done; cell.setAttribute("aria-label", mark ? `Square ${i + 1}: ${mark}` : `Square ${i + 1}`); cell.addEventListener("click", () => playTtt(i)); $("ttt-board").append(cell); }); $("ttt-message").textContent = message || `Player ${ttt.turn}'s turn`; $("ttt-score").textContent = `X: ${ttt.x} wins · O: ${ttt.o} wins`; }
function playTtt(index) { if (ttt.board[index] || ttt.done) return; ttt.board[index] = ttt.turn; if (winner()) { ttt.done = true; if (ttt.turn === "X") ttt.x++; else ttt.o++; recordScore("Tic-Tac-Toe", 30); renderTtt(`Player ${ttt.turn} wins!`); } else if (ttt.board.every(Boolean)) { ttt.done = true; recordScore("Tic-Tac-Toe", 10); renderTtt("It is a draw!"); } else { ttt.turn = ttt.turn === "X" ? "O" : "X"; renderTtt(); } }
$("ttt-reset").addEventListener("click", () => { ttt = { ...ttt, board: Array(9).fill(""), turn: "X", done: false }; renderTtt(); });

renderLeaderboard();
