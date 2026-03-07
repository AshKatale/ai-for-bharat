// Interact Controller
// Handles POST /api/interact — runs a named SEO/GEO skill via Gemini.
const { runSkill, SKILL_PATHS } = require('../services/seoGeoSkillService');
const { sendSuccess, sendError } = require('../utils/responseHandler');
const logger = require('../utils/logger');

/**
 * POST /api/interact
 *
 * Body:
 *  {
 *    "skill":   "geo-content-optimizer",   // required
 *    "message": "Your content or query",   // required
 *    "model":   "gemini-2.5-flash"         // optional
 *  }
 */
const interact = async (req, res) => {
  const { skill, message, model } = req.body;

  if (!skill || typeof skill !== 'string' || !skill.trim()) {
    return sendError(res, 400, '"skill" is required. Available skills: ' + Object.keys(SKILL_PATHS).join(', '));
  }

  if (!message || typeof message !== 'string' || !message.trim()) {
    return sendError(res, 400, '"message" is required — provide the content or query for the skill to process.');
  }

  if (!SKILL_PATHS[skill.trim()]) {
    return sendError(
      res, 400,
      `Unknown skill "${skill}". Available skills: ${Object.keys(SKILL_PATHS).join(', ')}`
    );
  }

  try {
    const result = await runSkill(skill.trim(), message.trim(), model?.trim());

    return sendSuccess(res, 200, 'Skill executed successfully', {
      skill: skill.trim(),
      model: model?.trim() || process.env.GEMINI_MODEL || 'gemini-2.5-flash',
      response: result,
    });
  } catch (err) {
    logger.error(`/api/interact error: ${err.message}`);
    return sendError(res, 500, 'Skill execution failed.', err.message);
  }
};

/**
 * GET /api/interact/skills
 * Lists all available skills.
 */
const listSkills = (_req, res) => {
  const skills = Object.keys(SKILL_PATHS).map((name) => ({
    skill: name,
    category: SKILL_PATHS[name].split('/')[0],
    path: SKILL_PATHS[name],
  }));
  return sendSuccess(res, 200, 'Available skills', { skills });
};

module.exports = { interact, listSkills };
