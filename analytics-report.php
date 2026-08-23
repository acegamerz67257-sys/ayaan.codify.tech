<?php
$file = __DIR__ . '/analytics-data.json';
$data = is_file($file) ? json_decode(file_get_contents($file), true) : [];
$pages = is_array($data['pages'] ?? null) ? $data['pages'] : [];
$games = is_array($data['games'] ?? null) ? $data['games'] : [];
$playersByDate = is_array($data['players_by_date'] ?? null) ? $data['players_by_date'] : [];
$names = [
  'rps' => 'Rock Paper Scissors', 'number' => 'Number Challenge',
  'tic-tac-toe' => 'Tic-Tac-Toe', 'odd-even' => 'Odd or Even',
  'chopsticks' => 'Chopsticks', 'footballers' => 'Footballer Challenge',
  'atlas' => 'Atlas', 'footballer-atlas' => 'Footballer Atlas',
  'country-capitals' => 'Country Capitals', 'math-puzzle' => 'Math Puzzle',
  'countries-continents' => 'Countries & Continents',
  'footballer-countries' => 'Footballer Countries'
];
uasort($pages, fn($a, $b) => ($b['views'] ?? 0) <=> ($a['views'] ?? 0));
uasort($games, fn($a, $b) => ($b['starts'] ?? 0) <=> ($a['starts'] ?? 0));
$dayNames = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
$weeklyPlayers = array_map(fn($day) => ['day' => $day, 'count' => 0], $dayNames);
foreach ($playersByDate as $date => $players) {
  $parsedDate = DateTimeImmutable::createFromFormat('!Y-m-d', $date, new DateTimeZone('UTC'));
  if (!$parsedDate || !is_array($players)) continue;
  $dayIndex = (int) $parsedDate->format('N') - 1;
  $weeklyPlayers[$dayIndex]['count'] += count(array_unique($players));
}
$weeklyMax = max(1, ...array_column($weeklyPlayers, 'count'));
function h($value) { return htmlspecialchars((string) $value, ENT_QUOTES, 'UTF-8'); }
?>
<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Game Night – Activity report</title>
<style>body{background:#fff7ed;color:#17233a;font:16px system-ui,sans-serif;margin:0;padding:36px 18px}main{margin:auto;max-width:840px}h1{font-family:Georgia,serif;font-size:clamp(2rem,6vw,3.6rem);margin:0 0 8px}p{color:#5c6878}section{background:#fff;border:1px solid #e8d8c5;border-radius:18px;margin-top:24px;padding:22px}h2{margin:0}.section-heading{align-items:start;display:flex;gap:16px;justify-content:space-between}.section-heading p{font-size:.85rem;margin:5px 0 0;text-align:right}.weekly-chart{align-items:end;display:grid;gap:12px;grid-template-columns:repeat(7,1fr);height:250px;margin-top:28px}.bar-column{align-items:center;display:flex;flex-direction:column;height:100%;justify-content:end;min-width:0}.bar-count{font-size:1.15rem;font-weight:850;margin-bottom:7px}.bar-track{align-items:end;background:#fff2e1;border-radius:12px 12px 5px 5px;display:flex;height:150px;overflow:hidden;width:min(56px,100%)}.bar{background:linear-gradient(180deg,#ff9d57,#eb641f);border-radius:12px 12px 5px 5px;width:100%}.bar-day{font-size:.78rem;font-weight:800;margin-top:9px}.bar-date{color:#7a8493;font-size:.7rem;margin-top:2px}table{border-collapse:collapse;width:100%}th,td{border-bottom:1px solid #eee2d4;padding:12px;text-align:left}th:last-child,td:last-child{text-align:right;font-weight:800}.empty{padding:12px 0}@media(max-width:600px){.weekly-chart{gap:5px}.bar-track{height:120px}.bar-day{font-size:.68rem}.bar-date{display:none}}</style>
</head><body><main><h1>Game Night activity</h1><p>Anonymous totals from your website. No player names or personal information are collected.</p>
<section><div class="section-heading"><div><h2>Players by weekday</h2><p>Total unique daily players recorded on each weekday.</p></div><p>All recorded activity<br>UTC</p></div><div class="weekly-chart"><?php foreach ($weeklyPlayers as $item): ?><div class="bar-column" aria-label="<?= h($item['day']) ?>: <?= (int) $item['count'] ?> players"><span class="bar-count"><?= (int) $item['count'] ?></span><div class="bar-track"><div class="bar" style="height:<?= round(($item['count'] / $weeklyMax) * 100) ?>%"></div></div><span class="bar-day"><?= h(substr($item['day'], 0, 3)) ?></span></div><?php endforeach; ?></div></section>
<section><h2>Page visits</h2><?php if ($pages): ?><table><thead><tr><th>Page</th><th>Visits</th></tr></thead><tbody><?php foreach ($pages as $page => $item): ?><tr><td><?= h($page) ?></td><td><?= (int) ($item['views'] ?? 0) ?></td></tr><?php endforeach; ?></tbody></table><?php else: ?><p class="empty">No visits recorded yet.</p><?php endif; ?></section>
<section><h2>Games started</h2><?php if ($games): ?><table><thead><tr><th>Game</th><th>Times played</th></tr></thead><tbody><?php foreach ($games as $game => $item): ?><tr><td><?= h($names[$game] ?? $game) ?></td><td><?= (int) ($item['starts'] ?? 0) ?></td></tr><?php endforeach; ?></tbody></table><?php else: ?><p class="empty">No games have been started yet.</p><?php endif; ?></section>
<p>Last updated: <?= h($data['updated_at'] ?? 'Not yet') ?></p></main></body></html>
