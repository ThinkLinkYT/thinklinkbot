const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const { ensureUser, updateUser } = require("../utils/database");
const jobs = require("../../data/jobs.json");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("jobapply")
        .setDescription("Apply for a job")
        .addStringOption(option => {
            option.setName("job")
                .setDescription("Choose a job to apply for")
                .setRequired(true);

            for (const jobName in jobs) {
                option.addChoices({
                    name: `${jobName} (${jobs[jobName].min}-${jobs[jobName].max} coins)`,
                    value: jobName
                });
            }

            return option;
        }),

    async execute(interaction) {
        const userId = interaction.user.id;
        const user = ensureUser(userId);
        const jobName = interaction.options.getString("job");

        if (user.job.applyCooldown === undefined) {
            user.job.applyCooldown = 0;
        }

        const now = Date.now();
        const cooldownTime = 30 * 60 * 1000;

        if (now < user.job.applyCooldown) {
            const remaining = user.job.applyCooldown - now;
            const minutes = Math.floor(remaining / (1000 * 60));
            const seconds = Math.floor((remaining % (1000 * 60)) / 1000);

            const embed = new EmbedBuilder()
                .setTitle("⏳ Job Application Cooldown")
                .setColor("Yellow")
                .setDescription(`You must wait **${minutes}m ${seconds}s** before applying again.`);

            return interaction.reply({ embeds: [embed] });
        }

        if (user.job.name && user.job.name !== "") {
            const embed = new EmbedBuilder()
                .setTitle("❌ Already Employed")
                .setColor("Red")
                .setDescription(
                    `You already have a job as a **${user.job.name}**.\nUse **/jobquit** before applying for a new one.`
                );

            return interaction.reply({ embeds: [embed] });
        }

        if (!jobs[jobName]) {
            const embed = new EmbedBuilder()
                .setTitle("❌ Invalid Job")
                .setColor("Red")
                .setDescription("That job does not exist.");

            return interaction.reply({ embeds: [embed] });
        }

        const job = jobs[jobName];

        // 15% fail chance
        if (Math.random() < 0.15) {
            user.job.applyCooldown = now + cooldownTime;
            updateUser(userId, user);

            const embed = new EmbedBuilder()
                .setTitle("💼 Job Application Failed")
                .setColor("Red")
                .setDescription(
                    `You applied for **${jobName}**, but you didn't get the job.\nTry again in **30 minutes**.`
                );

            return interaction.reply({ embeds: [embed] });
        }

        // SUCCESS — assign job
        user.job.name = jobName;
        user.job.level = 1;
        user.job.lastPayday = 0;
        user.job.lastActive = now;
        user.job.streak = 0;
        user.job.raise = 0;

        // ⭐ NEW: Set fixed payday amount
        user.job.pay = Math.floor(Math.random() * (job.max - job.min + 1)) + job.min;

        // Clear cooldown
        user.job.applyCooldown = 0;

        updateUser(userId, user);

        const embed = new EmbedBuilder()
            .setTitle("💼 Job Application Successful")
            .setColor("Green")
            .addFields(
                { name: "New Job", value: jobName, inline: true },
                { name: "Your Payday", value: `${user.job.pay} coins`, inline: true },
                { name: "Original Range", value: `${job.min} - ${job.max} coins`, inline: true }
            )
            .setFooter({ text: "Use /payday every 24 hours to collect your earnings." });

        return interaction.reply({ embeds: [embed] });
    }
};