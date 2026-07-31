const $ = (id) => document.getElementById(id);
const save = (key, value) => localStorage.setItem(key, JSON.stringify(value));
const load = (key, fallback) => { try { return JSON.parse(localStorage.getItem(key)) ?? fallback; } catch { return fallback; } };

const scoreKey = "game-night-leaderboard";
const liveSiteUrl = "https://acegamerz67257-sys.github.io/game-night-by-ayaan/";
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
  clearInterval(footballTimer);
  clearInterval(atlasTimer);
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
  if (game === "odd-even") { oddEven = newOddEven(); renderOddEven(); }
  if (game === "chopsticks") { chopsticks = newChopsticks(); renderChopsticks(); }
  if (game === "footballers") newFootballGame();
  if (game === "atlas") newAtlasGame();
}
$("player-name").value = localStorage.getItem("game-night-player-name") || "";
$("player-name").addEventListener("change", () => save("game-night-player-name", $("player-name").value.trim()));
document.querySelectorAll("[data-home]").forEach((button) => button.addEventListener("click", (event) => { event.preventDefault(); showHome(); }));
document.querySelectorAll("[data-open-game]").forEach((button) => button.addEventListener("click", () => openGame(button.dataset.openGame)));

// Sharing
const shareText = "Come play Game Night by Ayaan with me!";
$("whatsapp-share").href = `https://wa.me/?text=${encodeURIComponent(`${shareText} ${liveSiteUrl}`)}`;
if (window.QRCode) new QRCode($("qr-code"), { text: liveSiteUrl, width: 136, height: 136, colorDark: "#17233a", colorLight: "#ffffff", correctLevel: QRCode.CorrectLevel.M });
$("share-button").addEventListener("click", async () => {
  if (navigator.share) { try { await navigator.share({ title: "Game Night by Ayaan", text: shareText, url: liveSiteUrl }); } catch { /* The share sheet was closed. */ } }
  else { await copySiteLink(); }
});
async function copySiteLink() { try { await navigator.clipboard.writeText(liveSiteUrl); $("share-message").textContent = "Link copied — paste it anywhere you like."; } catch { $("share-message").textContent = liveSiteUrl; } }
$("copy-link").addEventListener("click", copySiteLink);

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

// Odd or Even
const newOddEven = () => ({ round: 1, wins: 0, points: 0, over: false });
let oddEven = newOddEven();
function renderOddEven(message = "Will the roll be odd or even?", result = "Choose Odd or Even to roll.") {
  $("odd-even-wins").textContent = oddEven.wins;
  $("odd-even-points").textContent = oddEven.points;
  $("odd-even-round").textContent = oddEven.over ? "Game complete" : `Round ${oddEven.round} / 5`;
  $("odd-even-message").textContent = message;
  $("odd-even-result").textContent = result;
}
document.querySelectorAll("[data-odd-even-choice]").forEach((button) => button.addEventListener("click", () => {
  if (oddEven.over) return renderOddEven("This game is over — start a new one!", "Use New game to play again.");
  const choice = button.dataset.oddEvenChoice;
  const roll = Math.floor(Math.random() * 6) + 1;
  const result = roll % 2 ? "odd" : "even";
  const correct = choice === result;
  let message = `The computer rolled ${roll} — ${result.toUpperCase()}!`;
  if (correct) { oddEven.wins++; oddEven.points += 20; message += " Great call! +20 points"; }
  else message += " Not this time.";
  if (oddEven.round === 5) {
    oddEven.over = true;
    recordScore("Odd or Even", oddEven.points);
    message += ` Game complete: ${oddEven.wins} correct call${oddEven.wins === 1 ? "" : "s"}.`;
  } else oddEven.round++;
  renderOddEven(message, `You chose ${choice}. The roll was ${roll} (${result}).`);
}));
$("odd-even-reset").addEventListener("click", () => { oddEven = newOddEven(); renderOddEven(); });

// Chopsticks — play against the Bot by tapping your hand, then a Bot hand.
const newChopsticks = () => ({ hands: [[1, 1], [1, 1]], selected: null, over: false });
let chopsticks = newChopsticks();
const handName = (hand) => hand === 0 ? "left" : "right";
function renderChopsticks(message = "Your turn — choose one of your hands.") {
  chopsticks.hands.flat().forEach((value, index) => {
    const player = Math.floor(index / 2), hand = index % 2, button = $(`chopsticks-p${player}h${hand}`);
    const canChoose = !chopsticks.over && player === 0 && chopsticks.selected === null && value > 0;
    const canAttack = !chopsticks.over && player === 1 && chopsticks.selected !== null && value > 0;
    button.querySelector("b").textContent = value;
    button.disabled = !canChoose && !canAttack;
    button.classList.toggle("out", value === 0);
    button.classList.toggle("selected", player === 0 && hand === chopsticks.selected);
    button.classList.toggle("target", canAttack);
    button.onclick = canChoose ? () => { chopsticks.selected = hand; renderChopsticks("Now tap one of the blue Bot hands to attack it."); } : canAttack ? () => playChopsticks(hand) : null;
  });
  $("chopsticks-player").classList.toggle("active", !chopsticks.over);
  $("chopsticks-bot").classList.remove("active");
  $("chopsticks-message").textContent = message;
  $("chopsticks-help").textContent = chopsticks.over ? "Start a new game to play again." : chopsticks.selected === null ? "Step 1: tap one of your hands." : "Step 2: tap a blue Bot hand.";
  const total = chopsticks.hands[0][0] + chopsticks.hands[0][1];
  $("chopsticks-split").classList.toggle("hidden", chopsticks.over || chopsticks.selected !== null || total === 0 || total % 2 || chopsticks.hands[0][0] === total / 2);
  $("chopsticks-split").textContent = `Split your hands evenly (${total / 2} and ${total / 2})`;
}
function botChopsticksMove() {
  const botHands = chopsticks.hands[1].map((value, hand) => ({ value, hand })).filter(({ value }) => value > 0);
  const playerHands = chopsticks.hands[0].map((value, hand) => ({ value, hand })).filter(({ value }) => value > 0);
  const attacker = botHands[Math.floor(Math.random() * botHands.length)];
  const target = playerHands[Math.floor(Math.random() * playerHands.length)];
  chopsticks.hands[0][target.hand] += attacker.value;
  if (chopsticks.hands[0][target.hand] >= 5) chopsticks.hands[0][target.hand] = 0;
  if (chopsticks.hands[0][0] === 0 && chopsticks.hands[0][1] === 0) { chopsticks.over = true; recordScore("Chopsticks", 0); return `Bot tapped your ${handName(target.hand)} hand. Bot wins!`; }
  return `Bot tapped your ${handName(target.hand)} hand. Your turn again.`;
}
function playChopsticks(botHand) {
  const attacker = chopsticks.hands[0][chopsticks.selected];
  chopsticks.hands[1][botHand] += attacker;
  if (chopsticks.hands[1][botHand] >= 5) chopsticks.hands[1][botHand] = 0;
  chopsticks.selected = null;
  if (chopsticks.hands[1][0] === 0 && chopsticks.hands[1][1] === 0) { chopsticks.over = true; recordScore("Chopsticks", 100); renderChopsticks(`You tapped the Bot’s ${handName(botHand)} hand. You win! +100 points`); return; }
  renderChopsticks(`You tapped the Bot’s ${handName(botHand)} hand. ${botChopsticksMove()}`);
}
$("chopsticks-split").addEventListener("click", () => { const total = chopsticks.hands[0][0] + chopsticks.hands[0][1]; chopsticks.hands[0] = [total / 2, total / 2]; renderChopsticks(`You split your hands. ${botChopsticksMove()}`); });
$("chopsticks-reset").addEventListener("click", () => { chopsticks = newChopsticks(); renderChopsticks(); });

// Footballer Name Challenge
const footballers = ["Lionel Messi","Cristiano Ronaldo","Kylian Mbappe","Erling Haaland","Neymar","Kevin De Bruyne","Mohamed Salah","Harry Kane","Robert Lewandowski","Vinicius Junior","Jude Bellingham","Luka Modric","Sergio Ramos","Virgil van Dijk","Karim Benzema","Antoine Griezmann","Son Heung-min","Bukayo Saka","Phil Foden","Cole Palmer","Rodri","Pedri","Gavi","Jamal Musiala","Florian Wirtz","Lamine Yamal","Ronaldo Nazario","Ronaldinho","Zinedine Zidane","Thierry Henry","David Beckham","Wayne Rooney","Andres Iniesta","Xavi","Paolo Maldini","Gianluigi Buffon","Manuel Neuer","Iker Casillas","Didier Drogba","Samuel Eto'o","George Weah","Pele","Diego Maradona","Zlatan Ibrahimovic","Luis Suarez","Eden Hazard","Gareth Bale","Steven Gerrard","Frank Lampard","Marcus Rashford","Bruno Fernandes","Bernardo Silva","Alisson Becker","Thibaut Courtois","Achraf Hakimi","Sadio Mane","Victor Osimhen","Declan Rice","Martin Odegaard"];
const footballKey = (value) => value.toLowerCase().replace(/[^a-z0-9]/g, "");
let footballGame = null, footballTimer = null;
function newFootballGame() { clearInterval(footballTimer); footballGame = { score: 0, remaining: 120, used: new Set(), history: [], over: false }; $("football-name").value = ""; $("football-name").disabled = false; $("football-form").querySelector("button").disabled = false; $("football-bot").innerHTML = "<small>Bot says</small>Waiting for your first name"; renderFootball(); footballTimer = setInterval(tickFootball, 1000); $("football-name").focus(); }
function renderFootball(message = "Name any footballer to begin.") { if (!footballGame) return; const seconds = Math.max(0, footballGame.remaining); const saved = load(scoreKey, []).find((item) => item.name.toLowerCase() === playerName().toLowerCase() && item.game === "Footballer Challenge")?.score || 0; $("football-score").textContent = footballGame.score; $("football-best").textContent = Math.max(saved, footballGame.score); $("football-timer").textContent = `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`; $("football-message").textContent = message; $("football-history").innerHTML = footballGame.history.length ? `<strong>Names used</strong>${footballGame.history.map((item) => `<p><b>${item.who}:</b> ${item.name}</p>`).reverse().join("")}` : ""; }
function finishFootball(message) { if (!footballGame || footballGame.over) return; footballGame.over = true; clearInterval(footballTimer); recordScore("Footballer Challenge", footballGame.score); $("football-name").disabled = true; $("football-form").querySelector("button").disabled = true; $("football-bot").innerHTML = `<small>Game complete</small>Your score: ${footballGame.score}`; renderFootball(message); }
function tickFootball() { if (!footballGame || footballGame.over) return; footballGame.remaining--; if (footballGame.remaining <= 0) { footballGame.remaining = 0; finishFootball("Time is up! Your best score is on the leaderboard."); } else renderFootball(footballGame.lastMessage || "Name another footballer."); }
async function findFootballer(typed) { const local = footballers.find((name) => footballKey(name) === footballKey(typed)); if (local) return local; try { const query = encodeURIComponent(`${typed} footballer`); const response = await fetch(`https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${query}&srlimit=1&format=json&origin=*`); const result = await response.json(); const match = result?.query?.search?.[0]; return match && /footballer|soccer player/i.test(match.snippet) ? match.title : typed; } catch { return typed; } }
function footballBotAnswer() { const options = footballers.filter((name) => !footballGame.used.has(footballKey(name))); const name = options[Math.floor(Math.random() * options.length)]; footballGame.used.add(footballKey(name)); footballGame.history.push({ who: "Bot", name }); $("football-bot").innerHTML = `<small>Bot says</small>${name}`; }
$("football-form").addEventListener("submit", async (event) => { event.preventDefault(); if (!footballGame || footballGame.over) return; const input = $("football-name"), typed = input.value.trim(), typedKey = footballKey(typed); if (!typedKey) return; if (footballGame.used.has(typedKey)) return finishFootball(`“${typed}” was already said. Game over!`); input.disabled = true; $("football-message").textContent = `Checking ${typed}…`; const known = await findFootballer(typed); if (!footballGame || footballGame.over) return; input.disabled = false; const knownKey = footballKey(known); if (footballGame.used.has(knownKey)) return finishFootball(`“${known}” was already said. Game over!`); footballGame.used.add(knownKey); footballGame.history.push({ who: "You", name: known }); footballGame.score++; footballGame.lastMessage = `Good one! ${known} gives you 1 point.`; input.value = ""; footballBotAnswer(); renderFootball(footballGame.lastMessage); });
$("football-reset").addEventListener("click", newFootballGame);

// Atlas — use the last letter of each place name to continue the chain.
const atlasPlaces = ["Agra","Amsterdam","Athens","Australia","Argentina","Alaska","Abu Dhabi","Bengaluru","Berlin","Bhopal","Barcelona","Brazil","Brussels","Bangalore","Cairo","Canada","Chennai","Chicago","China","Colombo","Delhi","Dubai","Dublin","Denmark","Edinburgh","England","Egypt","Ethiopia","France","Fiji","Florence","Finland","Goa","Germany","Geneva","Gujarat","Greece","Hanoi","Hyderabad","Hawaii","Hong Kong","Hungary","India","Iceland","Indonesia","Iran","Italy","Jaipur","Japan","Jordan","Jakarta","Kolkata","Kenya","Kochi","Kashmir","London","Lucknow","Lisbon","Ladakh","Mumbai","Madrid","Mexico","Mysore","Nepal","Nigeria","New York","Norway","Oman","Oslo","Ottawa","Paris","Peru","Punjab","Portugal","Qatar","Quebec","Rome","Russia","Rajasthan","Riyadh","Spain","Singapore","Sweden","Sydney","Switzerland","Thailand","Tokyo","Turkey","Toronto","Udaipur","Uganda","United Kingdom","United States","Venice","Vietnam","Varanasi","Wales","Washington","Yemen","Zurich","Zimbabwe"];
const atlasKey = (value) => value.toLowerCase().replace(/[^a-z]/g, "");
const atlasFirst = (value) => atlasKey(value)[0] || "";
const atlasLast = (value) => { const letters = atlasKey(value); return letters[letters.length - 1] || ""; };
let atlasGame = null, atlasTimer = null;
function newAtlasGame() { clearInterval(atlasTimer); atlasGame = { score: 0, remaining: 120, used: new Set(), history: [], needed: "", over: false }; $("atlas-name").value = ""; $("atlas-name").disabled = false; $("atlas-form").querySelector("button").disabled = false; $("atlas-bot").innerHTML = "<small>Bot says</small>Waiting for your first place"; renderAtlas(); atlasTimer = setInterval(tickAtlas, 1000); $("atlas-name").focus(); }
function renderAtlas(message = "Name any place to begin.") { if (!atlasGame) return; const seconds = Math.max(0, atlasGame.remaining); const saved = load(scoreKey, []).find((item) => item.name.toLowerCase() === playerName().toLowerCase() && item.game === "Atlas")?.score || 0; $("atlas-score").textContent = atlasGame.score; $("atlas-best").textContent = Math.max(saved, atlasGame.score); $("atlas-timer").textContent = `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`; $("atlas-letter").innerHTML = atlasGame.needed ? `Your place must start with <b>${atlasGame.needed.toUpperCase()}</b>` : "Start with <b>any letter</b>"; $("atlas-message").textContent = message; $("atlas-history").innerHTML = atlasGame.history.length ? `<strong>Places used</strong>${atlasGame.history.map((item) => `<p><b>${item.who}:</b> ${item.name}</p>`).reverse().join("")}` : ""; }
function finishAtlas(message) { if (!atlasGame || atlasGame.over) return; atlasGame.over = true; clearInterval(atlasTimer); recordScore("Atlas", atlasGame.score); $("atlas-name").disabled = true; $("atlas-form").querySelector("button").disabled = true; $("atlas-bot").innerHTML = `<small>Game complete</small>Your score: ${atlasGame.score}`; renderAtlas(message); }
function tickAtlas() { if (!atlasGame || atlasGame.over) return; atlasGame.remaining--; if (atlasGame.remaining <= 0) { atlasGame.remaining = 0; finishAtlas("Time is up! Your best score is on the leaderboard."); } else renderAtlas(atlasGame.lastMessage || "Name another place."); }
function atlasBotAnswer() { const options = atlasPlaces.filter((place) => atlasFirst(place) === atlasGame.needed && !atlasGame.used.has(atlasKey(place))); if (!options.length) return finishAtlas(`The Bot cannot find a new place starting with ${atlasGame.needed.toUpperCase()}. You win!`); const place = options[Math.floor(Math.random() * options.length)]; atlasGame.used.add(atlasKey(place)); atlasGame.history.push({ who: "Bot", name: place }); atlasGame.needed = atlasLast(place); $("atlas-bot").innerHTML = `<small>Bot says</small>${place}`; }
$("atlas-form").addEventListener("submit", (event) => { event.preventDefault(); if (!atlasGame || atlasGame.over) return; const input = $("atlas-name"), typed = input.value.trim(), key = atlasKey(typed); if (!key) return; if (atlasGame.used.has(key)) return finishAtlas(`“${typed}” was already used. Game over!`); if (atlasGame.needed && atlasFirst(typed) !== atlasGame.needed) { $("atlas-message").textContent = `That place must start with ${atlasGame.needed.toUpperCase()}. Try again.`; return; } atlasGame.used.add(key); atlasGame.history.push({ who: "You", name: typed }); atlasGame.score++; atlasGame.needed = atlasLast(typed); atlasGame.lastMessage = `Good one! ${typed} gives you 1 point.`; input.value = ""; atlasBotAnswer(); renderAtlas(atlasGame.lastMessage); });
$("atlas-reset").addEventListener("click", newAtlasGame);

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
