const { SlashCommandBuilder } = require("discord.js");
const { ensureUser, updateUser } = require("../utils/database");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("pet-rename")
        .setDescription("Rename one of your pets")
        .addStringOption(option =>
            option.setName("pet")
                .setDescription("Choose a pet to rename")
                .setRequired(true)
                .setAutocomplete(true)
        )
        .addStringOption(option =>
            option.setName("new_name")
                .setDescription("Enter the new name")
                .setRequired(true)
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
        const newName = interaction.options.getString("new_name");

        const index = user.pets.owned.indexOf(petName);
        if (index === -1)
            return interaction.reply("❌ You don't own that pet.");

        const baseName = petName.split(" (")[0];
        const renamed = `${baseName} (${newName})`;

        user.pets.owned[index] = renamed;

        if (user.pets.equipped === petName)
            user.pets.equipped = renamed;

        updateUser(userId, user);

        return interaction.reply(`🐾 Your **${baseName}** is now named **${newName}**!`);
    }
};