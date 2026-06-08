const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const jobs = require("../../data/jobs.json");
const { ensureUser, updateUser } = require("../utils/database");
const { formatCoins } = require("../utils/economy");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("job-info")
        .setDescription("View your current job"),

    async execute(interaction) {
        const user = ensureUser(interaction.user.id);

        if (!user.job.name) {
            return interaction.reply("❌ You do not currently have a job.");
        }

        const job = jobs[user.job.name];
        if (!job) {
            return interaction.reply("Your current job no longer exists. Use /job-quit, then apply for a new job.");
        }

        // Fallback for old users missing pay field
        if (user.job.pay === undefined) {
            user.job.pay = Math.floor(Math.random() * (job.max - job.min + 1)) + job.min;
            updateUser(interaction.user.id, user);
        }

        const now = Date.now();
        const oneDay = 24 * 60 * 60 * 1000;

        let nextPayday = "Ready to claim!";
        if (now - user.job.lastPayday < oneDay) {
            const remaining = oneDay - (now - user.job.lastPayday);
            const hours = Math.floor(remaining / (1000 * 60 * 60));
            const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));
            nextPayday = `${hours}h ${minutes}m`;
        }

        const embed = new EmbedBuilder()
            .setTitle("💼 Your Job Information")
            .setColor("Green")
            .addFields(
                { name: "Job", value: user.job.name, inline: true },
                { name: "Level", value: `${user.job.level}`, inline: true },
                { name: "Fixed Pay", value: formatCoins(user.job.pay), inline: true },
                { name: "Raise Bonus", value: `+${formatCoins(user.job.raise)}`, inline: true },
                { name: "Daily Streak", value: `${user.job.streak} days`, inline: true },
                { name: "Next Payday", value: nextPayday, inline: true },
                { name: "Original Pay Range", value: `${formatCoins(job.min)} - ${formatCoins(job.max)}`, inline: false }
            )
            .setFooter({ text: "Use /payday every 24 hours to collect your earnings." });

        return interaction.reply({ embeds: [embed] });
    }
};
