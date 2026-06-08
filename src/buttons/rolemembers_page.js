const {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle
} = require("discord.js");

module.exports = {
  id: "rolemembers_",

  async execute(interaction) {
    const parts = interaction.customId.split("_");
    const action = parts[1];
    const roleId = parts[2];
    const page = parseInt(parts[3], 10) || 0;

    const role = interaction.guild.roles.cache.get(roleId);
    if (!role) {
      return interaction.update({
        content: "That role no longer exists.",
        embeds: [],
        components: []
      });
    }

    await interaction.guild.members.fetch();

    const members = interaction.guild.members.cache
      .filter(m => m.roles.cache.has(role.id))
      .map(m => m);

    if (!members.length) {
      return interaction.update({
        content: `No members have the role **${role.name}**.`,
        embeds: [],
        components: []
      });
    }

    const pageSize = 5;
    const totalPages = Math.ceil(members.length / pageSize);

    // ⭐ Prevent invalid page numbers
    let newPage = action === "next" ? page + 1 : page - 1;
    if (newPage < 0) newPage = 0;
    if (newPage >= totalPages) newPage = totalPages - 1;

    const embed = new EmbedBuilder()
      .setTitle(`Members with ${role.name}`)
      .setColor(role.color || 0x5865F2)
      .setDescription(
        members
          .slice(newPage * pageSize, (newPage + 1) * pageSize)
          .map(m => `- <@${m.id}>`)
          .join("\n")
      )
      .setFooter({ text: `Page ${newPage + 1} / ${totalPages}` });

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId(`rolemembers_back_${role.id}_${newPage}`)
        .setLabel("Back")
        .setStyle(ButtonStyle.Secondary)
        .setDisabled(newPage === 0),

      new ButtonBuilder()
        .setCustomId(`rolemembers_next_${role.id}_${newPage}`)
        .setLabel("Next")
        .setStyle(ButtonStyle.Primary)
        .setDisabled(newPage + 1 >= totalPages)
    );

    await interaction.update({ content: null, embeds: [embed], components: [row] });
  }
};
