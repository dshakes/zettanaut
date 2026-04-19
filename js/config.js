export const CONFIG = {
  CACHE_TTL: {
    news: 5 * 60 * 1000,
    papers: 30 * 60 * 1000,
    releases: 5 * 60 * 1000,
    resources: 24 * 60 * 60 * 1000,
    podcasts: 4 * 60 * 60 * 1000,
  },
  REFRESH_INTERVALS: {
    news: 5 * 60 * 1000,
    papers: 30 * 60 * 1000,
    releases: 5 * 60 * 1000,
    resources: 60 * 60 * 1000,
    podcasts: 4 * 60 * 60 * 1000,
  },
  MAX_ITEMS_PER_SOURCE: 30,
  // Freshness windows in hours
  FRESHNESS: {
    new: 12,        // NEW badge: <12h
    today: 24,      // surface in "Today" group
    yesterday: 48,  // "Yesterday" group
    week: 24 * 7,   // "This week" group
    hot_min_score: 80,    // HN points to qualify HOT in last 48h
    trending_min_score: 30,
  },
  CURATED_RELEASE_MAX_AGE_DAYS: 60, // beyond this, curated releases get deprioritized
  SEARCH_QUERIES: {
    hn: 'AI OR "artificial intelligence" OR "machine learning" OR LLM OR "large language model" OR GPT OR Claude OR Gemini OR "deep learning" OR vLLM OR "LLM inference" OR TensorRT OR Anthropic OR OpenAI',
    devto_tags: ['ai', 'machinelearning', 'deeplearning', 'llm', 'artificialintelligence', 'inference', 'genai'],
    reddit_subreddits: 'artificial+MachineLearning+deeplearning+LanguageTechnology+LocalLLaMA+singularity',
    arxiv_categories: 'cat:cs.AI+OR+cat:cs.LG+OR+cat:cs.CL',
    semantic_scholar: 'artificial intelligence large language model',
  },
  SOURCE_AUTHORITY: {
    hackernews: 0.9,
    devto: 0.6,
    reddit: 0.7,
    rss: 0.85,
    arxiv: 0.95,
    semantic_scholar: 0.9,
    huggingface: 0.85,
    major_releases: 1.0,
  },
  CORS_PROXIES: [
    { name: 'allorigins', buildUrl: (url) => `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}` },
    { name: 'corsproxy', buildUrl: (url) => `https://corsproxy.io/?url=${encodeURIComponent(url)}` },
    { name: 'codetabs', buildUrl: (url) => `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(url)}` },
  ],
  // AI Atlas — LLM-powered concept search
  ATLAS: {
    apiKey: '',           // Paste your API key here for ready-to-use Atlas
    provider: 'openai',  // 'openai' or 'anthropic'
    openai: {
      model: 'gpt-4.1',
      url: 'https://api.openai.com/v1/chat/completions',
    },
    anthropic: {
      model: 'claude-sonnet-4-5-20250929',
      url: 'https://api.anthropic.com/v1/messages',
    },
    cacheTTL: 24 * 60 * 60 * 1000,  // 24h
  },
  RSS_FEEDS: [
    // Frontier labs — highest authority
    { name: 'Anthropic', url: 'https://www.anthropic.com/news/rss.xml', authority: 1.0 },
    { name: 'OpenAI', url: 'https://openai.com/blog/rss.xml', authority: 1.0 },
    { name: 'Google DeepMind', url: 'https://deepmind.google/blog/rss.xml', authority: 1.0 },
    { name: 'Google AI', url: 'https://blog.research.google/feeds/posts/default?alt=rss', authority: 1.0 },
    { name: 'Meta AI', url: 'https://ai.meta.com/blog/rss/', authority: 0.95 },
    { name: 'Microsoft AI', url: 'https://blogs.microsoft.com/ai/feed/', authority: 0.9 },
    { name: 'Mistral', url: 'https://mistral.ai/news/feed.xml', authority: 0.9 },
    // Inference & serving
    { name: 'vLLM', url: 'https://blog.vllm.ai/feed.xml', authority: 0.9 },
    { name: 'Anyscale', url: 'https://www.anyscale.com/blog/rss.xml', authority: 0.8 },
    // Authoritative analysis & research
    { name: 'Hugging Face', url: 'https://huggingface.co/blog/feed.xml', authority: 0.85 },
    { name: 'Lilian Weng', url: 'https://lilianweng.github.io/index.xml', authority: 0.85 },
    { name: 'Simon Willison', url: 'https://simonwillison.net/atom/everything/', authority: 0.85 },
    { name: 'Sebastian Raschka', url: 'https://magazine.sebastianraschka.com/feed', authority: 0.85 },
    { name: 'Ahead of AI', url: 'https://magazine.sebastianraschka.com/feed', authority: 0.8 },
    // Press
    { name: 'MIT Tech Review AI', url: 'https://www.technologyreview.com/topic/artificial-intelligence/feed', authority: 0.8 },
    { name: 'The Gradient', url: 'https://thegradient.pub/rss/', authority: 0.7 },
    { name: 'TechCrunch AI', url: 'https://techcrunch.com/category/artificial-intelligence/feed/', authority: 0.7 },
    { name: 'VentureBeat AI', url: 'https://venturebeat.com/category/ai/feed/', authority: 0.7 },
    { name: 'The Verge AI', url: 'https://www.theverge.com/ai-artificial-intelligence/rss/index.xml', authority: 0.7 },
  ],
};
