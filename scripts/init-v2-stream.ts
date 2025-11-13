// Script to initialize v2 stream config in Redis
import { redis } from '../lib/redis';

async function initStreamConfig() {
  const config = {
    url: 'https://www.youtube.com/live/aeFydtug4-w?si=oI3I894G2-Iw6OSj',
    isLive: true,
    updatedAt: Date.now(),
  };

  await redis.set('v2:stream:config', config);
  console.log('✅ V2 stream config initialized:', config);
}

initStreamConfig().catch(console.error);

