const {
    SlashCommandBuilder,
    EmbedBuilder
} = require("discord.js");

const { ensureUser, updateUser } = require("../utils/database");
const fishData = require("../../data/fish.json");
const rods = require("../../data/rods.json");
const pets = require("../../data/pets.json");
const { getTierBonus, getTypeBonus } = require("../utils/houseBonus");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("fish")
        .setDescription("Go fishing and catch something!"),

    async execute(interaction) {
        const userId = interaction.user.id;
        const user = ensureUser(userId);

        // ⭐ House bonuses
        const tierBonus = getTierBonus(user);
        const typeBonus = getTypeBonus(user);

        const now = Date.now();

        // ⭐ Apply house cooldown reduction
        const baseCd = 15000; // 15 seconds
        const cd = Math.floor(baseCd * (1 - (tierBonus.cooldown || 0)));

        if (now - user.cooldowns.fish < cd) {
            const remaining = Math.ceil((cd - (now - user.cooldowns.fish)) / 1000);

            const embed = new EmbedBuilder()
                .setTitle("⏳ Fishing Cooldown")
                .setColor("Yellow")
                .setDescription(`You must wait **${remaining}s** before fishing again.`);

            return interaction.reply({ embeds: [embed] });
        }

        const rodName = user.fishing.rod;
        const rod = rods[rodName] || rods["Basic Rod"];

        // Base rarity chances
        let rarityChances = {
            Common: 60,
            Uncommon: 25,
            Rare: 10,
            Legendary: 4,
            Mythic: 1
        };

        // Apply rod multiplier
        for (const r in rarityChances) {
            rarityChances[r] *= rod.multiplier;
        }

        // Apply rod rarity boost
        rarityChances.Uncommon += rod.rarityBoost;
        rarityChances.Rare += rod.rarityBoost;
        rarityChances.Legendary += rod.rarityBoost / 2;
        rarityChances.Mythic += rod.rarityBoost / 3;

        // Base fail chance
        let failChance = 15 - rod.failReduction;
        if (failChance < 0) failChance = 0;

        // ------------------------------
        // APPLY PET BONUSES
        // ------------------------------
        let petBonus = null;

        if (user.pets.equipped) {
            for (const rarity in pets) {
                const found = pets[rarity].find(p => p.name === user.pets.equipped);
                if (found) petBonus = found;
            }
        }

        if (petBonus) {
            switch (petBonus.bonusType) {
                case "luck":
                    rarityChances.Rare += petBonus.bonusValue;
                    rarityChances.Legendary += petBonus.bonusValue;
                    rarityChances.Mythic += petBonus.bonusValue / 2;
                    break;

                case "failReduction":
                    failChance -= petBonus.bonusValue;
                    if (failChance < 0) failChance = 0;
                    break;

                case "rarityBoost":
                    rarityChances.Uncommon += petBonus.bonusValue;
                    rarityChances.Rare += petBonus.bonusValue;
                    rarityChances.Legendary += petBonus.bonusValue / 2;
                    rarityChances.Mythic += petBonus.bonusValue / 3;
                    break;

                case "money":
                    // handled in sell-all
                    break;
            }
        }

        // Fail roll
        if (Math.random() * 100 < failChance) {
            user.cooldowns.fish = now;
            updateUser(userId, user);
            return interaction.reply("🎣 Your line came up empty...");
        }

        // Pick rarity
        function pickRarity() {
            const total = Object.values(rarityChances).reduce((a, b) => a + b, 0);
            let roll = Math.random() * total;

            for (const rarity in rarityChances) {
                if (roll < rarityChances[rarity]) return rarity;
                roll -= rarityChances[rarity];
            }
            return "Common";
        }

        const rarity = pickRarity();

        // Pick random fish from that rarity
        const fishList = fishData[rarity];
        const fish = fishList[Math.floor(Math.random() * fishList.length)];

        // ⭐ Apply house type bonus (Beach House, Mansion, Castle)
        let qty = 1;
        if (typeBonus.gather === "fish" || typeBonus.gather === "all") {
            qty += typeBonus.amount || 0;
        }

        // Add to inventory
        user.fishing.inventory[fish.name] =
            (user.fishing.inventory[fish.name] || 0) + qty;

        user.stats.fishCaught += qty;

        // ⭐ QUEST PROGRESS UPDATE (only change added)
        user.quests.progress.fish = (user.quests.progress.fish || 0) + qty;

        user.cooldowns.fish = now;

        updateUser(userId, user);

        const embed = new EmbedBuilder()
            .setTitle("🎣 You caught a fish!")
            .setDescription(`**${qty}× ${fish.name}** (${rarity}) — worth **${fish.value} coins each**`)
            .setColor("Blue")
            .setFooter({
                text: `Cooldown: ${cd / 1000}s${tierBonus.cooldown ? " (reduced by house bonus)" : ""}`
            });

        await interaction.reply({ embeds: [embed] });
    }
};
