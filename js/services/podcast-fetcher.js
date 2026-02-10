import { fetchXML } from './fetcher.js';
import { cache } from './cache.js';

const CACHE_TTL = 4 * 60 * 60 * 1000; // 4 hours
const YT_FEED_URL = 'https://www.youtube.com/feeds/videos.xml?channel_id=';
const MAX_VIDEOS = 5;

function parseEntry(entry) {
  const videoId = entry.querySelector('videoId')?.textContent
    || entry.querySelector('id')?.textContent?.split(':').pop()
    || '';
  return {
    title: entry.querySelector('title')?.textContent || '',
    url: `https://www.youtube.com/watch?v=${videoId}`,
    videoId,
    publishedAt: entry.querySelector('published')?.textContent || '',
    thumbnail: entry.querySelector('group thumbnail')?.getAttribute('url')
      || `https://i.ytimg.com/vi/${videoId}/mqdefault.jpg`,
    description: entry.querySelector('group description')?.textContent || '',
  };
}

async function fetchChannelVideos(channelId) {
  const cached = cache.get(`podcast-yt:${channelId}`);
  if (cached) return cached;

  const doc = await fetchXML(`${YT_FEED_URL}${channelId}`, { useProxy: true, timeout: 10000 });
  const entries = Array.from(doc.querySelectorAll('entry')).slice(0, MAX_VIDEOS);
  const videos = entries.map(parseEntry);

  cache.set(`podcast-yt:${channelId}`, videos, CACHE_TTL);
  return videos;
}

export async function fetchAllChannelVideos(channels) {
  const results = await Promise.allSettled(
    channels.map(ch => fetchChannelVideos(ch.channelId))
  );

  const videosByChannel = {};
  let errorCount = 0;

  results.forEach((result, i) => {
    const channelId = channels[i].channelId;
    if (result.status === 'fulfilled') {
      videosByChannel[channelId] = result.value;
    } else {
      videosByChannel[channelId] = [];
      errorCount++;
    }
  });

  return { videosByChannel, errorCount };
}
