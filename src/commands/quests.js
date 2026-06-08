const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const { ensureUser, updateUser } = require("../utils/database");
const { checkWeeklyReset, generateWeeklyQuests } = require("../utils/questUtils");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("quests")
        .setDescription("View your weekly quests"),

    async execute(interaction) {
        checkWeeklyReset();

        const user = ensureUser(interaction.user.id);

        // If user has no quests, generate them
        if (!user.quests || !user.quests.weekly) {
            user.quests = {
                weekly: generateWeeklyQuests(),
                progress: { fish: 0, mine: 0, chop: 0, farm: 0 },
                claimed: false
            };
            updateUser(interaction.user.id, user);
        }

        const embed = new EmbedBuilder()
            .setTitle("📜 Weekly Quests")
            .setColor("Yellow");

        for (const task in user.quests.weekly) {
            embed.addFields({
                name: task,
                value: `Goal: ${user.quests.weekly[task]}\nProgress: ${user.quests.progress[task]}`,
                inline: true
            });
        }

        await interaction.reply({ embeds: [embed] });
    }
};
