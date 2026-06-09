const {
  ChannelType,
  EmbedBuilder,
  PermissionFlagsBits
} = require("discord.js");
const { MODERATOR_ROLE_ID } = require("./staff");

const TICKET_TOPIC_PREFIX = "thinklink-ticket";
const TICKET_CATEGORY_ID = process.env.TICKET_CATEGORY_ID || "1513949501117960243";

function sanitizeChannelPart(value, fallback = "ticket", maxLength = 50) {
  const safeName = String(value || fallback)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, maxLength);

  return safeName || fallback;
}

function buildTicketChannelName(type, username) {
  const safeName = sanitizeChannelPart(username, "user", 45);
  const safeType = sanitizeChannelPart(`${type}-ticket`, "ticket", 40);

  return `${safeName}-${safeType}`.slice(0, 100);
}

function formatTicketType(type) {
  return String(type || "ticket")
    .replace(/[-_]+/g, " ")
    .replace(/\b\w/g, char => char.toUpperCase());
}

function buildTicketTopic(userId, type) {
  return `${TICKET_TOPIC_PREFIX} | opener:${userId} | type:${type}`;
}

function getTicketMetadata(channel) {
  const topic = channel?.topic;
  if (typeof topic !== "string" || !topic.startsWith(TICKET_TOPIC_PREFIX)) {
    return null;
  }

  return {
    openerId: topic.match(/opener:(\d+)/)?.[1] || null,
    type: topic.match(/type:([^|\s]+)/)?.[1] || "ticket"
  };
}

function isTicketChannel(channel) {
  if (!channel) return false;
  if (typeof channel.isThread === "function" && channel.isThread()) {
    return /ticket/i.test(channel.name || "");
  }

  return channel.type === ChannelType.GuildText && Boolean(getTicketMetadata(channel));
}

async function getTicketOpenerMention(channel) {
  const metadata = getTicketMetadata(channel);
  if (metadata?.openerId) return `<@${metadata.openerId}>`;

  if (typeof channel?.isThread === "function" && channel.isThread()) {
    try {
      const members = await channel.members.fetch();
      const opener = members.find(member => member.user && !member.user.bot);
      if (opener) return `<@${opener.user.id}>`;
    } catch {}
  }

  return "Applicant";
}

async function createTicket(interaction, type, title, description) {
  if (!interaction.guild) {
    return interaction.reply({
      content: "Tickets can only be created inside the server.",
      ephemeral: true
    });
  }

  const ticketCategory = await interaction.guild.channels
    .fetch(TICKET_CATEGORY_ID)
    .catch(() => null);

  if (!ticketCategory || ticketCategory.type !== ChannelType.GuildCategory) {
    return interaction.reply({
      content: "I could not find the ticket category. Please check the ticket category ID.",
      ephemeral: true
    });
  }

  const staffRole = await interaction.guild.roles
    .fetch(MODERATOR_ROLE_ID)
    .catch(() => null);

  if (!staffRole) {
    return interaction.reply({
      content: "I could not find the moderator role for ticket access.",
      ephemeral: true
    });
  }

  const botId = interaction.client.user.id;
  const openerId = interaction.user.id;
  const ownerId = process.env.OWNER_ID;
  const ownerMember = ownerId && ownerId !== openerId && ownerId !== botId
    ? await interaction.guild.members.fetch(ownerId).catch(() => null)
    : null;
  const permissionOverwrites = [
    {
      id: interaction.guild.roles.everyone.id,
      deny: [PermissionFlagsBits.ViewChannel]
    },
    {
      id: MODERATOR_ROLE_ID,
      allow: [
        PermissionFlagsBits.ViewChannel,
        PermissionFlagsBits.SendMessages,
        PermissionFlagsBits.ReadMessageHistory,
        PermissionFlagsBits.AttachFiles,
        PermissionFlagsBits.EmbedLinks,
        PermissionFlagsBits.ManageMessages
      ]
    },
    {
      id: openerId,
      allow: [
        PermissionFlagsBits.ViewChannel,
        PermissionFlagsBits.SendMessages,
        PermissionFlagsBits.ReadMessageHistory,
        PermissionFlagsBits.AttachFiles,
        PermissionFlagsBits.EmbedLinks
      ]
    },
    {
      id: botId,
      allow: [
        PermissionFlagsBits.ViewChannel,
        PermissionFlagsBits.SendMessages,
        PermissionFlagsBits.ReadMessageHistory,
        PermissionFlagsBits.AttachFiles,
        PermissionFlagsBits.EmbedLinks,
        PermissionFlagsBits.ManageChannels,
        PermissionFlagsBits.ManageMessages
      ]
    }
  ];

  if (ownerMember) {
    permissionOverwrites.push({
      id: ownerId,
      allow: [
        PermissionFlagsBits.ViewChannel,
        PermissionFlagsBits.SendMessages,
        PermissionFlagsBits.ReadMessageHistory,
        PermissionFlagsBits.AttachFiles,
        PermissionFlagsBits.EmbedLinks,
        PermissionFlagsBits.ManageMessages
      ]
    });
  }

  let channel;
  try {
    channel = await interaction.guild.channels.create({
      name: buildTicketChannelName(type, interaction.user.username),
      type: ChannelType.GuildText,
      parent: TICKET_CATEGORY_ID,
      topic: buildTicketTopic(openerId, type),
      permissionOverwrites
    });
  } catch (err) {
    console.error("Failed to create ticket channel:", err);
    return interaction.reply({
      content: "I could not create the ticket channel. Please check my Manage Channels permission and role position.",
      ephemeral: true
    });
  }

  const embed = new EmbedBuilder()
    .setTitle(title)
    .setDescription(description)
    .setColor(0x5865f2)
    .addFields(
      { name: "Opened By", value: `<@${openerId}>`, inline: true },
      { name: "Ticket Type", value: formatTicketType(type), inline: true }
    )
    .setTimestamp();

  await channel.send({
    content: `<@&${MODERATOR_ROLE_ID}> New ${formatTicketType(type)} ticket opened by <@${openerId}>.`,
    embeds: [embed],
    allowedMentions: {
      roles: [MODERATOR_ROLE_ID],
      users: [openerId]
    }
  });

  await interaction.reply({
    content: `Your ${formatTicketType(type)} ticket has been created: ${channel.toString()}`,
    ephemeral: true
  });
}

module.exports = {
  MODERATOR_ROLE_ID,
  createTicket,
  getTicketMetadata,
  getTicketOpenerMention,
  isTicketChannel
};
