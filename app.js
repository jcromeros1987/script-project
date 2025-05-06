function formatStartTime(seconds) {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
}

function formatDuration(minutes) {
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = Math.floor(minutes % 60);
    const seconds = Math.floor((minutes * 60) % 60);
    return `${hours.toString().padStart(2, '0')}:${remainingMinutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

async function makeApiCall() {
    const responseDiv = document.getElementById('response');
    const transcriptId = document.getElementById('transcriptId').value.trim();
    if (!transcriptId) {
        responseDiv.textContent = 'Por favor, introduce un ID de transcript.';
        return;
    }
    responseDiv.textContent = 'Loading...';

    // Paleta de colores pastel
    const pastelColors = [
        '#ffd6e0', '#d6eaff', '#e0ffd6', '#fff5d6', '#e0d6ff', '#d6fff6', '#ffe6d6', '#f6ffd6', '#d6f6ff', '#ffd6f6'
    ];
    const speakerColors = {};
    let colorIndex = 0;

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
        if (data.data && data.data.transcript) {
            const transcript = data.data.transcript;
            const formattedDate = new Date(transcript.date).toLocaleString();
            
            let html = `
                <div class="transcript-header">
                    <h2>${transcript.title}</h2>
                    <div class="transcript-info">
                        <p><strong>Duration:</strong> ${formatDuration(transcript.duration)}</p>
                        <p><strong>Date:</strong> ${formattedDate}</p>
                    </div>
                </div>
                <div class="chat-container">
            `;

            transcript.sentences.forEach(sentence => {
                // Asignar color único por speaker_name
                if (!speakerColors[sentence.speaker_name]) {
                    speakerColors[sentence.speaker_name] = pastelColors[colorIndex % pastelColors.length];
                    colorIndex++;
                }
                const bgColor = speakerColors[sentence.speaker_name];
                html += `
                    <div class="message" style="background-color: ${bgColor};">
                        <div class="message-header">
                            <span class="speaker">${sentence.speaker_name}</span>
                            <span class="time">${formatStartTime(sentence.start_time)}</span>
                        </div>
                        <div class="message-content">
                            ${sentence.raw_text.replace(/^[\s\uFEFF\xA0]+|[\s\uFEFF\xA0]+$/g, '')}
                        </div>
                    </div>
                `;
            });

            html += '</div>';
            responseDiv.innerHTML = html;
        } else {
            responseDiv.textContent = 'No se encontró el transcript.';
        }
    } catch (error) {
        responseDiv.textContent = `Error: ${error.message}`;
    }
} 