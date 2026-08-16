const $ = (id) => document.getElementById(id);
const save = (key, value) => localStorage.setItem(key, JSON.stringify(value));
const load = (key, fallback) => { try { return JSON.parse(localStorage.getItem(key)) ?? fallback; } catch { return fallback; } };

const scoreKey = "game-night-leaderboard";
const accountKey = "game-night-accounts";
const activeAccountKey = "game-night-active-account";
const liveSiteUrl = "https://acegamerz67257-sys.github.io/game-night-by-ayaan/";
const audioSettingKey = "game-night-audio-enabled";
// Anonymous site totals. This quietly does nothing while playing from a local file.
function trackSiteActivity(event, detail = {}) {
  fetch("track.php", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ event, page: location.pathname.split("/").pop() || "index.html", ...detail }),
    keepalive: true
  }).catch(() => {});
}
trackSiteActivity("page_view");
let audioEnabled = true;
let audioContext = null, musicTimer = null, musicStep = 0;
function ensureAudio() {
  if (!audioEnabled) return null;
  if (!window.AudioContext && !window.webkitAudioContext) return null;
  if (!audioContext) audioContext = new (window.AudioContext || window.webkitAudioContext)();
  if (audioContext.state === "suspended") audioContext.resume();
  return audioContext;
}
function sound(freq, duration = .12, volume = .045, type = "sine") {
  const context = ensureAudio();
  if (!context) return;
  const oscillator = context.createOscillator(), gain = context.createGain(), now = context.currentTime;
  oscillator.type = type; oscillator.frequency.setValueAtTime(freq, now);
  gain.gain.setValueAtTime(.0001, now); gain.gain.exponentialRampToValueAtTime(volume, now + .012); gain.gain.exponentialRampToValueAtTime(.0001, now + duration);
  oscillator.connect(gain).connect(context.destination); oscillator.start(now); oscillator.stop(now + duration + .02);
}
function playClickSound() { sound(700, .11, .11, "square"); }
function stopGameMusic() { clearInterval(musicTimer); musicTimer = null; }
function playMusicStep() {
  const melody = [262, 330, 392, 330, 294, 349, 440, 349, 262, 392, 494, 392];
  sound(melody[musicStep % melody.length], .28, .055, "triangle");
  if (musicStep % 4 === 0) sound(melody[(musicStep + 4) % melody.length] / 2, .34, .035, "sine");
  musicStep++;
}
function startGameMusic() { if (!audioEnabled || musicTimer) return; ensureAudio(); musicStep = 0; playMusicStep(); musicTimer = setInterval(playMusicStep, 340); }
function refreshAudioButton() { $("audio-toggle").textContent = `Sound: ${audioEnabled ? "On" : "Off"}`; $("audio-toggle").setAttribute("aria-pressed", String(audioEnabled)); }
function playerName() { return localStorage.getItem(activeAccountKey) || "Player"; }
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
  clearInterval(footballAtlasTimer);
  clearInterval(capitalsTimer);
  clearInterval(mathTimer);
  clearInterval(continentsTimer);
  clearInterval(footballCountriesTimer);
  stopGameMusic();
  document.querySelectorAll(".game-screen").forEach((screen) => screen.classList.add("hidden"));
  $("home").classList.remove("hidden"); window.scrollTo({ top: 0, behavior: "smooth" }); renderLeaderboard();
}
function openGame(game) {
  trackSiteActivity("game_start", { game });
  $("home").classList.add("hidden");
  document.querySelectorAll(".game-screen").forEach((screen) => screen.classList.add("hidden"));
  $(game).classList.remove("hidden"); window.scrollTo({ top: 0, behavior: "smooth" });
  startGameMusic();
  if (game === "number") newNumberGame();
  if (game === "rps") { rps = newRps(); renderRps(); }
  if (game === "tic-tac-toe") { ttt = newTtt(); renderTtt(); }
  if (game === "odd-even") { oddEven = newOddEven(); renderOddEven(); }
  if (game === "chopsticks") { chopsticks = newChopsticks(); renderChopsticks(); }
  if (game === "footballers") newFootballGame();
  if (game === "atlas") newAtlasGame();
  if (game === "footballer-atlas") newFootballerAtlasGame();
  if (game === "country-capitals") newCountryCapitalsGame();
  if (game === "math-puzzle") newMathPuzzleGame();
  if (game === "countries-continents") newContinentsGame();
  if (game === "footballer-countries") newFootballerCountriesGame();
}
document.querySelectorAll("[data-home]").forEach((button) => button.addEventListener("click", (event) => { event.preventDefault(); showHome(); }));
document.querySelectorAll("[data-open-game]").forEach((button) => button.addEventListener("click", () => { playClickSound(); openGame(button.dataset.openGame); }));
let pendingNewGameButton = null;
function closeNewGameConfirm() { $("new-game-modal").classList.add("hidden"); pendingNewGameButton = null; }
document.addEventListener("click", (event) => {
  const button = event.target.closest(".new-game-button");
  if (!button) return;
  if (button.dataset.confirmed === "true") { delete button.dataset.confirmed; return; }
  event.preventDefault(); event.stopImmediatePropagation();
  pendingNewGameButton = button;
  $("new-game-modal").classList.remove("hidden");
  $("new-game-cancel").focus();
}, true);
$("new-game-cancel").addEventListener("click", closeNewGameConfirm);
$("new-game-confirm").addEventListener("click", () => {
  if (!pendingNewGameButton) return closeNewGameConfirm();
  const button = pendingNewGameButton;
  closeNewGameConfirm();
  button.dataset.confirmed = "true";
  button.click();
});
$("new-game-modal").addEventListener("click", (event) => { if (event.target === $("new-game-modal")) closeNewGameConfirm(); });
document.addEventListener("keydown", (event) => { if (event.key === "Escape" && !$("new-game-modal").classList.contains("hidden")) closeNewGameConfirm(); });
document.addEventListener("click", (event) => { if (event.target.closest("button") && event.target.id !== "audio-toggle" && !event.target.closest("[data-open-game]")) playClickSound(); });
$("audio-toggle").addEventListener("click", () => { audioEnabled = !audioEnabled; localStorage.setItem(audioSettingKey, audioEnabled ? "on" : "off"); if (!audioEnabled) stopGameMusic(); else { playClickSound(); const activeGame = [...document.querySelectorAll(".game-screen")].some((screen) => !screen.classList.contains("hidden")); if (activeGame) startGameMusic(); } refreshAudioButton(); });
$("menu-toggle").addEventListener("click", () => { const menu = $("site-nav"), open = menu.classList.toggle("mobile-open"); $("menu-toggle").setAttribute("aria-expanded", String(open)); $("menu-toggle").setAttribute("aria-label", open ? "Close menu" : "Open menu"); });
$("site-nav").addEventListener("click", () => { $("site-nav").classList.remove("mobile-open"); $("menu-toggle").setAttribute("aria-expanded", "false"); $("menu-toggle").setAttribute("aria-label", "Open menu"); });
refreshAudioButton();

// Local player accounts — a simple four-digit code for this browser.
let accountMode = "login";
function accounts() { return load(accountKey, {}); }
function setLoginMode(mode) {
  accountMode = mode;
  $("login-title").textContent = mode === "login" ? "Log in" : "Create account";
  $("login-note").textContent = mode === "login" ? "Enter your username and four-digit code." : "Choose a username and your own four-digit code.";
  $("login-submit").textContent = mode === "login" ? "Log in" : "Create account";
  $("switch-login-mode").textContent = mode === "login" ? "New player? Create an account" : "Already have an account? Log in";
  $("login-message").textContent = "";
}
function refreshAccountUi() {
  const name = localStorage.getItem(activeAccountKey);
  $("login-button").classList.toggle("hidden", Boolean(name));
  $("logout-button").classList.toggle("hidden", !name);
  if (name) $("logout-button").textContent = `Log out ${name}`;
}
function openLogin(mode = "login") { setLoginMode(mode); $("login-name").value = localStorage.getItem(activeAccountKey) || ""; $("login-pin").value = ""; $("login-modal").classList.remove("hidden"); $("login-name").focus(); }
function closeLogin() { $("login-modal").classList.add("hidden"); }
$("login-button").addEventListener("click", () => openLogin());
$("logout-button").addEventListener("click", () => { localStorage.removeItem(activeAccountKey); refreshAccountUi(); });
$("close-login").addEventListener("click", closeLogin);
$("switch-login-mode").addEventListener("click", () => setLoginMode(accountMode === "login" ? "create" : "login"));
$("login-modal").addEventListener("click", (event) => { if (event.target === $("login-modal")) closeLogin(); });
$("login-form").addEventListener("submit", (event) => {
  event.preventDefault();
  const name = $("login-name").value.trim(), pin = $("login-pin").value;
  if (!name || !/^\d{4}$/.test(pin)) { $("login-message").textContent = "Use a username and exactly four digits."; return; }
  const allAccounts = accounts(), key = name.toLowerCase();
  if (accountMode === "create") {
    if (allAccounts[key]) { $("login-message").textContent = "That username already exists on this browser. Try logging in."; return; }
    allAccounts[key] = { name, pin }; save(accountKey, allAccounts);
  } else if (!allAccounts[key] || allAccounts[key].pin !== pin) { $("login-message").textContent = "Username or four-digit code is incorrect."; return; }
  localStorage.setItem(activeAccountKey, allAccounts[key].name);
  refreshAccountUi(); closeLogin();
});
refreshAccountUi();
// Offer the optional login as soon as the website opens. Players can close it with × and play for fun.
window.setTimeout(() => openLogin("login"), 120);

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

// Footballer Atlas — chain footballer names by their final letter.
let footballAtlasGame = null, footballAtlasTimer = null;
function newFootballerAtlasGame() { clearInterval(footballAtlasTimer); footballAtlasGame = { score: 0, remaining: 120, used: new Set(), history: [], needed: "", over: false }; $("football-atlas-name").value = ""; $("football-atlas-name").disabled = false; $("football-atlas-form").querySelector("button").disabled = false; $("football-atlas-bot").innerHTML = "<small>Bot says</small>Waiting for your first footballer"; renderFootballerAtlas(); footballAtlasTimer = setInterval(tickFootballerAtlas, 1000); $("football-atlas-name").focus(); }
function renderFootballerAtlas(message = "Name any footballer to begin.") { if (!footballAtlasGame) return; const seconds = Math.max(0, footballAtlasGame.remaining); const saved = load(scoreKey, []).find((item) => item.name.toLowerCase() === playerName().toLowerCase() && item.game === "Footballer Atlas")?.score || 0; $("football-atlas-score").textContent = footballAtlasGame.score; $("football-atlas-best").textContent = Math.max(saved, footballAtlasGame.score); $("football-atlas-timer").textContent = `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`; $("football-atlas-letter").innerHTML = footballAtlasGame.needed ? `Your footballer must start with <b>${footballAtlasGame.needed.toUpperCase()}</b>` : "Start with <b>any letter</b>"; $("football-atlas-message").textContent = message; $("football-atlas-history").innerHTML = footballAtlasGame.history.length ? `<strong>Footballers used</strong>${footballAtlasGame.history.map((item) => `<p><b>${item.who}:</b> ${item.name}</p>`).reverse().join("")}` : ""; }
function finishFootballerAtlas(message) { if (!footballAtlasGame || footballAtlasGame.over) return; footballAtlasGame.over = true; clearInterval(footballAtlasTimer); recordScore("Footballer Atlas", footballAtlasGame.score); $("football-atlas-name").disabled = true; $("football-atlas-form").querySelector("button").disabled = true; $("football-atlas-bot").innerHTML = `<small>Game complete</small>Your score: ${footballAtlasGame.score}`; renderFootballerAtlas(message); }
function tickFootballerAtlas() { if (!footballAtlasGame || footballAtlasGame.over) return; footballAtlasGame.remaining--; if (footballAtlasGame.remaining <= 0) { footballAtlasGame.remaining = 0; finishFootballerAtlas("Time is up! Your best score is on the leaderboard."); } else renderFootballerAtlas(footballAtlasGame.lastMessage || "Name another footballer."); }
function footballerAtlasBotAnswer() { const options = footballers.filter((name) => footballKey(name)[0] === footballAtlasGame.needed && !footballAtlasGame.used.has(footballKey(name))); if (!options.length) return finishFootballerAtlas(`The Bot cannot find a new footballer starting with ${footballAtlasGame.needed.toUpperCase()}. You win!`); const name = options[Math.floor(Math.random() * options.length)]; footballAtlasGame.used.add(footballKey(name)); footballAtlasGame.history.push({ who: "Bot", name }); const letters = footballKey(name); footballAtlasGame.needed = letters[letters.length - 1]; $("football-atlas-bot").innerHTML = `<small>Bot says</small>${name}`; }
$("football-atlas-form").addEventListener("submit", (event) => { event.preventDefault(); if (!footballAtlasGame || footballAtlasGame.over) return; const input = $("football-atlas-name"), typed = input.value.trim(), key = footballKey(typed); if (!key) return; if (footballAtlasGame.used.has(key)) return finishFootballerAtlas(`“${typed}” was already used. Game over!`); if (footballAtlasGame.needed && key[0] !== footballAtlasGame.needed) { $("football-atlas-message").textContent = `That footballer must start with ${footballAtlasGame.needed.toUpperCase()}. Try again.`; return; } footballAtlasGame.used.add(key); footballAtlasGame.history.push({ who: "You", name: typed }); footballAtlasGame.score++; footballAtlasGame.lastMessage = `Good one! ${typed} gives you 1 point.`; const letters = footballKey(typed); footballAtlasGame.needed = letters[letters.length - 1]; input.value = ""; footballerAtlasBotAnswer(); renderFootballerAtlas(footballAtlasGame.lastMessage); });
$("football-atlas-reset").addEventListener("click", newFootballerAtlasGame);

// Country Capitals — three modes with a two-minute worldwide quiz.
const capitalEasy = [["India","New Delhi"],["France","Paris"],["Japan","Tokyo"],["Italy","Rome"],["United Kingdom","London"],["United States","Washington, D.C."],["Australia","Canberra"],["Brazil","Brasilia"],["Canada","Ottawa"],["China","Beijing"],["Germany","Berlin"],["Egypt","Cairo"]];
const capitalNormal = [...capitalEasy,["Argentina","Buenos Aires"],["Mexico","Mexico City"],["Nigeria","Abuja"],["South Korea","Seoul"],["Saudi Arabia","Riyadh"],["Thailand","Bangkok"],["Vietnam","Hanoi"],["Turkey","Ankara"],["Netherlands","Amsterdam"],["Portugal","Lisbon"]];
const capitalHard = [...capitalNormal,["Kazakhstan","Astana"],["Myanmar","Naypyidaw"],["Sri Lanka","Sri Jayawardenepura Kotte"],["Côte d’Ivoire","Yamoussoukro"],["Kyrgyzstan","Bishkek"],["Eswatini","Mbabane"],["Tanzania","Dodoma"],["Belize","Belmopan"],["Micronesia","Palikir"],["Burundi","Gitega"],["Maldives","Male"]];
const normalCapital = (value) => value.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z]/g, "");
let capitalsMode = "easy", capitalsGame = null, capitalsTimer = null, worldwideCapitals = [];
function capitalQuestions() { const pool = worldwideCapitals.length ? [...worldwideCapitals] : [...capitalHard]; return pool.sort(() => Math.random() - .5); }
async function loadWorldwideCapitals() { if (worldwideCapitals.length) return; try { const response = await fetch("https://restcountries.com/v3.1/all?fields=name,capital"); const countries = await response.json(); worldwideCapitals = countries.map((country) => [country.name?.common, country.capital?.[0]]).filter(([country, capital]) => country && capital); } catch { worldwideCapitals = [...capitalHard]; } }
function newCountryCapitalsGame() { clearInterval(capitalsTimer); capitalsGame = null; $("capitals-start").classList.remove("hidden"); $("capitals-play").classList.add("hidden"); $("capitals-start-button").disabled = false; $("capitals-start-button").textContent = "Start 2-minute game"; }
function renderCapitals(message) { if (!capitalsGame) return; const current = capitalsGame.questions[capitalsGame.index], seconds = Math.max(0, capitalsGame.remaining); const saved = load(scoreKey, []).find((item) => item.name.toLowerCase() === playerName().toLowerCase() && item.game === "Country Capitals")?.score || 0; $("capitals-score").textContent = capitalsGame.score; $("capitals-best").textContent = Math.max(saved, capitalsGame.score); $("capitals-timer").textContent = `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`; $("capitals-country").innerHTML = `<small>Bot says</small>${current[0]}`; if (message) $("capitals-message").textContent = message; else if (capitalsGame.mode === "easy") $("capitals-message").textContent = `Hint: the capital starts with “${current[1][0]}”.`; else $("capitals-message").textContent = `What is the capital of ${current[0]}?`; }
function finishCapitals(message = `Time is up! You scored ${capitalsGame.score} point${capitalsGame.score === 1 ? "" : "s"}.`) { if (!capitalsGame || capitalsGame.over) return; capitalsGame.over = true; clearInterval(capitalsTimer); recordScore("Country Capitals", capitalsGame.score); $("capitals-answer").disabled = true; $("capitals-form").querySelector("button").disabled = true; $("capitals-next").classList.add("hidden"); renderCapitals(message); }
function tickCapitals() { if (!capitalsGame || capitalsGame.over) return; capitalsGame.remaining--; if (capitalsGame.remaining <= 0) { capitalsGame.remaining = 0; finishCapitals(); } else renderCapitals(); }
async function startCapitals() { $("capitals-start-button").disabled = true; $("capitals-start-button").textContent = "Loading countries…"; await loadWorldwideCapitals(); capitalsGame = { mode: capitalsMode, questions: capitalQuestions(), index: 0, score: 0, remaining: 120, answered: false, over: false }; $("capitals-start").classList.add("hidden"); $("capitals-play").classList.remove("hidden"); $("capitals-answer").disabled = false; $("capitals-form").querySelector("button").disabled = false; $("capitals-next").classList.add("hidden"); $("capitals-answer").value = ""; renderCapitals(); capitalsTimer = setInterval(tickCapitals, 1000); $("capitals-answer").focus(); }
document.querySelectorAll("[data-capitals-mode]").forEach((button) => button.addEventListener("click", () => { capitalsMode = button.dataset.capitalsMode; document.querySelectorAll("[data-capitals-mode]").forEach((item) => item.classList.toggle("selected", item === button)); }));
$("capitals-start-button").addEventListener("click", startCapitals);
$("capitals-form").addEventListener("submit", (event) => { event.preventDefault(); if (!capitalsGame || capitalsGame.answered || capitalsGame.over) return; const current = capitalsGame.questions[capitalsGame.index], guess = $("capitals-answer").value.trim(); if (!guess) return; capitalsGame.answered = true; const outcome = normalCapital(guess) === normalCapital(current[1]) ? `Correct! ${current[1]} is the capital of ${current[0]}. +1 point` : `Not quite. The capital of ${current[0]} is ${current[1]}.`; if (normalCapital(guess) === normalCapital(current[1])) capitalsGame.score++; $("capitals-answer").disabled = true; $("capitals-form").querySelector("button").disabled = true; $("capitals-next").classList.remove("hidden"); renderCapitals(outcome); });
$("capitals-next").addEventListener("click", () => { if (capitalsGame.index + 1 === capitalsGame.questions.length) { capitalsGame.questions = capitalQuestions(); capitalsGame.index = 0; } else capitalsGame.index++; capitalsGame.answered = false; $("capitals-answer").value = ""; $("capitals-answer").disabled = false; $("capitals-form").querySelector("button").disabled = false; $("capitals-next").classList.add("hidden"); renderCapitals(); $("capitals-answer").focus(); });
$("capitals-reset").addEventListener("click", newCountryCapitalsGame);
$("capitals-start-reset").addEventListener("click", newCountryCapitalsGame);

let mathMode = "easy", mathGame = null, mathTimer = null;
function mathRandom(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }
function newMathQuestion() {
  const operation = ["+", "−", "×", "÷"][mathRandom(0, 3)];
  let a, b, result;
  const blank = mathRandom(0, 2);
  if (mathMode === "easy") {
    if (operation === "+") { a = mathRandom(1, 8); b = mathRandom(1, 9 - a); result = a + b; }
    if (operation === "−") { a = mathRandom(2, 9); b = mathRandom(1, a - 1); result = a - b; }
    if (operation === "×") { a = mathRandom(1, 9); b = mathRandom(1, Math.floor(9 / a)); result = a * b; }
    if (operation === "÷") { b = mathRandom(1, 9); result = mathRandom(1, Math.floor(9 / b)); a = b * result; }
  } else if (mathMode === "normal") {
    if (operation === "+") { a = mathRandom(10, 89); b = mathRandom(10, 99 - a); result = a + b; }
    if (operation === "−") { a = mathRandom(20, 99); b = mathRandom(10, a - 10); result = a - b; }
    if (operation === "×") { a = mathRandom(10, 19); b = mathRandom(10, 19); result = a * b; }
    if (operation === "÷") { b = mathRandom(10, 19); result = mathRandom(10, 19); a = b * result; }
  } else {
    if (operation === "+") { a = mathRandom(100, 899); b = mathRandom(100, 999 - a); result = a + b; }
    if (operation === "−") { a = mathRandom(200, 999); b = mathRandom(100, a - 100); result = a - b; }
    if (operation === "×") { a = mathRandom(100, 199); b = mathRandom(100, 199); result = a * b; }
    if (operation === "÷") { b = mathRandom(100, 199); result = mathRandom(100, 199); a = b * result; }
  }
  const values = [a, b, result], answer = values[blank];
  values[blank] = "_";
  return { answer, text: `${values[0]} ${operation} ${values[1]} = ${values[2]}` };
}
function newMathPuzzleGame() { clearInterval(mathTimer); mathGame = null; $("math-start").classList.remove("hidden"); $("math-play").classList.add("hidden"); }
function renderMath(message) {
  if (!mathGame) return;
  const seconds = Math.max(0, mathGame.remaining);
  const saved = load(scoreKey, []).find((item) => item.name.toLowerCase() === playerName().toLowerCase() && item.game === "Math Puzzle")?.score || 0;
  $("math-score").textContent = mathGame.score;
  $("math-best").textContent = Math.max(saved, mathGame.score);
  $("math-timer").textContent = `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;
  $("math-question").innerHTML = `<small>Solve this</small>${mathGame.question.text}`;
  if (message) $("math-message").textContent = message;
}
function finishMath(message = `Time is up! You scored ${mathGame.score} point${mathGame.score === 1 ? "" : "s"}.`) {
  if (!mathGame || mathGame.over) return;
  mathGame.over = true; clearInterval(mathTimer); recordScore("Math Puzzle", mathGame.score);
  $("math-answer").disabled = true; $("math-form").querySelector("button").disabled = true; $("math-next").classList.add("hidden"); renderMath(message);
}
function tickMath() { if (!mathGame || mathGame.over) return; mathGame.remaining--; if (mathGame.remaining <= 0) { mathGame.remaining = 0; finishMath(); } else renderMath(); }
function startMathPuzzle() {
  clearInterval(mathTimer); mathGame = { score: 0, remaining: 120, question: newMathQuestion(), answered: false, over: false };
  $("math-start").classList.add("hidden"); $("math-play").classList.remove("hidden"); $("math-answer").value = ""; $("math-answer").disabled = false; $("math-form").querySelector("button").disabled = false; $("math-next").classList.add("hidden"); renderMath("Type the missing number."); mathTimer = setInterval(tickMath, 1000); $("math-answer").focus();
}
document.querySelectorAll("[data-math-mode]").forEach((button) => button.addEventListener("click", () => { mathMode = button.dataset.mathMode; document.querySelectorAll("[data-math-mode]").forEach((item) => item.classList.toggle("selected", item === button)); }));
$("math-start-button").addEventListener("click", startMathPuzzle);
$("math-form").addEventListener("submit", (event) => { event.preventDefault(); if (!mathGame || mathGame.answered || mathGame.over) return; const guess = Number($("math-answer").value); if (!Number.isFinite(guess)) return; mathGame.answered = true; const correct = guess === mathGame.question.answer; if (correct) mathGame.score++; $("math-answer").disabled = true; $("math-form").querySelector("button").disabled = true; $("math-next").classList.remove("hidden"); renderMath(correct ? `Correct! ${mathGame.question.answer} is right. +1 point` : `Not quite. The answer is ${mathGame.question.answer}.`); });
$("math-next").addEventListener("click", () => { mathGame.question = newMathQuestion(); mathGame.answered = false; $("math-answer").value = ""; $("math-answer").disabled = false; $("math-form").querySelector("button").disabled = false; $("math-next").classList.add("hidden"); renderMath("Type the missing number."); $("math-answer").focus(); });
$("math-reset").addEventListener("click", newMathPuzzleGame);
$("math-start-reset").addEventListener("click", newMathPuzzleGame);

const continentFallback = [["India","Asia"],["Japan","Asia"],["China","Asia"],["Thailand","Asia"],["Nigeria","Africa"],["Egypt","Africa"],["Kenya","Africa"],["South Africa","Africa"],["France","Europe"],["Germany","Europe"],["Italy","Europe"],["Spain","Europe"],["Brazil","South America"],["Argentina","South America"],["Chile","South America"],["Peru","South America"],["United States","North America"],["Canada","North America"],["Mexico","North America"],["Jamaica","North America"],["Australia","Oceania"],["New Zealand","Oceania"],["Fiji","Oceania"]];
let continentsGame = null, continentsTimer = null, continentQuestions = continentFallback, continentsLoaded = false;
const continentKey = (value) => value.trim().toLowerCase().replace(/[^a-z]/g, "");
const shuffledContinents = () => [...continentQuestions].sort(() => Math.random() - .5);
async function loadContinents() {
  if (continentsLoaded) return;
  try {
    const response = await fetch("https://restcountries.com/v3.1/all?fields=name,continents");
    if (!response.ok) throw new Error("Country list unavailable");
    const data = await response.json();
    const worldwide = data.map((country) => [country.name?.common, country.continents?.[0]]).filter(([name, continent]) => name && continent);
    if (worldwide.length > 100) continentQuestions = worldwide;
  } catch { /* The built-in countries keep the game playable if the list is unavailable. */ }
  continentsLoaded = true;
}
function newContinentsGame() { clearInterval(continentsTimer); continentsGame = null; $("continents-start").classList.remove("hidden"); $("continents-play").classList.add("hidden"); }
function renderContinents(message) {
  if (!continentsGame) return;
  const current = continentsGame.questions[continentsGame.index], seconds = Math.max(0, continentsGame.remaining);
  const saved = load(scoreKey, []).find((item) => item.name.toLowerCase() === playerName().toLowerCase() && item.game === "Countries & Continents")?.score || 0;
  $("continents-score").textContent = continentsGame.score; $("continents-best").textContent = Math.max(saved, continentsGame.score); $("continents-timer").textContent = `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`; $("continents-country").innerHTML = `<small>Bot says</small>${current[0]}`;
  if (message) $("continents-message").textContent = message;
}
function finishContinents(message = `Time is up! You scored ${continentsGame.score} point${continentsGame.score === 1 ? "" : "s"}.`) {
  if (!continentsGame || continentsGame.over) return;
  continentsGame.over = true; clearInterval(continentsTimer); recordScore("Countries & Continents", continentsGame.score); $("continents-answer").disabled = true; $("continents-form").querySelector("button").disabled = true; $("continents-next").classList.add("hidden"); renderContinents(message);
}
function tickContinents() { if (!continentsGame || continentsGame.over) return; continentsGame.remaining--; if (continentsGame.remaining <= 0) { continentsGame.remaining = 0; finishContinents(); } else renderContinents(); }
async function startContinents() {
  const button = $("continents-start-button"); button.disabled = true; button.textContent = "Loading countries…"; await loadContinents(); clearInterval(continentsTimer); continentsGame = { score: 0, remaining: 120, questions: shuffledContinents(), index: 0, answered: false, over: false };
  $("continents-start").classList.add("hidden"); $("continents-play").classList.remove("hidden"); $("continents-answer").value = ""; $("continents-answer").disabled = false; $("continents-form").querySelector("button").disabled = false; $("continents-next").classList.add("hidden"); button.disabled = false; button.textContent = "Start 2-minute game"; renderContinents("Which continent is this country in?"); continentsTimer = setInterval(tickContinents, 1000); $("continents-answer").focus();
}
$("continents-start-button").addEventListener("click", startContinents);
$("continents-form").addEventListener("submit", (event) => { event.preventDefault(); if (!continentsGame || continentsGame.answered || continentsGame.over) return; const current = continentsGame.questions[continentsGame.index], correct = continentKey($("continents-answer").value) === continentKey(current[1]); continentsGame.answered = true; if (correct) continentsGame.score++; $("continents-answer").disabled = true; $("continents-form").querySelector("button").disabled = true; $("continents-next").classList.remove("hidden"); renderContinents(correct ? `Correct! ${current[0]} is in ${current[1]}. +1 point` : `Not quite. ${current[0]} is in ${current[1]}.`); });
$("continents-next").addEventListener("click", () => { if (continentsGame.index + 1 >= continentsGame.questions.length) { continentsGame.questions = shuffledContinents(); continentsGame.index = 0; } else continentsGame.index++; continentsGame.answered = false; $("continents-answer").value = ""; $("continents-answer").disabled = false; $("continents-form").querySelector("button").disabled = false; $("continents-next").classList.add("hidden"); renderContinents("Which continent is this country in?"); $("continents-answer").focus(); });
$("continents-reset").addEventListener("click", newContinentsGame);
$("continents-start-reset").addEventListener("click", newContinentsGame);

const footballerCountries = [["Lionel Messi","Argentina"],["Julian Alvarez","Argentina"],["Lautaro Martinez","Argentina"],["Cristiano Ronaldo","Portugal"],["Bruno Fernandes","Portugal"],["Bernardo Silva","Portugal"],["Sunil Chhetri","India"],["Neymar","Brazil"],["Vinicius Junior","Brazil"],["Rodrygo","Brazil"],["Kylian Mbappe","France"],["Ousmane Dembele","France"],["Harry Kane","England"],["Jude Bellingham","England"],["Bukayo Saka","England"],["Phil Foden","England"],["Lamine Yamal","Spain"],["Pedri","Spain"],["Rodri","Spain"],["Jamal Musiala","Germany"],["Florian Wirtz","Germany"],["Kai Havertz","Germany"],["Gianluigi Donnarumma","Italy"],["Federico Chiesa","Italy"],["Virgil van Dijk","Netherlands"],["Frenkie de Jong","Netherlands"],["Kevin De Bruyne","Belgium"],["Romelu Lukaku","Belgium"],["Erling Haaland","Norway"],["Martin Odegaard","Norway"],["Alexander Isak","Sweden"],["Robert Lewandowski","Poland"],["Arda Guler","Turkey"],["Achraf Hakimi","Morocco"],["Mohamed Salah","Egypt"],["Victor Osimhen","Nigeria"],["Sadio Mane","Senegal"],["Kaoru Mitoma","Japan"],["Son Heung-min","South Korea"],["Christian Pulisic","United States"],["Alphonso Davies","Canada"],["Santiago Gimenez","Mexico"],["Luis Diaz","Colombia"],["Darwin Nunez","Uruguay"]];
let footballCountriesGame = null, footballCountriesTimer = null;
const footballCountryAliases = { usa:"unitedstates", us:"unitedstates", america:"unitedstates", korea:"southkorea", holland:"netherlands", uk:"england" };
const footballCountryKey = (value) => value.trim().toLowerCase().replace(/[^a-z]/g, "");
function footballCountryDistance(first, second) { const row = Array.from({ length: second.length + 1 }, (_, index) => index); for (let i = 1; i <= first.length; i++) { let previous = row[0]; row[0] = i; for (let j = 1; j <= second.length; j++) { const current = row[j]; row[j] = Math.min(row[j] + 1, row[j - 1] + 1, previous + (first[i - 1] === second[j - 1] ? 0 : 1)); previous = current; } } return row[second.length]; }
function isFootballCountry(typed, answer) { const guess = footballCountryAliases[footballCountryKey(typed)] || footballCountryKey(typed), correct = footballCountryKey(answer); return guess === correct || (guess.length > 4 && footballCountryDistance(guess, correct) <= 2); }
function shuffledFootballerCountries() { return [...footballerCountries].sort(() => Math.random() - .5); }
function newFootballerCountriesGame() { clearInterval(footballCountriesTimer); footballCountriesGame = null; $("football-countries-start").classList.remove("hidden"); $("football-countries-play").classList.add("hidden"); }
function renderFootballerCountries(message) {
  if (!footballCountriesGame) return;
  const current = footballCountriesGame.questions[footballCountriesGame.index], seconds = Math.max(0, footballCountriesGame.remaining);
  const saved = load(scoreKey, []).find((item) => item.name.toLowerCase() === playerName().toLowerCase() && item.game === "Footballer Countries")?.score || 0;
  $("football-countries-score").textContent = footballCountriesGame.score; $("football-countries-best").textContent = Math.max(saved, footballCountriesGame.score); $("football-countries-timer").textContent = `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`; $("football-countries-player").innerHTML = `<small>Bot says</small>${current[0]}`;
  if (message) $("football-countries-message").textContent = message;
}
function finishFootballerCountries(message = `Time is up! You scored ${footballCountriesGame.score} point${footballCountriesGame.score === 1 ? "" : "s"}.`) {
  if (!footballCountriesGame || footballCountriesGame.over) return;
  footballCountriesGame.over = true; clearInterval(footballCountriesTimer); recordScore("Footballer Countries", footballCountriesGame.score); $("football-countries-answer").disabled = true; $("football-countries-form").querySelector("button").disabled = true; $("football-countries-next").classList.add("hidden"); renderFootballerCountries(message);
}
function tickFootballerCountries() { if (!footballCountriesGame || footballCountriesGame.over) return; footballCountriesGame.remaining--; if (footballCountriesGame.remaining <= 0) { footballCountriesGame.remaining = 0; finishFootballerCountries(); } else renderFootballerCountries(); }
function startFootballerCountries() {
  clearInterval(footballCountriesTimer); footballCountriesGame = { score: 0, remaining: 120, questions: shuffledFootballerCountries(), index: 0, answered: false, over: false };
  $("football-countries-start").classList.add("hidden"); $("football-countries-play").classList.remove("hidden"); $("football-countries-answer").value = ""; $("football-countries-answer").disabled = false; $("football-countries-form").querySelector("button").disabled = false; $("football-countries-next").classList.add("hidden"); renderFootballerCountries("Which country is this footballer from?"); footballCountriesTimer = setInterval(tickFootballerCountries, 1000); $("football-countries-answer").focus();
}
$("football-countries-start-button").addEventListener("click", startFootballerCountries);
$("football-countries-form").addEventListener("submit", (event) => { event.preventDefault(); if (!footballCountriesGame || footballCountriesGame.answered || footballCountriesGame.over) return; const current = footballCountriesGame.questions[footballCountriesGame.index], correct = isFootballCountry($("football-countries-answer").value, current[1]); footballCountriesGame.answered = true; if (correct) footballCountriesGame.score++; $("football-countries-answer").disabled = true; $("football-countries-form").querySelector("button").disabled = true; $("football-countries-next").classList.remove("hidden"); renderFootballerCountries(correct ? `Correct! ${current[0]} is from ${current[1]}. +1 point` : `Not quite. ${current[0]} is from ${current[1]}.`); });
$("football-countries-next").addEventListener("click", () => { if (footballCountriesGame.index + 1 >= footballCountriesGame.questions.length) { footballCountriesGame.questions = shuffledFootballerCountries(); footballCountriesGame.index = 0; } else footballCountriesGame.index++; footballCountriesGame.answered = false; $("football-countries-answer").value = ""; $("football-countries-answer").disabled = false; $("football-countries-form").querySelector("button").disabled = false; $("football-countries-next").classList.add("hidden"); renderFootballerCountries("Which country is this footballer from?"); $("football-countries-answer").focus(); });
$("football-countries-reset").addEventListener("click", newFootballerCountriesGame);
$("football-countries-start-reset").addEventListener("click", newFootballerCountriesGame);

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
