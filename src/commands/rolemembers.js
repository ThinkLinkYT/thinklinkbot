const {
  SlashCommandBuilder,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle
} = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("rolemembers")
    .setDescription("Shows all members who have a specific role")
    .addRoleOption(option =>
      option
        .setName("role")
        .setDescription("Select a role")
        .setRequired(true)
    ),

  async execute(interaction) {
    const role = interaction.options.getRole("role");

    await interaction.guild.members.fetch();

    const members = interaction.guild.members.cache
      .filter(m => m.roles.cache.has(role.id))
      .map(m => m);

    if (members.length === 0) {
      return interaction.reply({
        content: `No members have the role **${role.name}**.`,
        ephemeral: true
      });
    }

    const page = 0;
    const pageSize = 5;
    const totalPages = Math.ceil(members.length / pageSize);

    const embed = new EmbedBuilder()
      .setTitle(`Members with ${role.name}`)
      .setColor(role.color || 0x5865F2)
      .setDescription(
        members
          .slice(0, pageSize)
          .map(m => `- <@${m.id}>`)
          .join("\n")
      )
      .setFooter({ text: `Page 1 / ${totalPages}` });

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId(`rolemembers_back_${role.id}_0`)
        .setLabel("Back")
        .setStyle(ButtonStyle.Secondary)
        .setDisabled(true),

      new ButtonBuilder()
        .setCustomId(`rolemembers_next_${role.id}_0`)
        .setLabel("Next")
        .setStyle(ButtonStyle.Primary)
        .setDisabled(totalPages <= 1)
    );

    await interaction.reply({ embeds: [embed], components: [row] });
  }
};
