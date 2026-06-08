const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const { ensureUser, updateUser } = require("../utils/database");
const { getTierBonus, getTypeBonus } = require("../utils/houseBonus");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("mine")
        .setDescription("Mine for ores"),

    async execute(interaction) {
        const userId = interaction.user.id;
        const user = ensureUser(userId);

        const tierBonus = getTierBonus(user);
        const typeBonus = getTypeBonus(user);

        const baseCd = 30000;
        const cd = Math.floor(baseCd * (1 - (tierBonus.cooldown || 0)));

        const now = Date.now();

        if (now - user.gathering.cooldowns.mine < cd) {
            const remaining = Math.ceil((cd - (now - user.gathering.cooldowns.mine)) / 1000);

            const embed = new EmbedBuilder()
                .setTitle("⏳ Mining Cooldown")
                .setColor("Yellow")
                .setDescription(`You must wait **${remaining}s** before mining again.`);
            return interaction.reply({ embeds: [embed] });
        }

        const ores = [
            { name: "Copper", weight: 50 },
            { name: "Iron", weight: 30 },
            { name: "Gold", weight: 15 },
            { name: "Diamond", weight: 5 }
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
            const ore = weightedPick(ores);
            let qty = Math.floor(Math.random() * 2) + 1;

            if (user.job.name === "Miner") qty += 1;
            if (typeBonus.gather === "ore" || typeBonus.gather === "all") {
                qty += typeBonus.amount || 0;
            }

            drops.push({ ore, qty });

            user.inventory[ore] = (user.inventory[ore] || 0) + qty;
            user.stats.oresMined += qty;

            user.quests.progress.mine = (user.quests.progress.mine || 0) + qty;
        }

        if (Math.random() < 0.01) {
            user.inventory["Ruby"] = (user.inventory["Ruby"] || 0) + 1;
            drops.push({ ore: "Ruby 💎 (RARE)", qty: 1 });
        }

        user.gathering.cooldowns.mine = now;
        updateUser(userId, user);

        const msg = drops.map(d => `⛏️ **${d.qty}× ${d.ore}**`).join("\n");

        const embed = new EmbedBuilder()
            .setTitle("⛏️ Mining Results")
            .setColor("Blue")
            .setDescription(msg)
            .setFooter({
                text: `Cooldown: ${cd / 1000}s${tierBonus.cooldown ? " (reduced by house bonus)" : ""}`
            });

        return interaction.reply({ embeds: [embed] });
    }
};
