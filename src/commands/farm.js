const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const { ensureUser, updateUser } = require("../utils/database");
const { getTierBonus, getTypeBonus } = require("../utils/houseBonus");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("farm")
        .setDescription("Harvest crops"),

    async execute(interaction) {
        const userId = interaction.user.id;
        const user = ensureUser(userId);

        const tierBonus = getTierBonus(user);
        const typeBonus = getTypeBonus(user);

        const baseCd = 30000;
        const cd = Math.floor(baseCd * (1 - (tierBonus.cooldown || 0)));

        const now = Date.now();

        if (now - user.gathering.cooldowns.farm < cd) {
            const remaining = Math.ceil((cd - (now - user.gathering.cooldowns.farm)) / 1000);

            const embed = new EmbedBuilder()
                .setTitle("⏳ Farming Cooldown")
                .setColor("Yellow")
                .setDescription(`You must wait **${remaining}s** before farming again.`);
            return interaction.reply({ embeds: [embed] });
        }

        const crops = [
            { name: "Wheat", weight: 40 },
            { name: "Carrot", weight: 30 },
            { name: "Potato", weight: 20 },
            { name: "Pumpkin", weight: 10 }
        ];

        function weightedPick(list) {
            const total = list.reduce((a, b) => a + b.weight, 0);
            let roll = Math.random() * total;
            for (const item of list) {
                if (roll < item.weight) return item.name;
                roll -= item.weight;
            }
        }

        const drops = [];
        const dropCount = Math.floor(Math.random() * 3) + 1;

        for (let i = 0; i < dropCount; i++) {
            const crop = weightedPick(crops);
            let qty = Math.floor(Math.random() * 3) + 1;

            if (user.job.name === "Farmer") qty += 1;
            if (typeBonus.gather === "crops" || typeBonus.gather === "all") {
                qty += typeBonus.amount || 0;
            }

            drops.push({ crop, qty });

            user.inventory[crop] = (user.inventory[crop] || 0) + qty;
            user.stats.farming = (user.stats.farming || 0) + qty;

            user.quests.progress.farm = (user.quests.progress.farm || 0) + qty;
        }

        if (Math.random() < 0.02) {
            user.inventory["Golden Seed"] = (user.inventory["Golden Seed"] || 0) + 1;
            drops.push({ crop: "Golden Seed 🌟 (RARE)", qty: 1 });
        }

        user.gathering.cooldowns.farm = now;
        updateUser(userId, user);

        const msg = drops.map(d => `🌾 **${d.qty}× ${d.crop}**`).join("\n");

        const embed = new EmbedBuilder()
            .setTitle("🌾 Harvest Results")
            .setColor("Green")
            .setDescription(msg)
            .setFooter({
                text: `Cooldown: ${cd / 1000}s${tierBonus.cooldown ? " (reduced by house bonus)" : ""}`
            });

        return interaction.reply({ embeds: [embed] });
    }
};
