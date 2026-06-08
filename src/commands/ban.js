const {
    SlashCommandBuilder,
    EmbedBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle
} = require("discord.js");

const ALLOWED_ROLES = [
    "1265101131353428049",
    "1437256836985389066",
    "1409244970665115759",
    "1265101270960570392",
    "1400923093035257856"
];

const BYPASS_ROLE = "1265101131353428049";
const VERIFY_CHANNEL = "1370183515492192366";

module.exports = {
    data: new SlashCommandBuilder()
        .setName("ban")
        .setDescription("Ban a user (verification required unless you are Super Admin).")
        .addUserOption(opt =>
            opt.setName("user")
                .setDescription("User to ban")
                .setRequired(true)
        )
        .addStringOption(opt =>
            opt.setName("reason")
                .setDescription("Reason for the ban")
                .setRequired(false)
        ),

    async execute(interaction, client) {
        await interaction.deferReply({ ephemeral: true });

        const target = interaction.options.getUser("user");
        const reason = interaction.options.getString("reason") || "No reason provided";

        if (!interaction.member.roles.cache.some(r => ALLOWED_ROLES.includes(r.id))) {
            return interaction.editReply({ content: "You do not have permission to use this command." });
        }

        if (target.id === interaction.user.id) {
            return interaction.editReply({ content: "You cannot ban yourself." });
        }

        if (target.id === client.user.id) {
            return interaction.editReply({ content: "I cannot ban myself." });
        }

        // Instant ban for bypass role
        if (interaction.member.roles.cache.has(BYPASS_ROLE)) {
            const member = await interaction.guild.members.fetch(target.id).catch(() => null);
            if (!member) return interaction.editReply({ content: "User not found." });
            if (!member.bannable) {
                return interaction.editReply({ content: "I cannot ban that user. Check my role position and permissions." });
            }

            await member.ban({ reason: `Banned by ${interaction.user.tag}: ${reason}` });
            return interaction.editReply({ content: `✅ **${target.tag} has been banned instantly.**` });
        }

        const member = await interaction.guild.members.fetch(target.id).catch(() => null);
        if (member && !member.bannable) {
            return interaction.editReply({ content: "I cannot ban that user. Check my role position and permissions." });
        }

        const rolePing = ALLOWED_ROLES.map(id => `<@&${id}>`).join(" ");

        const embed = new EmbedBuilder()
            .setTitle("🔨 Ban Request Verification")
            .setDescription(
                `${interaction.user} is requesting to ban **${target.tag}**\n\n` +
                `**Reason:** ${reason}\n\n` +
                `A moderator must verify this action.`
            )
            .setColor("Red")
            .setTimestamp();

        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId(`verify_ban_${target.id}_${interaction.user.id}`)
                .setLabel("Verify Ban")
                .setStyle(ButtonStyle.Danger)
        );

        const channel = interaction.guild.channels.cache.get(VERIFY_CHANNEL);
        if (!channel) {
            return interaction.editReply({ content: "Verification channel not found." });
        }

        await channel.send({
            content: `${rolePing}\n⚠️ **Ban Verification Required**`,
            embeds: [embed],
            components: [row]
        });

        interaction.editReply({ content: "Ban request sent for verification." });
    }
};
