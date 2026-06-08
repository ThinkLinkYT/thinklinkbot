const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const jobs = require("../../data/jobs.json");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("job-list")
        .setDescription("View all available jobs"),

    async execute(interaction) {
        const embed = new EmbedBuilder()
            .setTitle("Available Jobs")
            .setColor("Blue");

        for (const job in jobs) {
            embed.addFields({
                name: job,
                value: `Pay Range: ${jobs[job].min} - ${jobs[job].max}`,
                inline: false
            });
        }

        await interaction.reply({ embeds: [embed] });
    }
};