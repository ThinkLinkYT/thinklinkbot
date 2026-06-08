const {
    EmbedBuilder
} = require("discord.js");

const { ensureUser, updateUser } = require("../utils/database");
const { loadGames, saveGames, drawCard, handValue } = require("../utils/blackjack");
const { formatCoins } = require("../utils/economy");

function completeGame(games, userId) {
    delete games[userId];
    saveGames(games);
}

function applyBlackjackPayout(user, game, payout) {
    const bet = Number(game.bet) || 0;
    if (game.stakeReserved) {
        user.wallet += payout;
        return payout - bet;
    }

    const legacyChange = payout - bet;
    user.wallet += legacyChange;
    return legacyChange;
}

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
                const moneyChange = applyBlackjackPayout(user, game, 0);
                updateUser(userId, user);

                game.finished = true;
                completeGame(games, userId);

                const embed = new EmbedBuilder()
                    .setTitle("🃏 Blackjack — You Busted!")
                    .addFields(
                        { name: "Your Hand", value: `${game.player.join(" ")} = ${playerVal}` },
                        { name: "Dealer Hand", value: `${game.dealer.join(" ")} = ${handValue(game.dealer)}` },
                        { name: "Net Change", value: `🔴 **${formatCoins(moneyChange)}**` },
                        { name: "Wallet", value: formatCoins(user.wallet) }
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
            let payout = 0;

            // Check for perfect pair (Ace + Jack)
            const perfectPair =
                (game.player.includes("A♠") || game.player.includes("A♥") || game.player.includes("A♦") || game.player.includes("A♣")) &&
                (game.player.includes("J♠") || game.player.includes("J♥") || game.player.includes("J♦") || game.player.includes("J♣"));

            if (perfectPair) {
                result = "PERFECT PAIR! Triple Win!";
                payout = game.bet * 3;
            }

            // Normal win
            else if (dealerVal > 21 || playerVal > dealerVal) {
                result = "You win!";
                payout = game.bet * 2;
            }

            // Loss
            else if (playerVal < dealerVal) {
                result = "Dealer wins!";
                payout = 0;
            }

            // Tie
            else {
                result = "It's a tie!";
                payout = game.bet;
            }

            moneyChange = applyBlackjackPayout(user, game, payout);

            updateUser(userId, user);

            game.finished = true;
            completeGame(games, userId);

            const embed = new EmbedBuilder()
                .setTitle(`🃏 Blackjack — ${result}`)
                .addFields(
                    { name: "Your Hand", value: `${game.player.join(" ")} = ${playerVal}` },
                    { name: "Dealer Hand", value: `${game.dealer.join(" ")} = ${dealerVal}` },
                    {
                        name: "Payout",
                        value: formatCoins(payout)
                    },
                    {
                        name: "Net Change",
                        value:
                            moneyChange > 0
                                ? `🟢 **+${formatCoins(moneyChange)}**`
                                : moneyChange < 0
                                ? `🔴 **-${formatCoins(Math.abs(moneyChange))}**`
                                : `⚪ **${formatCoins(0)}**`
                    },
                    { name: "Wallet", value: formatCoins(user.wallet) }
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
