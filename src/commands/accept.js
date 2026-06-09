const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("accept")
    .setDescription("Accept a collab request (Owner only)")
    .addUserOption(option =>
      option
        .setName("user")
        .setDescription("The user to accept")
        .setRequired(true)
    ),

  async execute(i, client) {
    const user = i.options.getUser("user");
    if (!user) {
      return i.reply({
        content: "You must specify a user.",
        ephemeral: true
      });
    }

    try {
      const guild = await client.guilds.fetch(process.env.GUILD_ID);
      const member = await guild.members.fetch(user.id);

      // Add collab role
      await member.roles.add("1445051565407998053");

      // Build embed
      const embed = new EmbedBuilder()
        .setTitle("✅ Collab Request Accepted")
        .setDescription(`<@${user.id}>, your collaboration request has been **accepted**!`)
        .setColor(0x2ecc71);

      await i.reply({ embeds: [embed] });
    } catch (err) {
      console.error(err);
      return i.reply({
        content: "Failed to assign role.",
        ephemeral: true
      });
    }
  }
};
