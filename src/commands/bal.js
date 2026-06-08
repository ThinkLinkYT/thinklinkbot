const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const { ensureUser } = require("../utils/database");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("bal")
        .setDescription("View your wallet and bank balance")
        .addUserOption(option =>
            option
                .setName("user")
                .setDescription("Whose balance do you want to view?")
                .setRequired(false)
        ),

    async execute(interaction) {
        const target = interaction.options.getUser("user") || interaction.user;
        const userData = ensureUser(target.id);

        const embed = new EmbedBuilder()
            .setTitle(`💰 Balance for ${target.username}`)
            .setColor("Gold")
            .addFields(
                { name: "Wallet", value: `${userData.wallet}`, inline: true },
                { name: "Bank", value: `${userData.bank}`, inline: true }
            )
            .setThumbnail(target.displayAvatarURL({ dynamic: true }));

        await interaction.reply({ embeds: [embed] });
    }
};
