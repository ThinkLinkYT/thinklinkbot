const REQUIRED_ENV = [
  "DISCORD_TOKEN",
  "CLIENT_ID",
  "GUILD_ID",
  "OWNER_ID"
];

function getMissingEnv(required = REQUIRED_ENV) {
  return required.filter(name => !process.env[name] || !process.env[name].trim());
}

function assertRequiredEnv(required = REQUIRED_ENV) {
  const missing = getMissingEnv(required);
  if (missing.length) {
    throw new Error(
      `Missing required environment variable(s): ${missing.join(", ")}. ` +
        "Copy .env.example to .env and fill in the real values."
    );
  }
}

module.exports = {
  REQUIRED_ENV,
  getMissingEnv,
  assertRequiredEnv
};
