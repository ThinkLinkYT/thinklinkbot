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
        .setName("kick")
        .setDescription("Kick a user (verification required unless you are Super Admin).")
        .addUserOption(opt =>
            opt.setName("user")
                .setDescription("User to kick")
                .setRequired(true)
        )
        .addStringOption(opt =>
            opt.setName("reason")
                .setDescription("Reason for the kick")
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
            return interaction.editReply({ content: "You cannot kick yourself." });
        }

        if (target.id === client.user.id) {
            return interaction.editReply({ content: "I cannot kick myself." });
        }

        // Instant kick for bypass role
        if (interaction.member.roles.cache.has(BYPASS_ROLE)) {
            const member = await interaction.guild.members.fetch(target.id).catch(() => null);
            if (!member) return interaction.editReply({ content: "User not found." });
            if (!member.kickable) {
                return interaction.editReply({ content: "I cannot kick that user. Check my role position and permissions." });
            }

            await member.kick(`Kicked by ${interaction.user.tag}: ${reason}`);
            return interaction.editReply({ content: `✅ **${target.tag} has been kicked instantly.**` });
        }

        const member = await interaction.guild.members.fetch(target.id).catch(() => null);
        if (!member) return interaction.editReply({ content: "User not found." });
        if (!member.kickable) {
            return interaction.editReply({ content: "I cannot kick that user. Check my role position and permissions." });
        }

        const rolePing = ALLOWED_ROLES.map(id => `<@&${id}>`).join(" ");

        const embed = new EmbedBuilder()
            .setTitle("👢 Kick Request Verification")
            .setDescription(
                `${interaction.user} is requesting to kick **${target.tag}**\n\n` +
                `**Reason:** ${reason}\n\n` +
                `A moderator must verify this action.`
            )
            .setColor("Orange")
            .setTimestamp();

        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId(`verify_kick_${target.id}_${interaction.user.id}`)
                .setLabel("Verify Kick")
                .setStyle(ButtonStyle.Danger)
        );

        const channel = interaction.guild.channels.cache.get(VERIFY_CHANNEL);
        if (!channel) {
            return interaction.editReply({ content: "Verification channel not found." });
        }

        await channel.send({
            content: `${rolePing}\n⚠️ **Kick Verification Required**`,
            embeds: [embed],
            components: [row]
        });

        interaction.editReply({ content: "Kick request sent for verification." });
    }
};
