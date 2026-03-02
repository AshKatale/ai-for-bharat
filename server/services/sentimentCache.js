const getEnvOrDefault = (key, defaultVal) => process.env[key] || defaultVal;
const ttlSeconds = parseInt(getEnvOrDefault('SENTIMENT_CACHE_TTL_SECONDS', '3600'), 10);

// In-memory cache: userId_productId_timeWindowDays -> { expiry: timestamp, data: object }
const cache = new Map();

const getCacheKey = (userId, productId, timeWindowDays) => {
    return `${userId}_${productId}_${timeWindowDays}`;
};

const getCachedSentiment = (userId, productId, timeWindowDays) => {
    const key = getCacheKey(userId, productId, timeWindowDays);
    const entry = cache.get(key);

    if (entry) {
        if (Date.now() > entry.expiry) {
            cache.delete(key);
            return null;
        }
        return entry.data;
    }
    return null;
};

const setCachedSentiment = (userId, productId, timeWindowDays, data) => {
    const key = getCacheKey(userId, productId, timeWindowDays);
    cache.set(key, {
        expiry: Date.now() + (ttlSeconds * 1000),
        data: data
    });
};

module.exports = {
    getCachedSentiment,
    setCachedSentiment
};
