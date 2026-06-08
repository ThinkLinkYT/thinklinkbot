module.exports = {
    id: "verify",

    async execute(interaction, client) {
        const [_, action, targetId, requesterId] = interaction.customId.split("_");

        const ALLOWED_ROLES = [
            "1265101131353428049",
            "1437256836985389066",
            "1409244970665115759",
            "1265101270960570392",
            "1400923093035257856"
        ];

        if (!interaction.member.roles.cache.some(r => ALLOWED_ROLES.includes(r.id))) {
            return interaction.reply({ content: "You do not have permission to verify moderation actions.", ephemeral: true });
        }

        if (interaction.user.id === requesterId) {
            return interaction.reply({ content: "You cannot verify your own moderation request.", ephemeral: true });
        }

        const guild = interaction.guild;
        const target = await guild.members.fetch(targetId).catch(() => null);
        if (!target) {
            return interaction.reply({ content: "User no longer exists.", ephemeral: true });
        }

        if (action === "ban") {
            if (!target.bannable) {
                return interaction.reply({ content: "I cannot ban that user. Check my role position and permissions.", ephemeral: true });
            }
            await target.ban({ reason: `Verified by ${interaction.user.tag}` });
            return interaction.update({
                content: `✅ **${target.user.tag} has been banned.** Verified by ${interaction.user}`,
                components: []
            });
        }

        if (action === "kick") {
            if (!target.kickable) {
                return interaction.reply({ content: "I cannot kick that user. Check my role position and permissions.", ephemeral: true });
            }
            await target.kick(`Verified by ${interaction.user.tag}`);
            return interaction.update({
                content: `✅ **${target.user.tag} has been kicked.** Verified by ${interaction.user}`,
                components: []
            });
        }

        return interaction.reply({ content: "Invalid verification action.", ephemeral: true });
    }
};
