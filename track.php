<?php
// Game Night's small, anonymous tracker. It stores only totals, never names or IP addresses.
header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['ok' => false]);
    exit;
}

$input = json_decode(file_get_contents('php://input'), true);
$event = is_array($input) ? ($input['event'] ?? '') : '';
$page = is_array($input) ? ($input['page'] ?? 'index.html') : 'index.html';
$game = is_array($input) ? ($input['game'] ?? '') : '';

if (!in_array($event, ['page_view', 'game_start'], true)) {
    http_response_code(400);
    echo json_encode(['ok' => false]);
    exit;
}

// Keep the data tidy even if someone sends unexpected text to this public endpoint.
$page = preg_match('/^[a-z0-9._-]{1,80}$/i', $page) ? $page : 'index.html';
$game = preg_match('/^[a-z0-9-]{1,80}$/i', $game) ? $game : '';
if ($event === 'game_start' && $game === '') {
    http_response_code(400);
    echo json_encode(['ok' => false]);
    exit;
}

$file = __DIR__ . '/analytics-data.json';
$handle = fopen($file, 'c+');
if (!$handle || !flock($handle, LOCK_EX)) {
    http_response_code(500);
    echo json_encode(['ok' => false]);
    exit;
}

$contents = stream_get_contents($handle);
$data = json_decode($contents, true);
if (!is_array($data)) $data = ['pages' => [], 'games' => [], 'updated_at' => null];
if (!isset($data['pages']) || !is_array($data['pages'])) $data['pages'] = [];
if (!isset($data['games']) || !is_array($data['games'])) $data['games'] = [];

if ($event === 'page_view') {
    if (!isset($data['pages'][$page])) $data['pages'][$page] = ['views' => 0];
    $data['pages'][$page]['views']++;
} else {
    if (!isset($data['games'][$game])) $data['games'][$game] = ['starts' => 0];
    $data['games'][$game]['starts']++;
}
$data['updated_at'] = gmdate('c');

rewind($handle);
ftruncate($handle, 0);
fwrite($handle, json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES));
fflush($handle);
flock($handle, LOCK_UN);
fclose($handle);

echo json_encode(['ok' => true]);
