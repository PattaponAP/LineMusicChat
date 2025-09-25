import 'dotenv/config';
import express from 'express';
import { middleware, Client } from '@line/bot-sdk';
import axios from 'axios';

const config = {
  channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN,
  channelSecret: process.env.LINE_CHANNEL_SECRET,
};
const client = new Client(config);

const app = express();
const playerUrl = process.env.PLAYER_URL;

app.post('/line/webhook', middleware(config), (req, res) => {
  Promise.all((req.body.events || []).map(handleEvent)).then(() => res.end());
});

async function handleEvent(event) {
  if (event.type !== 'message' || event.message.type !== 'text') return;

  const text = event.message.text.trim();

  // ✅ forward command ไป local-player
  if (playerUrl) {
    try {
      const { data } = await axios.post(`${playerUrl}/event`, { text });
      console.log('➡️ Forwarded to local:', text);

      // ส่งผลลัพธ์จาก local กลับไปใน LINE
      return client.replyMessage(event.replyToken, {
        type: 'text',
        text: data.msg || '✅ Command sent',
      });
    } catch (err) {
      console.error('❌ Forward failed:', err.message);
      return client.replyMessage(event.replyToken, {
        type: 'text',
        text: '⚠️ Cannot reach local player',
      });
    }
  }

  // ถ้าไม่มี playerUrl
  return client.replyMessage(event.replyToken, {
    type: 'text',
    text: '⚠️ PLAYER_URL not set',
  });
}

const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`🌍 Cloud server listening on :${port}`));
