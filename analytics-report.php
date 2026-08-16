<?php
$file = __DIR__ . '/analytics-data.json';
$data = is_file($file) ? json_decode(file_get_contents($file), true) : [];
$pages = is_array($data['pages'] ?? null) ? $data['pages'] : [];
$games = is_array($data['games'] ?? null) ? $data['games'] : [];
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
function h($value) { return htmlspecialchars((string) $value, ENT_QUOTES, 'UTF-8'); }
?>
<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Game Night – Activity report</title>
<style>body{background:#fff7ed;color:#17233a;font:16px system-ui,sans-serif;margin:0;padding:36px 18px}main{margin:auto;max-width:840px}h1{font-family:Georgia,serif;font-size:clamp(2rem,6vw,3.6rem);margin:0 0 8px}p{color:#5c6878}section{background:#fff;border:1px solid #e8d8c5;border-radius:18px;margin-top:24px;padding:22px}h2{margin-top:0}table{border-collapse:collapse;width:100%}th,td{border-bottom:1px solid #eee2d4;padding:12px;text-align:left}th:last-child,td:last-child{text-align:right;font-weight:800}.empty{padding:12px 0}</style>
</head><body><main><h1>Game Night activity</h1><p>Anonymous totals from your website. No player names or personal information are collected.</p>
<section><h2>Page visits</h2><?php if ($pages): ?><table><thead><tr><th>Page</th><th>Visits</th></tr></thead><tbody><?php foreach ($pages as $page => $item): ?><tr><td><?= h($page) ?></td><td><?= (int) ($item['views'] ?? 0) ?></td></tr><?php endforeach; ?></tbody></table><?php else: ?><p class="empty">No visits recorded yet.</p><?php endif; ?></section>
<section><h2>Games started</h2><?php if ($games): ?><table><thead><tr><th>Game</th><th>Times played</th></tr></thead><tbody><?php foreach ($games as $game => $item): ?><tr><td><?= h($names[$game] ?? $game) ?></td><td><?= (int) ($item['starts'] ?? 0) ?></td></tr><?php endforeach; ?></tbody></table><?php else: ?><p class="empty">No games have been started yet.</p><?php endif; ?></section>
<p>Last updated: <?= h($data['updated_at'] ?? 'Not yet') ?></p></main></body></html>
