const MODERATOR_ROLE_ID = "1265101270960570392";

function isOwner(interaction) {
  return Boolean(process.env.OWNER_ID && interaction.user?.id === process.env.OWNER_ID);
}

function hasModeratorRole(interaction) {
  const roles = interaction.member?.roles;
  if (roles?.cache?.has) return roles.cache.has(MODERATOR_ROLE_ID);
  if (Array.isArray(roles)) return roles.includes(MODERATOR_ROLE_ID);
  return false;
}

function canManageTickets(interaction) {
  return isOwner(interaction) || hasModeratorRole(interaction);
}

module.exports = {
  MODERATOR_ROLE_ID,
  isOwner,
  hasModeratorRole,
  canManageTickets
};
