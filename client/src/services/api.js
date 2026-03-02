import axios from 'axios';
import {
  visibilityTrend,
  competitorComparison,
  platformPresence,
  campaigns,
  sentimentSplit,
  keywords
} from '../data/mockData';

const client = axios.create({
  baseURL: 'https://mock.ai-discoverability.local'
});

const simulate = (data, delay = 900) =>
  new Promise((resolve) => {
    setTimeout(() => resolve(data), delay);
  });

export const api = {
  client,
  getOverview: () =>
    simulate({
      visibilityScore: 74,
      trend: visibilityTrend,
      competitors: competitorComparison,
      presence: platformPresence,
      campaigns
    }),
  getPresenceAnalytics: () =>
    simulate({
      competitors: competitorComparison,
      gap: 'Your GPT visibility leads by 6 points, but Perplexity mentions trail by 14 points.',
      suggestions: [
        'Publish comparison pages with structured facts for AI crawlers.',
        'Increase third-party citations and expert mentions.',
        'Add FAQ schema focused on buyer-intent prompts.'
      ]
    }),
  getStrategy: () =>
    simulate({
      summary:
        'Prioritize authority content, benchmark prompts weekly, and run narrative consistency campaigns across high-trust channels.',
      channels: ['LinkedIn Thought Leadership', 'YouTube Product Explainers', 'Niche Podcasts', 'SEO + LLM Landing Pages'],
      optimizations: [
        'Answer high-intent questions with structured snippets.',
        'Align product pages to conversational query patterns.',
        'Publish competitor-differentiation tables for AI ingestion.'
      ]
    }, 1200),
  getSentiment: () =>
    simulate({
      score: 72,
      breakdown: sentimentSplit,
      keywords
    }),

  // LIVE SENTIMENT ENDPOINT
  analyzeSentiment: async (productId = 'default', options = {}) => {
    // For local dev, assuming server is on 5000
    // Real app might use dynamic env baseUrl
    const baseUrl = 'http://localhost:5000';

    try {
      const response = await axios.post(
        `${baseUrl}/api/sentiment/analyze/${productId}`,
        options
      );
      return response.data;
    } catch (error) {
      console.error('Sentiment fetch failed:', error);
      throw error;
    }
  }
};
