const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const { ensureUser, updateUser } = require("../utils/database");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("job-quit")
        .setDescription("Quit your current job"),

    async execute(interaction) {
        const userId = interaction.user.id;
        const user = ensureUser(userId);

        if (!user.job.name) {
            const embed = new EmbedBuilder()
                .setTitle("❌ No Job to Quit")
                .setColor("Red")
                .setDescription("You do not have a job to quit.");

            return interaction.reply({ embeds: [embed] });
        }

        const oldJob = user.job.name;
        const now = Date.now();
        const cooldownTime = 30 * 60 * 1000; // 30 minutes

        // Reset job data completely
        user.job.name = null;
        user.job.level = 1;
        user.job.lastPayday = 0;
        user.job.lastActive = 0;
        user.job.streak = 0;
        user.job.raise = 0;
        user.job.pay = 0; // ⭐ NEW: Reset fixed payday amount

        // Ensure cooldown field exists
        if (user.job.applyCooldown === undefined) {
            user.job.applyCooldown = 0;
        }

        // Apply cooldown for quitting
        user.job.applyCooldown = now + cooldownTime;

        updateUser(userId, user);

        const embed = new EmbedBuilder()
            .setTitle("💼 Job Quit")
            .setColor("Red")
            .setDescription(
                `You have quit your job as a **${oldJob}**.\nYou must wait **30 minutes** before applying for a new job.`
            );

        return interaction.reply({ embeds: [embed] });
    }
};