const { EmbedBuilder } = require("discord.js");
const { sendAuditLog } = require("../utils/audit");

module.exports = {
  name: "guildMemberUpdate",
  execute(oldMember, newMember) {
    const guild = newMember.guild;
    const user = newMember.user;
    const avatar = user.displayAvatarURL({ size: 128 });

    // Nickname
    const oldNick = oldMember.nickname || oldMember.user.username;
    const newNick = newMember.nickname || newMember.user.username;
    if (oldNick !== newNick) {
      const embed = new EmbedBuilder()
        .setAuthor({ name: user.tag, iconURL: avatar })
        .setTitle("📝 Nickname Changed")
        .addFields(
          { name: "User", value: `<@${user.id}>`, inline: true },
          { name: "Before", value: oldNick, inline: true },
          { name: "After", value: newNick, inline: true }
        )
        .setColor(0x3498db)
        .setTimestamp();
      sendAuditLog(guild, embed);
    }

    // Roles
    const oldRoles = new Set(oldMember.roles.cache.keys());
    const newRoles = new Set(newMember.roles.cache.keys());
    const added = [...newRoles].filter(r => !oldRoles.has(r));
    const removed = [...oldRoles].filter(r => !newRoles.has(r));

    if (added.length || removed.length) {
      const addedText = added.map(r => `<@&${r}>`).join(", ") || "None";
      const removedText = removed.map(r => `<@&${r}>`).join(", ") || "None";
      const embed = new EmbedBuilder()
        .setAuthor({ name: user.tag, iconURL: avatar })
        .setTitle("🎭 Roles Updated")
        .addFields(
          { name: "User", value: `<@${user.id}>`, inline: false },
          { name: "Added", value: addedText, inline: true },
          { name: "Removed", value: removedText, inline: true }
        )
        .setColor(0x9b59b6)
        .setTimestamp();
      sendAuditLog(guild, embed);
    }

    // Timeout
    const oldTimeout = oldMember.communicationDisabledUntilTimestamp;
    const newTimeout = newMember.communicationDisabledUntilTimestamp;

    if (oldTimeout !== newTimeout) {
      if (newTimeout && (!oldTimeout || newTimeout > Date.now())) {
        const end = `<t:${Math.floor(newTimeout / 1000)}:F>`;
        const embed = new EmbedBuilder()
          .setAuthor({ name: user.tag, iconURL: avatar })
          .setTitle("⏱️ Timeout Applied")
          .setDescription(`User: <@${user.id}>\nEnds: ${end}`)
          .setColor(0xe67e22)
          .setTimestamp();
        sendAuditLog(guild, embed);
      } else if (!newTimeout && oldTimeout) {
        const embed = new EmbedBuilder()
          .setAuthor({ name: user.tag, iconURL: avatar })
          .setTitle("✅ Timeout Removed")
          .setDescription(`User: <@${user.id}>`)
          .setColor(0x2ecc71)
          .setTimestamp();
        sendAuditLog(guild, embed);
      }
    }

    // ---------------------------------------------------------
    // 🚀 BOOST DETECTION — THANK THE USER FOR BOOSTING
    // ---------------------------------------------------------

    const oldBoost = oldMember.premiumSince;
    const newBoost = newMember.premiumSince;

    // User just started boosting
    if (!oldBoost && newBoost) {
      const boostChannelId = "YOUR_CHANNEL_ID"; // <--- replace this
      const boostChannel = guild.channels.cache.get(boostChannelId);

      if (boostChannel) {
        const embed = new EmbedBuilder()
          .setAuthor({ name: user.tag, iconURL: avatar })
          .setTitle("🚀 New Server Boost!")
          .setDescription(`Thank you <@${user.id}> for boosting the server! 💜`)
          .setColor(0xf47fff)
          .setThumbnail(avatar)
          .setTimestamp();

        boostChannel.send({ embeds: [embed] });
      }
    }

    // OPTIONAL: Detect if someone stops boosting
    // if (oldBoost && !newBoost) {
    //   // You can add a message here if you want
    // }
  }
};