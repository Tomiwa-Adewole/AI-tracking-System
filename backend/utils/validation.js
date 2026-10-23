const OBJECT_ID_RE = /^[a-f\d]{24}$/i;
const MAX_LIST_ITEMS = 50;
const MAX_ITEM_LENGTH = 200;

const cleanString = (value, max) =>
  typeof value === "string" ? value.trim().slice(0, max) : "";

const cleanList = (value) =>
  (Array.isArray(value) ? value : [])
    .map((item) => cleanString(item, MAX_ITEM_LENGTH))
    .filter(Boolean)
    .slice(0, MAX_LIST_ITEMS);

function parseJobInput(body = {}) {
  if (!body || typeof body !== "object" || Array.isArray(body)) body = {};
  const title = cleanString(body.title, 150);
  const description = cleanString(body.description, 10000);
  if (!title) return { error: "Job title is required." };
  if (!description) return { error: "Job description is required." };

  const requiredSkills = cleanList(body.requiredSkills);
  const mustHaves = cleanList(body.mustHaves);
  const weightedSkills = (
    Array.isArray(body.weightedSkills) ? body.weightedSkills : []
  )
    .map((item) => ({
      skill: cleanString(item?.skill, MAX_ITEM_LENGTH),
      weight: Math.min(5, Math.max(1, Math.round(Number(item?.weight) || 1))),
    }))
    .filter((item) => item.skill)
    .slice(0, MAX_LIST_ITEMS);

  if (requiredSkills.length === 0 && weightedSkills.length === 0) {
    return { error: "Add at least one required or weighted skill." };
  }

  return {
    value: {
      title,
      department: cleanString(body.department, 100),
      description,
      requiredSkills,
      mustHaves,
      weightedSkills,
    },
  };
}

const validateObjectId =
  (...params) =>
  (req, res, next) => {
    for (const name of params) {
      if (!OBJECT_ID_RE.test(req.params[name] || "")) {
        return res.status(400).json({ error: `Invalid ${name}.` });
      }
    }
    next();
  };

module.exports = { parseJobInput, validateObjectId, cleanString };
