const {
    SlashCommandBuilder,
    EmbedBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle
} = require("discord.js");

const { ensureUser, updateUser } = require("../utils/database");
const { loadGames, saveGames, drawCard, handValue } = require("../utils/blackjack");
const { isValidEconomyAmount, formatCoins } = require("../utils/economy");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("blackjack")
        .setDescription("Play blackjack")
        .addIntegerOption(o =>
            o.setName("bet")
                .setDescription("Amount to bet")
                .setRequired(true)
        ),

    async execute(i) {
        const bet = i.options.getInteger("bet");
        const userId = i.user.id;
        const user = ensureUser(userId);

        if (!isValidEconomyAmount(bet)) {
            return i.reply("Bet must be a positive whole number up to 1,000,000,000 coins.");
        }
        if (user.wallet < bet) return i.reply("You don't have enough money.");

        const games = loadGames();
        if (games[userId] && !games[userId].finished) {
            return i.reply("You already have an active blackjack game. Finish it before starting another one.");
        }

        const player = [drawCard(), drawCard()];
        const dealer = [drawCard(), drawCard()];

        user.wallet -= bet;
        updateUser(userId, user);

        games[userId] = {
            bet,
            player,
            dealer,
            finished: false,
            stakeReserved: true
        };

        saveGames(games);

        const embed = new EmbedBuilder()
            .setTitle("🃏 Blackjack")
            .addFields(
                { name: "Your Hand", value: `${player.join(" ")} = ${handValue(player)}` },
                { name: "Dealer Shows", value: `${dealer[0]} ❓` },
                { name: "Bet Reserved", value: formatCoins(bet), inline: true },
                { name: "Wallet", value: formatCoins(user.wallet), inline: true }
            )
            .setColor("DarkGreen");

        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId(`bj_hit_${userId}`)
                .setLabel("Hit")
                .setStyle(ButtonStyle.Primary),
            new ButtonBuilder()
                .setCustomId(`bj_stand_${userId}`)
                .setLabel("Stand")
                .setStyle(ButtonStyle.Secondary)
        );

        await i.reply({ embeds: [embed], components: [row] });
    }
};
