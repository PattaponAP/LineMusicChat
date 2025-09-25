import express from 'express';
import { spawn } from 'child_process';

const app = express();
app.use(express.json());

let queue = [];
let isPlaying = false;
let currentSong = null;

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

app.post('/event', (req, res) => {
  const text = req.body.text.trim();

  if (text.startsWith('/music')) {
    const url = text.replace('/music', '').trim();
    queue.push(url);
    if (!isPlaying) playNext();
    return res.json({ msg: isPlaying ? `🎶 Added to queue: ${url}` : `▶️ Now playing: ${url}` });
  }

  if (text === '/list') {
    if (!queue.length) return res.json({ msg: '🎵 Queue is empty' });
    const msg = queue
      .map((song, i) => (i === 0 && song === currentSong ? `▶️ Now Playing: ${song}` : `${i + 1}. ${song}`))
      .join('\n');
    return res.json({ msg });
  }

  if (text === '/skip') {
    if (queue.length) {
      queue.shift();
      playNext();
      return res.json({ msg: '⏭ Skipped' });
    }
  }

  if (text === '/clear') {
    queue = [];
    isPlaying = false;
    currentSong = null;
    return res.json({ msg: '🗑 Queue cleared' });
  }

  if (text === '/nowplaying') {
    return res.json({ msg: currentSong ? `▶️ Now Playing: ${currentSong}` : '🎶 Nothing is playing' });
  }

  return res.json({ msg: '❓ Unknown command' });
});

const port = process.env.LOCAL_PORT || 4000;
app.listen(port, () => console.log(`🎶 Local player listening on :${port}`));
