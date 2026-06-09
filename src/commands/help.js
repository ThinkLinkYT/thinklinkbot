const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("help")
        .setDescription("View all bot commands"),

    async execute(interaction) {

        const embed = new EmbedBuilder()
            .setTitle("📘 ThinkLink Help Menu")
            .setColor("Blue")
            .setDescription("A full list of commands you can use throughout the economy, games, pets, jobs, and more.")
            .addFields(
                {
                    name: "💰 Economy Commands",
                    value:
                    "**/bal** — View your wallet & bank\n" +
                    "**/give** — Give money to another user\n" +
                    "**/deposit** — Deposit money into your bank\n" +
                    "**/withdraw** — Withdraw money from your bank\n" +
                    "**/sell <item>** — Sell selected items\n" +
                    "**/leaderboard <type>** — View the leaderboard (money, wood, crops, etc.)",
                    inline: false
                },
                {
                    name: "🪓 Gathering Commands",
                    value:
                    "**/chop** — Chop wood\n" +
                    "**/mine** — Mine ores\n" +
                    "**/farm** — Farm crops\n" +
                    "**/fish** — Go fishing\n" +
                    "**/fish-inv** — View your fish\n" +
                    "**/fish-rod** — View your fishing rod\n" +
                    "**/fish-upgrade** — Upgrade your fishing rod",
                    inline: false
                },
                {
                    name: "🎁 Crates",
                    value:
                    "**/buy** — Buy a crate\n" +
                    "**/crate-inv** — View your crates\n" +
                    "**/crate-open** — Open a crate",
                    inline: false
                },
                {
                    name: "🎮 Games",
                    value:
                    "**/blackjack** — Play blackjack\n" +
                    "**/slots** — Spin the slots\n" +
                    "**/coinflip** — Flip a coin\n" +
                    "**/rps** — Rock, paper, scissors",
                    inline: false
                },
                {
                    name: "🏡 Housing",
                    value:
                    "**/house** — View your house & bonuses\n" +
                    "**/house-buy** — Buy a house\n" +
                    "**/house-sell** — Sell your house",
                    inline: false
                },
                {
                    name: "💼 Jobs",
                    value:
                    "**/jobapply** — Apply for a job (30m cooldown if failed)\n" +
                    "**/job-info** — View your current job\n" +
                    "**/job-list** — View all available jobs\n" +
                    "**/job-quit** — Quit your job (30m cooldown before reapplying)\n" +
                    "**/payday** — Claim your daily paycheck (raises every 10‑day streak)",
                    inline: false
                },
                {
                    name: "🐾 Pets",
                    value:
                    "**/pet-shop** — View available pets\n" +
                    "**/pet-buy** — Buy a pet\n" +
                    "**/pet-rename** — Rename your pet\n" +
                    "**/pet-sell** — Sell a pet\n" +
                    "**/pet-inventory** — View all your pets\n" +
                    "**/pet-equip** — Equip a pet (grants bonuses)\n" +
                    "**/pet-info** — View info about a specific pet",
                    inline: false
                },
                {
                    name: "📜 Miscellaneous",
                    value:
                    "**/rules** — View the server rules\n" +
                    "**/quests** — View weekly quests\n" +
                    "**/quest-progress** — View your quest progress\n" +
                    "**/magic8ball** — Ask a yes/no question\n" +
                    "**/pingtoggle** — Toggle whether others can ping you",
                    inline: false
                }
            )
            .setFooter({ text: "Use /help anytime to view all commands." });

        return interaction.reply({ embeds: [embed] });
    }
};
