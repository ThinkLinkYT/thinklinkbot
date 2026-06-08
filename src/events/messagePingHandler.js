const {
  getPingSettings,
  getAbuseData,
  saveAbuseData
} = require("../utils/pingManager");

module.exports = {
  name: "messageCreate",

  async execute(message, client) {
    if (!message.guild || message.author.bot) return;

    const OWNER_ID = process.env.OWNER_ID;
    const settings = getPingSettings();
    const abuse = getAbuseData();

    // Ignore reply pings entirely
    if (message.reference) return;

    const mentions = message.mentions.users;
    if (!mentions.size) return;

    // Check if ANY mentioned user has pings disabled
    let pingedProtectedUser = false;

    for (const [id] of mentions) {
      if (settings[id] === false) {
        pingedProtectedUser = true;
        break;
      }
    }

    // If no protected user was pinged, do nothing
    if (!pingedProtectedUser) return;

    // If the sender is the owner, do not delete or punish
    if (message.author.id === OWNER_ID) return;

    // Delete the message ONCE
    try {
      await message.delete().catch(() => {});
    } catch {}

    // Increment abuse count ONCE
    if (!abuse[message.author.id]) abuse[message.author.id] = 0;
    abuse[message.author.id]++;
    saveAbuseData(abuse);

    // Timeout after 3 violations
    if (abuse[message.author.id] >= 3) {
      const member = await message.guild.members.fetch(message.author.id).catch(() => null);

      if (member) {
        try {
          await member.timeout(24 * 60 * 60 * 1000, "Ping abuse");
        } catch (err) {
          console.error("Timeout failed:", err);
        }

        // Send ONE timeout message
        try {
          await message.channel.send({
            content: `<@${message.author.id}> You have been timed out for **24 hours** for repeatedly pinging a user who disabled pings.`,
            allowedMentions: { users: [] }
          });
        } catch {}
      }

      // Reset abuse count
      abuse[message.author.id] = 0;
      saveAbuseData(abuse);
    }
  }
};
