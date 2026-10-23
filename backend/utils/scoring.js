const normalizeSkill = (value) =>
  String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9+#]/g, "");

const isFound = (assessments, skill) => {
  const target = normalizeSkill(skill);
  if (!target) return false;
  return (assessments || []).some(
    (assessment) =>
      assessment &&
      assessment.foundInResume &&
      normalizeSkill(assessment.skill) === target,
  );
};

function computeScore({
  weightedSkills = [],
  requiredSkills = [],
  assessments = [],
}) {
  if (weightedSkills.length > 0) {
    let totalWeight = 0;
    let earnedWeight = 0;
    for (const item of weightedSkills) {
      const weight = Number(item.weight) > 0 ? Number(item.weight) : 1;
      totalWeight += weight;
      if (isFound(assessments, item.skill)) earnedWeight += weight;
    }
    return totalWeight > 0 ? Math.round((earnedWeight / totalWeight) * 100) : 0;
  }

  if (requiredSkills.length > 0) {
    const matched = requiredSkills.filter((skill) =>
      isFound(assessments, skill),
    ).length;
    return Math.round((matched / requiredSkills.length) * 100);
  }

  return 0;
}

const EMAIL_RE = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i;

function extractEmail(resumeText) {
  const fromResume = String(resumeText || "").match(EMAIL_RE);
  return fromResume ? fromResume[0].toLowerCase() : "";
}

module.exports = { normalizeSkill, computeScore, extractEmail };
