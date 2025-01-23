import { Client, GatewayIntentBits } from 'discord.js';
import Redis from 'ioredis';
import dotenv from 'dotenv';

dotenv.config();

const client = new Client({ intents: [GatewayIntentBits.Guilds] });
const redis = new Redis(process.env.REDIS_URL);

const CHANNELS = {
  MARK_CREATED: "MARK_CREATED",
  MARK_UPDATED: "MARK_UPDATED",
};

client.once('ready', () => {
  console.log('Discord bot is ready!');
});

async function sendDiscordMessage(message) {
  const channel = await client.channels.fetch(process.env.DISCORD_CHANNEL_ID);
  if (channel && channel.isTextBased()) {
    await channel.send(message);
  }
}

redis.subscribe(CHANNELS.MARK_CREATED, CHANNELS.MARK_UPDATED, (err, count) => {
  if (err) {
    console.error("Failed to subscribe: %s", err.message);
  } else {
    console.log(`Subscribed successfully! This client is subscribed to ${count} channels.`);
  }
});

redis.on('message', (channel, message) => {
  const data = JSON.parse(message);
  let discordMessage = '';

  switch (channel) {
    case CHANNELS.MARK_CREATED:
      discordMessage = `New mark created for standard ${data.standard} in class ${data.class} in subject ${data.subject}`;
      break;
    case CHANNELS.MARK_UPDATED:
      discordMessage = `Mark updated for standard ${data.standard} in class ${data.class} in subject ${data.subject}`;
      break;
  }

  sendDiscordMessage(discordMessage).catch(console.error);
});

client.login(process.env.DISCORD_BOT_TOKEN);