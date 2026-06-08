const {
    EmbedBuilder
} = require("discord.js");

const { ensureUser, updateUser } = require("../utils/database");
const { loadGames, saveGames, drawCard, handValue } = require("../utils/blackjack");

module.exports = {
    id: "bj_",
    async execute(i) {
        const [prefix, action, userId] = i.customId.split("_");

        if (i.user.id !== userId)
            return i.reply({ content: "This is not your game.", ephemeral: true });

        const games = loadGames();
        const game = games[userId];
        const user = ensureUser(userId);

        if (!game || game.finished)
            return i.reply({ content: "No active blackjack game.", ephemeral: true });

        // -------------------------
        //        HIT BUTTON
        // -------------------------
        if (action === "hit") {
            game.player.push(drawCard());
            const playerVal = handValue(game.player);

            // Player busts
            if (playerVal > 21) {
                const loss = game.bet; // lose bet amount
                user.wallet -= loss;
                updateUser(userId, user);

                game.finished = true;
                saveGames(games);

                const embed = new EmbedBuilder()
                    .setTitle("🃏 Blackjack — You Busted!")
                    .addFields(
                        { name: "Your Hand", value: `${game.player.join(" ")} = ${playerVal}` },
                        { name: "Dealer Hand", value: `${game.dealer.join(" ")} = ${handValue(game.dealer)}` },
                        { name: "Balance Change", value: `🔴 **-${loss} coins**` }
                    )
                    .setColor("Red");

                return i.update({ embeds: [embed], components: [] });
            }

            // Continue game
            saveGames(games);

            const embed = new EmbedBuilder()
                .setTitle("🃏 Blackjack")
                .addFields(
                    { name: "Your Hand", value: `${game.player.join(" ")} = ${playerVal}` },
                    { name: "Dealer Shows", value: `${game.dealer[0]} ❓` }
                )
                .setColor("DarkGreen");

            return i.update({ embeds: [embed] });
        }

        // -------------------------
        //       STAND BUTTON
        // -------------------------
        if (action === "stand") {
            let dealerVal = handValue(game.dealer);

            // Dealer draws until 17+
            while (dealerVal < 17) {
                game.dealer.push(drawCard());
                dealerVal = handValue(game.dealer);
            }

            const playerVal = handValue(game.player);

            let result = "";
            let moneyChange = 0;

            // Check for perfect pair (Ace + Jack)
            const perfectPair =
                (game.player.includes("A♠") || game.player.includes("A♥") || game.player.includes("A♦") || game.player.includes("A♣")) &&
                (game.player.includes("J♠") || game.player.includes("J♥") || game.player.includes("J♦") || game.player.includes("J♣"));

            if (perfectPair) {
                result = "PERFECT PAIR! Triple Win!";
                moneyChange = game.bet * 3;
                user.wallet += moneyChange;
            }

            // Normal win
            else if (dealerVal > 21 || playerVal > dealerVal) {
                result = "You win!";
                moneyChange = game.bet * 2; // double payout
                user.wallet += moneyChange;
            }

            // Loss
            else if (playerVal < dealerVal) {
                result = "Dealer wins!";
                moneyChange = -game.bet; // lose bet
                user.wallet -= game.bet;
            }

            // Tie
            else {
                result = "It's a tie!";
                moneyChange = 0;
            }

            updateUser(userId, user);

            game.finished = true;
            saveGames(games);

            const embed = new EmbedBuilder()
                .setTitle(`🃏 Blackjack — ${result}`)
                .addFields(
                    { name: "Your Hand", value: `${game.player.join(" ")} = ${playerVal}` },
                    { name: "Dealer Hand", value: `${game.dealer.join(" ")} = ${dealerVal}` },
                    {
                        name: "Balance Change",
                        value:
                            moneyChange > 0
                                ? `🟢 **+${moneyChange} coins**`
                                : moneyChange < 0
                                ? `🔴 **${moneyChange} coins**`
                                : `⚪ **0 coins**`
                    }
                )
                .setColor(
                    moneyChange > 0 ? "Green" :
                    moneyChange < 0 ? "Red" :
                    "Grey"
                );

            return i.update({ embeds: [embed], components: [] });
        }
    }
};