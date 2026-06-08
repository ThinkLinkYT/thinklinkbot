const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const { ensureUser } = require("../utils/database");
const houses = require("../../data/houses.json");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("house")
        .setDescription("View your house"),

    async execute(interaction) {
        const user = ensureUser(interaction.user.id);

        if (!user.house) {
            const embed = new EmbedBuilder()
                .setTitle("🏠 No House Owned")
                .setColor("Red")
                .setDescription("You do not own a house.\nUse **/house-buy** to purchase one.");
            return interaction.reply({ embeds: [embed] });
        }

        const houseName = user.house;
        const houseData = houses[houseName];
        const price = houseData?.price ?? "Unknown";
        const tierBonus = houseData?.tierBonus || { daily: 0, cooldown: 0 };
        const typeBonus = houseData?.typeBonus || { gather: "none", amount: 0 };

        let typeBonusText = "None";
        if (typeBonus.gather === "all") {
            typeBonusText = `+${typeBonus.amount} to all gathering`;
        } else if (typeBonus.gather !== "none") {
            typeBonusText = `+${typeBonus.amount} ${typeBonus.gather}`;
        }

        const embed = new EmbedBuilder()
            .setTitle("🏡 Your Home")
            .setColor("Blue")
            .addFields(
                { name: "House", value: houseName, inline: true },
                { name: "Value", value: `${price} coins`, inline: true },
                { name: "Daily Bonus", value: `+${tierBonus.daily} coins`, inline: true },
                { name: "Cooldown Reduction", value: `${Math.round(tierBonus.cooldown * 100)}%`, inline: true },
                { name: "Gathering Bonus", value: typeBonusText, inline: false }
            )
            .setFooter({ text: "Upgrade or buy a new home anytime with /house-buy." });

        return interaction.reply({ embeds: [embed] });
    }
};