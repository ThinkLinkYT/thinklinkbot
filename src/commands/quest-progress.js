const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const { ensureUser } = require("../utils/database");
const { checkWeeklyReset } = require("../utils/questUtils");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("quest-progress")
        .setDescription("View your quest progress"),

    async execute(interaction) {
        checkWeeklyReset();

        const user = ensureUser(interaction.user.id);

        const embed = new EmbedBuilder()
            .setTitle("📊 Quest Progress")
            .setColor("Green");

        for (const task in user.quests.progress) {
            embed.addFields({
                name: task,
                value: `Progress: ${user.quests.progress[task]}\nGoal: ${user.quests.weekly[task]}`,
                inline: true
            });
        }

        await interaction.reply({ embeds: [embed] });
    }
};
