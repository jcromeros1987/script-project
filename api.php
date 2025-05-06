<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

// Function to get URL parameters
function getQueryParam($param) {
    return isset($_GET[$param]) ? $_GET[$param] : null;
}

// Function to format duration
function formatDuration($minutes) {
    $hours = floor($minutes / 60);
    $remainingMinutes = floor($minutes % 60);
    $seconds = floor(($minutes * 60) % 60);
    return sprintf("%02d:%02d:%02d", $hours, $remainingMinutes, $seconds);
}

// Function to format timestamp
function formatTimestamp($seconds) {
    $minutes = floor($seconds / 60);
    $remainingSeconds = floor($seconds % 60);
    return sprintf("%02d:%02d", $minutes, $remainingSeconds);
}

// Get transcript ID from URL
$transcriptId = getQueryParam('id');

if (!$transcriptId) {
    http_response_code(400);
    echo json_encode([
        'error' => 'Please provide an "id" parameter in the URL. Example: ?id=YOUR_ID_HERE'
    ]);
    exit;
}

// Prepare the GraphQL query
$query = <<<GRAPHQL
query Transcript {
    transcript(id: "$transcriptId") {
        transcript_url
        id
        title
        audio_url
        host_email
        duration
        date
        sentences {
            raw_text
            speaker_name
            start_time
        }
    }
}
GRAPHQL;

// Make the API call to Fireflies.ai
$ch = curl_init('https://api.fireflies.ai/graphql');
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode(['query' => $query]));
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    'Content-Type: application/json',
    'Authorization: Bearer eb315f30-bbcf-464d-bfdb-ad211f174c16'
]);

$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

if ($httpCode !== 200) {
    http_response_code($httpCode);
    echo json_encode([
        'error' => 'Error making request to Fireflies.ai API'
    ]);
    exit;
}

$data = json_decode($response, true);

if (isset($data['data']['transcript'])) {
    $transcript = $data['data']['transcript'];
    
    // Build a single string with each sentence on a new line, formatted as (index) [MM:SS] Speaker: Text.
    $lines = [];
    foreach ($transcript['sentences'] as $index => $sentence) {
        $time = formatTimestamp($sentence['start_time']);
        $lines[] = sprintf("(%d) [%s] %s: %s", $index + 1, $time, $sentence['speaker_name'], trim($sentence['raw_text']));
    }
    $joinedText = implode("\n", $lines);
    
    // Build the response object
    $result = [
        'id' => $transcript['id'],
        'title' => $transcript['title'],
        'duration' => formatDuration($transcript['duration']),
        'date' => $transcript['date'],
        'data' => $joinedText
    ];
    
    echo json_encode($result, JSON_PRETTY_PRINT);
} else {
    http_response_code(404);
    echo json_encode([
        'error' => 'Transcript not found'
    ]);
} 