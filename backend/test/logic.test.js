const test = require("node:test");
const assert = require("node:assert/strict");
const {
  computeScore,
  extractEmail,
  normalizeSkill,
} = require("../utils/scoring");
const { parseJobInput } = require("../utils/validation");
const { createToken, verifyToken } = require("../utils/auth");

test("skill normalization handles punctuation while keeping language variants distinct", () => {
  assert.equal(normalizeSkill("Node.js"), normalizeSkill("node js"));
  assert.notEqual(normalizeSkill("C++"), normalizeSkill("C"));
  assert.notEqual(normalizeSkill("C#"), normalizeSkill("C"));
});

test("weighted score is deterministic and uses normalized skill matching", () => {
  const score = computeScore({
    weightedSkills: [
      { skill: "React", weight: 3 },
      { skill: "Node.js", weight: 1 },
    ],
    assessments: [
      { skill: "React.js", foundInResume: true },
      { skill: "nodejs", foundInResume: true },
    ],
  });
  assert.equal(score, 25);
});

test("required-skill scoring ignores absent and unconfirmed assessments", () => {
  assert.equal(
    computeScore({
      requiredSkills: ["A", "B"],
      assessments: [
        { skill: "a", foundInResume: true },
        { skill: "B", foundInResume: false },
      ],
    }),
    50,
  );
  assert.equal(computeScore({}), 0);
});

test("email extraction only accepts an address found in resume text", () => {
  assert.equal(
    extractEmail("Contact: Jane.Doe@Example.com"),
    "jane.doe@example.com",
  );
  assert.equal(extractEmail("No email in this resume"), "");
});

test("job validation trims fields, requires scoring skills, and clamps weights", () => {
  assert.ok(parseJobInput({ title: " ", description: "x" }).error);
  assert.ok(
    parseJobInput({ title: "Engineer", description: "Description" }).error,
  );

  const { value } = parseJobInput({
    title: " Engineer ",
    description: " Role description ",
    weightedSkills: [{ skill: "React", weight: 99 }, { skill: " " }],
    mustHaves: [" 5 years ", ""],
  });
  assert.equal(value.title, "Engineer");
  assert.deepEqual(value.weightedSkills, [{ skill: "React", weight: 5 }]);
  assert.deepEqual(value.mustHaves, ["5 years"]);
});

test("recruiter tokens require a valid signature and configured identity", () => {
  const previous = {
    email: process.env.RECRUITER_EMAIL,
    password: process.env.RECRUITER_PASSWORD,
    secret: process.env.ATS_AUTH_SECRET,
  };
  process.env.RECRUITER_EMAIL = "recruiter@example.com";
  process.env.RECRUITER_PASSWORD = "test-only-password";
  process.env.ATS_AUTH_SECRET = "test-only-secret-with-at-least-32-characters";

  try {
    const token = createToken("recruiter@example.com");
    assert.equal(verifyToken(token), true);
    assert.equal(verifyToken(`${token}tampered`), false);
    process.env.RECRUITER_EMAIL = "different@example.com";
    assert.equal(verifyToken(token), false);
  } finally {
    if (previous.email === undefined) delete process.env.RECRUITER_EMAIL;
    else process.env.RECRUITER_EMAIL = previous.email;
    if (previous.password === undefined) delete process.env.RECRUITER_PASSWORD;
    else process.env.RECRUITER_PASSWORD = previous.password;
    if (previous.secret === undefined) delete process.env.ATS_AUTH_SECRET;
    else process.env.ATS_AUTH_SECRET = previous.secret;
  }
});
