/**
 * Resolves standard product and brand names into comprehensive query sets
 */

const buildSentimentQueries = (brandName, productName, extraKeywords = []) => {
    const queries = [];

    const primaryTerm = productName || brandName || 'the product';
    const alternateTerm = productName ? brandName : productName; // if one is missing, it's undefined

    // Base core queries
    queries.push(`"${primaryTerm}" review`);
    queries.push(`"${primaryTerm}" complaints OR issues`);
    queries.push(`site:reddit.com "${primaryTerm}"`);

    if (alternateTerm) {
        queries.push(`"${alternateTerm} ${primaryTerm}" review`);
    }

    // Include extra context
    if (extraKeywords && extraKeywords.length > 0) {
        const extraStr = extraKeywords.slice(0, 2).join(' OR ');
        queries.push(`"${primaryTerm}" (${extraStr})`);
    }

    return queries;
};

module.exports = {
    buildSentimentQueries
};
