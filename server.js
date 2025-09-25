import 'dotenv/config';
import express from 'express';
import { middleware, Client } from '@line/bot-sdk';
import { spawn } from 'child_process';

const config = {
    channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN,
    channelSecret: process.env.LINE_CHANNEL_SECRET,
};
const client = new Client(config);

const app = express();

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

    const url = queue[0];
    currentSong = url;
    isPlaying = true;
    console.log('▶️ Playing:', url);

    const p = spawn('mpv', ['--no-video', '--quiet', url]);
    p.on('exit', () => {
        queue.shift();
        playNext();
    });
}

// Webhook endpoint
app.post('/line/webhook', middleware(config), (req, res) => {
    console.log("Secret length:", process.env.LINE_CHANNEL_SECRET?.length);
    console.log("Token length:", process.env.LINE_CHANNEL_ACCESS_TOKEN?.length);
    Promise.all((req.body.events || []).map(handleEvent)).then(() => res.end());
});

async function handleEvent(event) {
    if (event.type !== 'message' || event.message.type !== 'text') return;

    const text = event.message.text.trim();

    if (text.startsWith('/music')) {
        const url = text.replace('/music', '').trim();
        if (url) {
            queue.push(url);
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
                i === 0 && song === currentSong
                    ? `▶️ Now Playing: ${song}`
                    : `${i + 1}. ${song}`
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

// health check
app.get('/healthz', (_, res) => res.send('ok'));

const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`🎶 LINE Music Bot running on :${port}`));
