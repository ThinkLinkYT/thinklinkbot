const { SlashCommandBuilder } = require("discord.js");
const { ensureUser, updateUser } = require("../utils/database");
const crates = require("../../data/crates.json");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("buy")
        .setDescription("Buy a crate")
        .addStringOption(option => {
            option.setName("crate")
                .setDescription("Choose a crate rarity")
                .setRequired(true);

            for (const crateName in crates) {
                const crate = crates[crateName];
                option.addChoices({
                    name: `${crateName} (${crate.price} coins)`,
                    value: crateName
                });
            }

            return option;
        }),

    async execute(interaction) {
        const userId = interaction.user.id;
        const user = ensureUser(userId);
        const crateName = interaction.options.getString("crate");

        const crate = crates[crateName];
        if (!crate)
            return interaction.reply("❌ That crate does not exist.");

        if (user.wallet < crate.price)
            return interaction.reply(`❌ You need **${crate.price} coins** to buy a **${crateName}**.`);

        user.wallet -= crate.price;

        user.inventory[crateName] = (user.inventory[crateName] || 0) + 1;

        updateUser(userId, user);

        return interaction.reply(`📦 You bought a **${crateName}** for **${crate.price} coins**!`);
    }
};