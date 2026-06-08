const { ChannelType, EmbedBuilder } = require("discord.js");
const { getUserStats, saveWrappedStats } = require("./wrapped");

function buildThreadName(type, username) {
  const safeName = String(username || "user")
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);

  return `${type}-ticket-${safeName || "user"}`.slice(0, 90);
}

async function createTicket(interaction, type, title, description) {
  if (!interaction.channel?.threads) {
    return interaction.reply({
      content: "Tickets can only be created in a channel that supports threads.",
      ephemeral: true
    });
  }

  const thread = await interaction.channel.threads.create({
    name: buildThreadName(type, interaction.user.username),
    type: ChannelType.PrivateThread,
    invitable: false
  });

  await thread.members.add(interaction.user.id).catch(() => {});
  await thread.members.add(process.env.OWNER_ID).catch(() => {});

  const stats = getUserStats(interaction.user.id);
  stats.tickets = (stats.tickets || 0) + 1;
  saveWrappedStats();

  const embed = new EmbedBuilder()
    .setTitle(title)
    .setDescription(description)
    .setColor(0x5865f2)
    .setTimestamp();

  await thread.send({
    content: `Opened by <@${interaction.user.id}>`,
    embeds: [embed]
  });

  await interaction.reply({
    content: `Your ${type} ticket has been created: ${thread.toString()}`,
    ephemeral: true
  });
}

module.exports = {
  createTicket
};
