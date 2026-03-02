const logger = require('../utils/logger');

// Simple deterministic fallback for sentiment analysis
const analyzeFallback = (text = '') => {
    const lowerText = text.toLowerCase();

    // Basic keyword matching
    const positiveWords = ['great', 'excellent', 'good', 'best', 'love', 'amazing', 'perfect', 'recommend', 'fast', 'easy', 'helpful'];
    const negativeWords = ['bad', 'terrible', 'worst', 'hate', 'awful', 'poor', 'slow', 'hard', 'difficult', 'bug', 'issue', 'problem', 'fail', 'error'];

    let posCount = 0;
    let negCount = 0;

    const words = lowerText.split(/\W+/);
    words.forEach(word => {
        if (positiveWords.includes(word)) posCount++;
        if (negativeWords.includes(word)) negCount++;
    });

    if (posCount > negCount * 1.5) return { label: 'positive', confidence: 0.8 };
    if (negCount > posCount * 1.5) return { label: 'negative', confidence: 0.8 };
    return { label: 'neutral', confidence: 0.6 };
};

// Deterministic fallback for themes based on text
const extractThemesFallback = (texts) => {
    const allText = texts.join(' ').toLowerCase();

    // Define a set of possible SaaS/App themes
    const availableThemes = [
        { regex: /usability|UI|UX|interface|easy to use|intuitive/i, name: 'User Experience' },
        { regex: /support|customer service|help desk|response time/i, name: 'Customer Support' },
        { regex: /price|cost|expensive|cheap|value|pricing/i, name: 'Pricing & Value' },
        { regex: /speed|fast|slow|performance|lag|loading/i, name: 'Performance' },
        { regex: /feature|functionality|missing|capabilities/i, name: 'Features' },
        { regex: /integration|api|connect|plugin|addon/i, name: 'Integrations' },
        { regex: /security|privacy|data|safe/i, name: 'Security' },
        { regex: /bug|crash|error|glitch|broken/i, name: 'Stability' }
    ];

    const themeCounts = {};

    availableThemes.forEach(theme => {
        const matches = allText.match(new RegExp(theme.regex, 'g'));
        if (matches) {
            themeCounts[theme.name] = matches.length;
        }
    });

    // Sort and pick top 5
    return Object.entries(themeCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([name, matchCount]) => ({
            theme: name,
            weight: 10 + Math.min(matchCount * 2, 90), // simple weight scaling 10-100
            sentiment_score: 50 + (Math.random() * 40 - 20) // random sentiment for theme 30-70 for fallback
        }));
};


const analyzeSentiment = async (documents) => {
    const provider = process.env.LLM_PROVIDER || 'none';

    // Even if we had OpenAI set up, for this deterministic scale, we'll use fallback 
    // if not implemented fully, to ensure it doesn't break.
    // We'll map each document to a sentiment classification.

    const analyzedDocs = documents.map(doc => {
        const textToAnalyze = `${doc.title || ''} ${doc.content || ''}`;
        const analysis = analyzeFallback(textToAnalyze);
        return {
            ...doc,
            sentiment: analysis.label,
            sentimentConfidence: analysis.confidence
        };
    });

    // Extract global themes across all texts
    const allTexts = documents.map(doc => `${doc.title || ''} ${doc.content || ''}`);
    const themes = extractThemesFallback(allTexts);

    // If no themes found (e.g. not enough text), provide a default structural theme
    if (themes.length === 0) {
        themes.push({ theme: 'General Feedback', weight: 50, sentiment_score: 50 });
    }

    return {
        documents: analyzedDocs,
        themes: themes
    };
};

module.exports = {
    analyzeSentiment
};
