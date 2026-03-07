// SEO & GEO Skills Service
// Fetches skill prompts from aaron-he-zhu/seo-geo-claude-skills and runs them via Gemini.
const https = require('https');
const { GoogleGenAI } = require('@google/genai');
const logger = require('../utils/logger');

const SKILL_REPO_BASE =
  'https://raw.githubusercontent.com/aaron-he-zhu/seo-geo-claude-skills/main';

const DEFAULT_MODEL = process.env.GEMINI_MODEL || 'gemini-2.5-flash';

// In-process cache so each skill README is only fetched once per server lifetime
const skillPromptCache = new Map();

/**
 * Maps a short skill name → its path inside the repo.
 */
const SKILL_PATHS = {
  // Research
  'keyword-research':        'research/keyword-research',
  'competitor-analysis':     'research/competitor-analysis',
  'serp-analysis':           'research/serp-analysis',
  'content-gap-analysis':    'research/content-gap-analysis',
  // Build
  'geo-content-optimizer':   'build/geo-content-optimizer',
  'seo-content-writer':      'build/seo-content-writer',
  'meta-tags-optimizer':     'build/meta-tags-optimizer',
  'schema-markup-generator': 'build/schema-markup-generator',
  // Optimize
  'on-page-seo-auditor':          'optimize/on-page-seo-auditor',
  'technical-seo-checker':        'optimize/technical-seo-checker',
  'internal-linking-optimizer':   'optimize/internal-linking-optimizer',
  'content-refresher':            'optimize/content-refresher',
  // Monitor
  'rank-tracker':        'monitor/rank-tracker',
  'backlink-analyzer':   'monitor/backlink-analyzer',
  'performance-reporter':'monitor/performance-reporter',
  'alert-manager':       'monitor/alert-manager',
  // Cross-cutting
  'content-quality-auditor':  'cross-cutting/content-quality-auditor',
  'domain-authority-auditor': 'cross-cutting/domain-authority-auditor',
  'entity-optimizer':         'cross-cutting/entity-optimizer',
};

/**
 * Fetches the README.md of a skill from GitHub as a plain string.
 * Results are cached in memory.
 */
const fetchSkillPrompt = (skillName) =>
  new Promise((resolve, reject) => {
    if (skillPromptCache.has(skillName)) {
      return resolve(skillPromptCache.get(skillName));
    }

    const subPath = SKILL_PATHS[skillName];
    if (!subPath) {
      return reject(new Error(`Unknown skill: "${skillName}". Available: ${Object.keys(SKILL_PATHS).join(', ')}`));
    }

    const url = `${SKILL_REPO_BASE}/${subPath}/SKILL.md`;
    logger.info(`Fetching skill prompt: ${url}`);

    https.get(url, (res) => {
      if (res.statusCode !== 200) {
        return reject(new Error(`Failed to fetch skill "${skillName}" (HTTP ${res.statusCode})`));
      }
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        skillPromptCache.set(skillName, data);
        resolve(data);
      });
    }).on('error', reject);
  });

/**
 * Run a SEO/GEO skill via Gemini.
 *
 * @param {string} skillName  - One of the keys in SKILL_PATHS
 * @param {string} userMessage - The user's query or content to analyse
 * @param {string} [model]     - Gemini model override
 * @returns {Promise<string>}  - Raw text response from Gemini
 */
const runSkill = async (skillName, userMessage, model = DEFAULT_MODEL) => {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error('GEMINI_API_KEY is not set in environment variables.');
  }

  const systemPrompt = await fetchSkillPrompt(skillName);

  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

  logger.info(`Running skill "${skillName}" with model "${model}"`);

  const response = await ai.models.generateContent({
    model,
    contents: userMessage,
    config: {
      systemInstruction: systemPrompt,
    },
  });

  return response.text;
};

module.exports = { runSkill, SKILL_PATHS };
