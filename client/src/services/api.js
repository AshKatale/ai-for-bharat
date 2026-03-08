// services/api.js — Axios instance for backend
import axios from 'axios';

const BASE_URL = import.meta.env.VITE_BACKEND_URI || 'http://localhost:8080';

// ── Default axios instance 
const api = axios.create({
  baseURL: `${BASE_URL}/api`,
  headers: { 'Content-Type': 'application/json' },
});

// Attach JWT token automatically
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// On 401 → clear token and redirect to login
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export default api;

// ── Sentiment / AI-discoverability helpers (from sentiment-analysis branch) ─
const sentimentClient = axios.create({
  baseURL: 'https://mock.ai-discoverability.local',
});

const simulate = (data, delay = 900) =>
  new Promise((resolve) => {
    setTimeout(() => resolve(data), delay);
  });

// Mock data fixtures used by simulate()
const visibilityTrend = [];
const competitorComparison = [];
const platformPresence = [];
const campaigns = [];
const sentimentSplit = [];
const keywords = [];

export const sentimentApi = {
  client: sentimentClient,

  getOverview: () =>
    simulate({
      visibilityScore: 74,
      trend: visibilityTrend,
      competitors: competitorComparison,
      presence: platformPresence,
      campaigns,
    }),

  getPresenceAnalytics: () =>
    simulate({
      competitors: competitorComparison,
      gap: 'Your GPT visibility leads by 6 points, but Perplexity mentions trail by 14 points.',
      suggestions: [
        'Publish comparison pages with structured facts for AI crawlers.',
        'Increase third-party citations and expert mentions.',
        'Add FAQ schema focused on buyer-intent prompts.',
      ],
    }),

  getStrategy: () =>
    simulate(
      {
        summary:
          'Prioritize authority content, benchmark prompts weekly, and run narrative consistency campaigns across high-trust channels.',
        channels: ['LinkedIn Thought Leadership', 'YouTube Product Explainers', 'Niche Podcasts', 'SEO + LLM Landing Pages'],
        optimizations: [
          'Answer high-intent questions with structured snippets.',
          'Align product pages to conversational query patterns.',
          'Publish competitor-differentiation tables for AI ingestion.',
        ],
      },
      1200
    ),

  getSentiment: () =>
    simulate({
      score: 72,
      breakdown: sentimentSplit,
      keywords,
    }),

  // LIVE SENTIMENT ENDPOINT
  analyzeSentiment: async (productId = 'default', options = {}) => {
    const baseUrl = BASE_URL;
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
  },
};
