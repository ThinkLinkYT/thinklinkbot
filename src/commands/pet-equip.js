const { SlashCommandBuilder } = require("discord.js");
const { ensureUser, updateUser } = require("../utils/database");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("pet-equip")
        .setDescription("Equip one of your pets")
        .addStringOption(option =>
            option.setName("pet")
                .setDescription("Choose a pet to equip")
                .setRequired(true)
                .setAutocomplete(true)
        ),

    async autocomplete(interaction) {
        const user = ensureUser(interaction.user.id);
        const pets = user.pets.owned || [];

        const focused = interaction.options.getFocused().toLowerCase();
        const filtered = pets.filter(p => p.toLowerCase().includes(focused));

        await interaction.respond(
            filtered.map(p => ({ name: p, value: p }))
        );
    },

    async execute(interaction) {
        const userId = interaction.user.id;
        const user = ensureUser(userId);

        const petName = interaction.options.getString("pet");

        if (!user.pets.owned.includes(petName))
            return interaction.reply("❌ You don't own that pet.");

        user.pets.equipped = petName;
        updateUser(userId, user);

        return interaction.reply(`🐾 You equipped **${petName}**!`);
    }
};