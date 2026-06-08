const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const { ensureUser, updateUser } = require("../utils/database");
const { formatCoins } = require("../utils/economy");
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

        const embed = new EmbedBuilder()
            .setTitle("📦 Crate Purchased")
            .setColor("Green")
            .setDescription(`You bought a **${crateName}**.`)
            .addFields(
                { name: "Price", value: formatCoins(crate.price), inline: true },
                { name: "Wallet", value: formatCoins(user.wallet), inline: true },
                { name: "Owned", value: `${user.inventory[crateName]}`, inline: true }
            );

        return interaction.reply({ embeds: [embed] });
    }
};
