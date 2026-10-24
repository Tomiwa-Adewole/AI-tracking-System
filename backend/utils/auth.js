const crypto = require("crypto");

const TOKEN_TTL_SECONDS = 8 * 60 * 60;

const configured = () =>
  Boolean(
    process.env.RECRUITER_EMAIL &&
    process.env.RECRUITER_PASSWORD &&
    (process.env.ATS_AUTH_SECRET || "").length >= 32,
  );

const safeEqual = (left, right) => {
  const a = Buffer.from(String(left));
  const b = Buffer.from(String(right));
  return a.length === b.length && crypto.timingSafeEqual(a, b);
};

const sign = (payload) =>
  crypto
    .createHmac("sha256", process.env.ATS_AUTH_SECRET)
    .update(payload)
    .digest("base64url");

function createToken(email) {
  const payload = Buffer.from(
    JSON.stringify({
      sub: email,
      exp: Math.floor(Date.now() / 1000) + TOKEN_TTL_SECONDS,
    }),
  ).toString("base64url");
  return `${payload}.${sign(payload)}`;
}

function verifyToken(token) {
  if (!configured() || typeof token !== "string") return false;
  const [payload, signature, extra] = token.split(".");
  if (
    !payload ||
    !signature ||
    extra !== undefined ||
    !safeEqual(sign(payload), signature)
  ) {
    return false;
  }
  try {
    const claims = JSON.parse(
      Buffer.from(payload, "base64url").toString("utf8"),
    );
    return (
      claims.sub === process.env.RECRUITER_EMAIL &&
      Number.isFinite(claims.exp) &&
      claims.exp > Math.floor(Date.now() / 1000)
    );
  } catch {
    return false;
  }
}

function login(req, res) {
  if (!configured()) {
    return res
      .status(503)
      .json({
        error: "Recruiter authentication is not configured on the server.",
      });
  }

  const { email, password } = req.body || {};
  if (
    typeof email !== "string" ||
    typeof password !== "string" ||
    !safeEqual(
      email.trim().toLowerCase(),
      process.env.RECRUITER_EMAIL.trim().toLowerCase(),
    ) ||
    !safeEqual(password, process.env.RECRUITER_PASSWORD)
  ) {
    return res.status(401).json({ error: "Invalid email or password." });
  }

  return res
    .status(200)
    .json({ token: createToken(process.env.RECRUITER_EMAIL) });
}

function authenticate(req, res, next) {
  if (!configured()) {
    return res
      .status(503)
      .json({
        error: "Recruiter authentication is not configured on the server.",
      });
  }
  const authorization = req.get("authorization") || "";
  const token = authorization.startsWith("Bearer ")
    ? authorization.slice(7)
    : "";
  if (!verifyToken(token)) {
    return res
      .status(401)
      .json({ error: "Your session has expired. Please sign in again." });
  }
  next();
}

module.exports = { authenticate, login, configured, createToken, verifyToken };
