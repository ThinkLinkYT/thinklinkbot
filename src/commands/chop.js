const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const { ensureUser, updateUser } = require("../utils/database");
const { getTierBonus, getTypeBonus } = require("../utils/houseBonus");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("chop")
        .setDescription("Chop wood"),

    async execute(interaction) {
        const userId = interaction.user.id;
        const user = ensureUser(userId);

        const tierBonus = getTierBonus(user);
        const typeBonus = getTypeBonus(user);

        const baseCd = 30000;
        const cd = Math.floor(baseCd * (1 - (tierBonus.cooldown || 0)));

        const now = Date.now();

        if (now - user.gathering.cooldowns.chop < cd) {
            const remaining = Math.ceil((cd - (now - user.gathering.cooldowns.chop)) / 1000);

            const embed = new EmbedBuilder()
                .setTitle("⏳ Chopping Cooldown")
                .setColor("Yellow")
                .setDescription(`You must wait **${remaining}s** before chopping again.`);
            return interaction.reply({ embeds: [embed] });
        }

        const woods = [
            { name: "Oak", weight: 50 },
            { name: "Birch", weight: 30 },
            { name: "Pine", weight: 15 },
            { name: "Maple", weight: 5 }
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
            const wood = weightedPick(woods);
            let qty = Math.floor(Math.random() * 2) + 1;

            if (user.job.name === "Lumberjack") qty += 1;
            if (typeBonus.gather === "wood" || typeBonus.gather === "all") {
                qty += typeBonus.amount || 0;
            }

            drops.push({ wood, qty });

            user.inventory[wood] = (user.inventory[wood] || 0) + qty;
            user.stats.woodChopped += qty;

            user.quests.progress.chop = (user.quests.progress.chop || 0) + qty;
        }

        if (Math.random() < 0.01) {
            user.inventory["Ancient Bark"] = (user.inventory["Ancient Bark"] || 0) + 1;
            drops.push({ wood: "Ancient Bark 🪵 (RARE)", qty: 1 });
        }

        user.gathering.cooldowns.chop = now;
        updateUser(userId, user);

        const msg = drops.map(d => `🪓 **${d.qty}× ${d.wood}**`).join("\n");

        const embed = new EmbedBuilder()
            .setTitle("🪓 Wood Chopping Results")
            .setColor("#A0522D")
            .setDescription(msg)
            .setFooter({
                text: `Cooldown: ${cd / 1000}s${tierBonus.cooldown ? " (reduced by house bonus)" : ""}`
            });

        return interaction.reply({ embeds: [embed] });
    }
};
