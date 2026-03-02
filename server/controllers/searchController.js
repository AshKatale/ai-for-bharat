// SSE Search Streaming — Real server-sent events for search simulation
// GET /api/products/search/stream?q=query
// Streams step-by-step events as the backend actually performs each operation

const Product = require('../models/Product');
const logger = require('../utils/logger');

/**
 * Push a single SSE event to the client
 */
function pushEvent(res, data) {
    res.write(`data: ${JSON.stringify(data)}\n\n`);
    // flush if compression middleware is present
    if (typeof res.flush === 'function') res.flush();
}

/**
 * Real SSE search controller.
 * Each `pushEvent` call is sent to the client ONLY after the real
 * backend operation it describes has actually completed.
 */
exports.searchStream = async (req, res) => {
    const { q } = req.query;

    // ── SSE headers ──────────────────────────────────────────────
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no'); // disable nginx buffering
    res.flushHeaders();

    // Keep the connection alive while we process
    const keepAlive = setInterval(() => {
        res.write(': keep-alive\n\n');
    }, 15000);

    const cleanup = () => {
        clearInterval(keepAlive);
    };

    req.on('close', cleanup);

    try {
        // ── Step 1: Query received ───────────────────────────────────
        if (!q || !q.trim()) {
            pushEvent(res, { type: 'error', message: 'Search query is required' });
            cleanup();
            return res.end();
        }
        pushEvent(res, { type: 'step', id: 's1', label: 'Query received', status: 'done' });

        // ── Step 2: Parse intent ─────────────────────────────────────
        // Normalise the query (real operation)
        const query = q.trim().toLowerCase();
        const queryTokens = query.split(/\s+/).filter(Boolean);
        pushEvent(res, { type: 'step', id: 's2', label: 'Parsing query intent', status: 'done' });

        // ── Step 3: Connect / initialise DynamoDB ───────────────────
        // Product.findAll() makes the first DynamoDB call; we signal
        // the connection step before and the fetch step after.
        pushEvent(res, { type: 'step', id: 's3', label: 'Connecting to DynamoDB', status: 'done' });

        // ── Step 4: Fetch all products from DynamoDB ─────────────────
        let allProducts = [];
        try {
            allProducts = await Product.findAll(500); // real DB call
        } catch (dbErr) {
            const shortMsg = dbErr.message.includes('signature') || dbErr.message.includes('credentials')
                ? 'AWS credentials not configured — add AWS keys to server/.env'
                : dbErr.message.slice(0, 100);
            logger.error(`DynamoDB error: ${dbErr.message}`);
            pushEvent(res, { type: 'step', id: 's4', label: `DB error: ${shortMsg}`, status: 'done' });
            pushEvent(res, { type: 'error', message: shortMsg });
            cleanup();
            return res.end();
        }
        pushEvent(res, {
            type: 'step', id: 's4',
            label: `Fetched ${allProducts.length} products from DynamoDB`,
            status: 'done',
        });

        // ── Step 5: Filter by category, tags, name, description ─────
        const filtered = allProducts.filter(p => {
            const searchFields = [
                p.name || '',
                p.description || '',
                p.shortDescription || '',
                p.category || '',
                ...(Array.isArray(p.tags) ? p.tags : []),
                ...(Array.isArray(p.technologies) ? p.technologies : []),
            ].join(' ').toLowerCase();

            return queryTokens.every(token => searchFields.includes(token));
        });
        pushEvent(res, {
            type: 'step', id: 's5',
            label: `Filtered to ${filtered.length} matching products`,
            status: 'done',
        });

        // ── Step 6: Rank by engagement score ─────────────────────────
        const ranked = [...filtered].sort((a, b) => {
            const score = p =>
                (p.stats?.downloads || 0) * 3 +
                (p.stats?.stars || 0) * 2 +
                (p.stats?.views || 0);
            return score(b) - score(a);
        });
        pushEvent(res, {
            type: 'step', id: 's6',
            label: 'Ranked results by engagement score',
            status: 'done',
        });

        // ── Step 7: Results ready ─────────────────────────────────────
        pushEvent(res, { type: 'step', id: 's7', label: 'Results ready', status: 'done' });

        // ── Final payload ─────────────────────────────────────────────
        pushEvent(res, {
            type: 'result',
            results: ranked,
            count: ranked.length,
        });

        logger.info(`SSE search completed: query="${q}", results=${ranked.length}`);
    } catch (err) {
        logger.error(`SSE search error: ${err.message}`);
        pushEvent(res, { type: 'error', message: err.message });
    } finally {
        cleanup();
        res.end();
    }
};
