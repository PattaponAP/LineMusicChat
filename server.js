import 'dotenv/config';
import express from 'express';
import { middleware, Client } from '@line/bot-sdk';

const config = {
  channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN,
  channelSecret: process.env.LINE_CHANNEL_SECRET,
};
const client = new Client(config);

const app = express();
app.post('/line/webhook', middleware(config), (req, res) => {
  Promise.all((req.body.events || []).map(handleEvent))
    .then(() => res.end());
});
app.get('/healthz', (_, res) => res.send('ok'));

async function handleEvent(event) {
  if (event.type === 'message' && event.message.type === 'text') {
    await client.replyMessage(event.replyToken, {
      type: 'text',
      text: `You said: ${event.message.text}`,
    });
  }
}

const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`Listening on ${port}`));
