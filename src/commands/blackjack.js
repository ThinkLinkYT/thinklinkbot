const {
    SlashCommandBuilder,
    EmbedBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle
} = require("discord.js");

const { ensureUser, updateUser } = require("../utils/database");
const { loadGames, saveGames, drawCard, handValue } = require("../utils/blackjack");

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

        if (bet <= 0) return i.reply("Bet must be positive.");
        if (user.wallet < bet) return i.reply("You don't have enough money.");

        const games = loadGames();

        const player = [drawCard(), drawCard()];
        const dealer = [drawCard(), drawCard()];

        games[userId] = {
            bet,
            player,
            dealer,
            finished: false
        };

        saveGames(games);

        const embed = new EmbedBuilder()
            .setTitle("🃏 Blackjack")
            .addFields(
                { name: "Your Hand", value: `${player.join(" ")} = ${handValue(player)}` },
                { name: "Dealer Shows", value: `${dealer[0]} ❓` }
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