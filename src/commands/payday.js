const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const { ensureUser, updateUser } = require("../utils/database");
const jobs = require("../../data/jobs.json");
const { getTierBonus } = require("../utils/houseBonus");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("payday")
        .setDescription("Claim your job paycheck (every 24 hours)"),

    async execute(interaction) {
        const userId = interaction.user.id;
        const user = ensureUser(userId);

        if (!user.job.name) {
            return interaction.reply({
                embeds: [
                    new EmbedBuilder()
                        .setTitle("❌ No Job Found")
                        .setColor("Red")
                        .setDescription("You don't have a job yet. Use **/jobapply** first.")
                ],
                ephemeral: true
            });
        }

        const job = jobs[user.job.name];
        if (!job) {
            return interaction.reply({
                embeds: [
                    new EmbedBuilder()
                        .setTitle("❌ Job Missing")
                        .setColor("Red")
                        .setDescription("Your job no longer exists in the job list.")
                ],
                ephemeral: true
            });
        }

        // Ensure fields exist
        if (user.job.streak === undefined) user.job.streak = 0;
        if (user.job.raise === undefined) user.job.raise = 0;
        if (user.job.pay === undefined) {
            user.job.pay = Math.floor(Math.random() * (job.max - job.min + 1)) + job.min;
        }

        const now = Date.now();
        const oneDay = 24 * 60 * 60 * 1000;

        // ⭐ Get house bonuses
        const tierBonus = getTierBonus(user);
        const houseDaily = tierBonus.daily || 0;
        const cooldownReduction = tierBonus.cooldown || 0;

        // ⭐ Apply cooldown reduction
        const finalCooldown = oneDay - (oneDay * cooldownReduction);

        // Cooldown check
        if (now - user.job.lastPayday < finalCooldown) {
            const remaining = finalCooldown - (now - user.job.lastPayday);
            const hours = Math.floor(remaining / (1000 * 60 * 60));
            const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));

            return interaction.reply({
                embeds: [
                    new EmbedBuilder()
                        .setTitle("⏳ Payday Not Ready")
                        .setColor("Yellow")
                        .setDescription(`You can claim your next paycheck in **${hours}h ${minutes}m**.`)
                        .addFields(
                            { name: "House Cooldown Reduction", value: `${cooldownReduction * 100}%`, inline: true },
                            { name: "Final Cooldown", value: `${(finalCooldown / (1000 * 60 * 60)).toFixed(2)} hours`, inline: true }
                        )
                ],
                ephemeral: true
            });
        }

        // ⭐ Grace period streak logic (36 hours)
        const gracePeriod = oneDay + (12 * 60 * 60 * 1000);

        if (now - user.job.lastPayday <= gracePeriod) {
            user.job.streak += 1;
        } else {
            user.job.streak = 1;
        }

        // Base pay + raise
        const basePay = user.job.pay + user.job.raise;

        // Apply payday
        user.wallet += basePay + houseDaily;
        user.job.lastPayday = now;
        user.job.lastActive = now;

        // Raise every 10 days
        let bonusMessage = "";
        if (user.job.streak >= 10) {
            const raiseAmount = Math.floor(Math.random() * 11) + 20; // 20–30
            user.job.raise += raiseAmount;
            user.job.streak = 0;

            bonusMessage = `🎉 **Streak Bonus!** You earned a permanent raise of **+${raiseAmount} coins** per payday!`;
        }

        updateUser(userId, user);

        // ⭐ Final panel embed
        const embed = new EmbedBuilder()
            .setTitle("💰 Payday Collected!")
            .setColor("Green")
            .addFields(
                { name: "Job", value: user.job.name, inline: true },
                { name: "Base Pay", value: `${basePay} coins`, inline: true },
                { name: "House Bonus", value: `+${houseDaily} coins`, inline: true },
                { name: "Streak", value: `${user.job.streak} days`, inline: true },
                { name: "Total Raise", value: `+${user.job.raise} coins`, inline: true },
                { name: "New Balance", value: `${user.wallet} coins`, inline: false },
                { name: "Cooldown Reduction", value: `${cooldownReduction * 100}%`, inline: true },
                { name: "Next Payday Cooldown", value: `${(finalCooldown / (1000 * 60 * 60)).toFixed(2)} hours`, inline: true }
            );

        if (bonusMessage) {
            embed.addFields({ name: "Bonus", value: bonusMessage });
        }

        return interaction.reply({ embeds: [embed] });
    }
};
