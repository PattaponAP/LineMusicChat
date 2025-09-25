let queue = [];
let isPlaying = false;
let currentSong = null;

// ฟังก์ชันเล่นเพลง
function playNext() {
    if (!queue.length) {
        isPlaying = false;
        currentSong = null;
        return;
    }

    const { url, userId } = queue[0]; // ✅ เก็บ userId ด้วย
    currentSong = url;
    isPlaying = true;
    console.log('▶️ Playing:', url);

    // ส่งข้อความไปบอก user ว่าเริ่มเล่นแล้ว
    client.pushMessage(userId, {
        type: 'text',
        text: `▶️ Now playing: ${url}`,
    }).catch(err => console.error("Push error:", err));

    const p = spawn('mpv', ['--no-video', '--quiet', url]);
    p.on('exit', () => {
        queue.shift();
        playNext();
    });
}

async function handleEvent(event) {
    if (event.type !== 'message' || event.message.type !== 'text') return;

    const text = event.message.text.trim();

    if (text.startsWith('/music')) {
        const url = text.replace('/music', '').trim();
        if (url) {
            // ✅ เก็บ userId ของคนที่สั่งไว้ด้วย
            queue.push({ url, userId: event.source.userId });

            if (!isPlaying) playNext();
            return client.replyMessage(event.replyToken, {
                type: 'text',
                text: `🎶 Added to queue: ${url}`,
            });
        }
    }

    if (text === '/skip') {
        if (queue.length) {
            queue.shift();
            playNext();
            return client.replyMessage(event.replyToken, {
                type: 'text',
                text: '⏭ Skipped',
            });
        }
    }

    if (text === '/clear') {
        queue = [];
        isPlaying = false;
        currentSong = null;
        return client.replyMessage(event.replyToken, {
            type: 'text',
            text: '🗑 Queue cleared',
        });
    }

    if (text === '/list') {
        if (!queue.length) {
            return client.replyMessage(event.replyToken, {
                type: 'text',
                text: '🎵 Queue is empty',
            });
        }
        const msg = queue
            .map((song, i) =>
                i === 0 && song.url === currentSong
                    ? `▶️ Now Playing: ${song.url}`
                    : `${i + 1}. ${song.url}`
            )
            .join('\n');
        return client.replyMessage(event.replyToken, {
            type: 'text',
            text: msg,
        });
    }

    if (text === '/nowplaying') {
        return client.replyMessage(event.replyToken, {
            type: 'text',
            text: currentSong ? `▶️ Now Playing: ${currentSong}` : '🎶 Nothing is playing',
        });
    }

    return client.replyMessage(event.replyToken, {
        type: 'text',
        text: '❓ Unknown command',
    });
}
