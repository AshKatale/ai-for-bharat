const logger = require('../utils/logger');

const TAVILY_API_URL = 'https://api.tavily.com/search';

const getEnvOrDefault = (key, defaultVal) => process.env[key] || defaultVal;

// Simple exponential backoff retry wrapper
const fetchWithRetry = async (url, options, maxRetries = 2, backoff = 500) => {
  let attempt = 0;
  while (attempt <= maxRetries) {
    try {
      const response = await fetch(url, options);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      attempt++;
      if (attempt > maxRetries) {
        throw error;
      }
      logger.warn(`Tavily fetch failed (attempt ${attempt}/${maxRetries}). Retrying in ${backoff}ms...`);
      await new Promise((resolve) => setTimeout(resolve, backoff));
      backoff *= 2;
    }
  }
};

// Timeout wrapper
const fetchWithTimeout = (url, options, timeoutMs) => {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);

  return fetchWithRetry(url, { ...options, signal: controller.signal })
    .finally(() => clearTimeout(id));
};

// Helper: Tag source based on URL
const tagSource = (url) => {
  const lowerUrl = url.toLowerCase();
  if (lowerUrl.includes('reddit.com')) return 'reddit';
  if (lowerUrl.includes('news') || lowerUrl.includes('forbes') || lowerUrl.includes('techcrunch')) return 'news';
  if (lowerUrl.includes('review') || lowerUrl.includes('capterra') || lowerUrl.includes('g2')) return 'reviews';
  if (lowerUrl.includes('blog') || lowerUrl.includes('medium') || lowerUrl.includes('substack')) return 'blogs';
  if (lowerUrl.includes('forum') || lowerUrl.includes('quora') || lowerUrl.includes('stackexchange')) return 'forums';
  if (lowerUrl.includes('twitter.com') || lowerUrl.includes('x.com') || lowerUrl.includes('linkedin.com')) return 'social';
  return 'other';
};

// Batch parallel execution with concurrency limit
const runWithConcurrencyLimit = async (tasks, limit) => {
  const results = [];
  const executing = [];
  
  for (const task of tasks) {
    const p = Promise.resolve().then(() => task());
    results.push(p);
    
    if (limit <= tasks.length) {
      const e = p.then(() => executing.splice(executing.indexOf(e), 1));
      executing.push(e);
      if (executing.length >= limit) {
        await Promise.race(executing);
      }
    }
  }
  return Promise.allSettled(results);
};

/**
 * Perform a set of Tavily queries and merge results seamlessly
 * @param {Array<string>} queries 
 */
const searchTavily = async (queries) => {
  const API_KEY = process.env.TAVILY_API_KEY;
  if (!API_KEY) {
    logger.warn('TAVILY_API_KEY not set. Returning empty results.');
    return [];
  }

  const timeoutMs = parseInt(getEnvOrDefault('SENTIMENT_TIMEOUT_MS', '5000'), 10);
  
  const tasks = queries.map(query => async () => {
    logger.info(`Fetching Tavily for query: "${query}"`);
    const options = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        api_key: API_KEY,
        query: query,
        search_depth: 'basic',
        include_images: false,
        max_results: 10
      })
    };
    
    return fetchWithTimeout(TAVILY_API_URL, options, timeoutMs);
  });

  // Concurrency limit of 3 to avoid hammering the API
  const results = await runWithConcurrencyLimit(tasks, 3);
  
  let allDocs = [];
  results.forEach((res) => {
    if (res.status === 'fulfilled' && res.value && res.value.results) {
      allDocs = allDocs.concat(res.value.results);
    } else if (res.status === 'rejected') {
      logger.error(`Tavily query failed: ${res.reason?.message}`);
    }
  });

  // Deduplicate by URL
  const seenUrls = new Set();
  const dedupedDocs = [];

  for (const doc of allDocs) {
    if (!doc.url) continue;
    
    // basic normalization
    const canonicalUrl = doc.url.split('?')[0].replace(/\/$/, "");
    if (!seenUrls.has(canonicalUrl)) {
      seenUrls.add(canonicalUrl);
      doc.sourceType = tagSource(canonicalUrl);
      dedupedDocs.push(doc);
    }
  }

  // Cap at ~30 documents max for processing efficiency
  return dedupedDocs.slice(0, 30);
};

module.exports = {
  searchTavily
};
