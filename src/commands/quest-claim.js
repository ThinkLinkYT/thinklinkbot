const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const { ensureUser, updateUser } = require("../utils/database");
const { checkWeeklyReset } = require("../utils/questUtils");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("quest-claim")
        .setDescription("Claim your weekly quest rewards"),

    async execute(interaction) {
        checkWeeklyReset();

        const user = ensureUser(interaction.user.id);

        if (user.quests.claimed) {
            return interaction.reply("❌ You already claimed your weekly reward.");
        }

        const goals = user.quests.weekly;
        const progress = user.quests.progress;

        let completed = true;

        for (const q in goals) {
            if ((progress[q] || 0) < goals[q]) {
                completed = false;
            }
        }

        if (!completed) {
            return interaction.reply("❌ You haven't completed all weekly quests yet.");
        }

        const reward = 500;
        user.wallet += reward;
        user.quests.claimed = true;

        updateUser(interaction.user.id, user);

        const embed = new EmbedBuilder()
            .setTitle("🎉 Weekly Quests Completed!")
            .setColor("Gold")
            .setDescription(`You earned **${reward} coins**!`);

        return interaction.reply({ embeds: [embed] });
    }
};
