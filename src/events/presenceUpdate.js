const targetUserId = "1169759575981953177";

module.exports = {
  name: "presenceUpdate",
  execute(_, newPresence, client) {
    if (newPresence.userId === targetUserId) {
      const status = newPresence.status;
      if (client.updateThinkLinkPresence) {
        client.updateThinkLinkPresence(status);
      }
    }
  }
};
