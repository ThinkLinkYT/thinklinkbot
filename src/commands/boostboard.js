const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("boostboard")
        .setDescription("Shows all current server boosters"),

    async execute(interaction) {
        // Ensure we have the full member list
        await interaction.guild.members.fetch();

        // Filter members who are boosting
        const boosters = interaction.guild.members.cache
            .filter(member => member.premiumSince)
            .map(member => `💎 <@${member.id}> — Boosting since <t:${Math.floor(member.premiumSince / 1000)}:R>`)
            .join("\n");

        const embed = new EmbedBuilder()
            .setTitle("🚀 Current Server Boosters")
            .setColor(0xF47FFF)
            .setDescription(boosters || "Nobody is boosting right now.")
            .setTimestamp();

        interaction.reply({ embeds: [embed] });
    }
};