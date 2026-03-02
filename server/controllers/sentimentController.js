const logger = require('../utils/logger');
const { searchTavily } = require('../services/tavilyService');
const { buildSentimentQueries } = require('../services/entityResolver');
const { discoverCompetitors } = require('../services/competitorDiscovery');
const { analyzeSentiment } = require('../services/sentimentAnalyzer');
const { computePerceptionScore } = require('../services/perceptionScorer');
const { getCachedSentiment, setCachedSentiment } = require('../services/sentimentCache');

const analyzeProductSentiment = async (req, res, next) => {
    try {
        const { productId } = req.params;
        const userId = req.userId || 'demo-user-123'; // Fallback since auth is skipped

        // Ensure req.body exists before destructuring
        const body = req.body || {};
        const {
            brandName = 'Acme Corp',
            productName = `Product-${productId}`,
            extraKeywords = [],
            timeWindowDays = 30
        } = body;

        // 1. Check Cache (Include search terms so different products don't hit the same cache)
        const cacheKeySalt = `${brandName}-${productName}`;
        const cachedData = getCachedSentiment(userId, productId + cacheKeySalt, timeWindowDays);
        if (cachedData) {
            logger.info(`Returning cached sentiment data for Product: ${productId}`);
            cachedData.meta.cache_hit = true;
            return res.status(200).json({ success: true, data: cachedData });
        }

        // 2. Discover Competitors
        const competitors = await discoverCompetitors(brandName, productName);

        // 3. Build Queries and Fetch Tavily Data
        const queries = buildSentimentQueries(brandName, productName, extraKeywords);
        let documents = [];
        try {
            documents = await searchTavily(queries);
        } catch (err) {
            logger.error(`Error fetching Tavily data: ${err.message}`);
            // Fallback: we will proceed with an empty document array to use low signal logic
        }

        // 4. Analyze Sentiment & Themes
        const analysisResult = await analyzeSentiment(documents);

        // 5. Compute Perception Score & Risk
        const scorecard = computePerceptionScore(analysisResult.documents, competitors);

        // 6. Assemble Final Payload
        const responsePayload = {
            market_perception_score: scorecard.market_perception_score,
            market_perception_label: scorecard.market_perception_label,
            ai_visibility_risk: scorecard.ai_visibility_risk,
            ai_visibility_reason: scorecard.ai_visibility_reason,

            sentiment_distribution: scorecard.sentiment_distribution,
            competitor_sentiment_gap: scorecard.competitor_sentiment_gap,

            trending_customer_themes: analysisResult.themes,
            sentiment_trend_30d: scorecard.sentiment_trend_30d,

            meta: {
                productId,
                userId,
                doc_count: documents.length,
                competitor_count: competitors.length,
                generated_at: new Date().toISOString(),
                cache_hit: false,
                time_window_days: timeWindowDays
            }
        };

        // 7. Save to cache and return
        setCachedSentiment(userId, productId + cacheKeySalt, timeWindowDays, responsePayload);

        return res.status(200).json({
            success: true,
            data: responsePayload
        });

    } catch (error) {
        logger.error(`Error in analyzeProductSentiment: ${error.message}`);
        next(error); // Pass to global error handler
    }
};

module.exports = {
    analyzeProductSentiment
};
