const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const { ensureUser, updateUser } = require("../utils/database");
const { isValidEconomyAmount, formatCoins } = require("../utils/economy");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("rps")
        .setDescription("Play Rock Paper Scissors")
        .addStringOption(o =>
            o.setName("choice")
                .setDescription("Your move")
                .setRequired(true)
                .addChoices(
                    { name: "Rock", value: "rock" },
                    { name: "Paper", value: "paper" },
                    { name: "Scissors", value: "scissors" }
                )
        )
        .addIntegerOption(o =>
            o.setName("bet")
                .setDescription("Amount to bet")
                .setRequired(true)
        ),

    async execute(i) {
        const choice = i.options.getString("choice");
        const bet = i.options.getInteger("bet");
        const userId = i.user.id;
        const user = ensureUser(userId);

        if (!isValidEconomyAmount(bet))
            return i.reply("Bet must be a positive whole number up to 1,000,000,000 coins.");

        if (user.wallet < bet)
            return i.reply("You don't have enough money.");

        const moves = ["rock", "paper", "scissors"];
        const bot = moves[Math.floor(Math.random() * moves.length)];

        let result = "";
        let amountWon = 0;
        let amountLost = 0;

        // Determine win/lose/tie
        if (choice === bot) {
            result = "tie";
        } else if (
            (choice === "rock" && bot === "scissors") ||
            (choice === "paper" && bot === "rock") ||
            (choice === "scissors" && bot === "paper")
        ) {
            result = "win";
        } else {
            result = "lose";
        }

        // Apply wallet changes
        if (result === "win") {
            amountWon = bet;
            user.wallet += amountWon;
        } else if (result === "lose") {
            amountLost = bet;
            user.wallet -= amountLost;
        }

        updateUser(userId, user);

        // Build embed panel
        const embed = new EmbedBuilder()
            .setTitle("🪨📄✂️ Rock Paper Scissors")
            .setColor(result === "win" ? "Green" : result === "lose" ? "Red" : "Yellow")
            .addFields(
                { name: "Your Move", value: choice, inline: true },
                { name: "Bot's Move", value: bot, inline: true },
                result === "win"
                    ? { name: "You Won", value: `+${formatCoins(amountWon)}`, inline: false }
                    : result === "lose"
                        ? { name: "You Lost", value: `-${formatCoins(amountLost)}`, inline: false }
                        : { name: "Tie", value: "No credits won or lost", inline: false },
                { name: "New Balance", value: formatCoins(user.wallet), inline: false }
            );

        return i.reply({ embeds: [embed] });
    }
};
