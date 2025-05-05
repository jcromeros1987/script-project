async function makeApiCall() {
    const responseDiv = document.getElementById('response');
    const transcriptId = document.getElementById('transcriptId').value.trim();
    if (!transcriptId) {
        responseDiv.textContent = 'Por favor, introduce un ID de transcript.';
        return;
    }
    responseDiv.textContent = 'Loading...';

    try {
        const response = await fetch('https://api.fireflies.ai/graphql', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer eb315f30-bbcf-464d-bfdb-ad211f174c16'
            },
            body: JSON.stringify({
                query: `query Transcript { transcript(id: \"${transcriptId}\") { transcript_url id title audio_url host_email duration date sentences { raw_text speaker_name start_time } } }`
            })
        });

        const data = await response.json();
        responseDiv.textContent = JSON.stringify(data, null, 2);
    } catch (error) {
        responseDiv.textContent = `Error: ${error.message}`;
    }
} 