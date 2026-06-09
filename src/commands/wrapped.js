const {
  SlashCommandBuilder,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle
} = require("discord.js");
const crypto = require("crypto");
const https = require("https");
const zlib = require("zlib");
const axios = require("axios");

const {
  getUserStats,
  formatVcTime,
  getTopEntries,
  buildRangeStats,
  saveWrappedStats
} = require("../utils/wrapped");
const { ensureUser } = require("../utils/database");
const { formatCoins } = require("../utils/economy");

const DEFAULT_WRAPPED_PAGE_URL = "https://thinklinkyt.github.io/ThinkLink-Website/wrapped.html";

function buildWrappedEmbed(stats, member, pageIndex) {
  const year = stats.year || new Date().getFullYear();
  const username = member?.displayName || member?.user?.username || "User";

  const joinedDate = stats.joined ? new Date(stats.joined) : null;
  const joinedTimestamp = joinedDate ? Math.floor(joinedDate.getTime() / 1000) : null;
  const now = new Date();
  const isAnniversary =
    joinedDate &&
    joinedDate.getDate() === now.getDate() &&
    joinedDate.getMonth() === now.getMonth();

  const base = new EmbedBuilder()
    .setAuthor({
      name: `${username}'s ${year} Wrapped`,
      iconURL: member?.displayAvatarURL?.() || undefined
    })
    .setColor([0x9b59b6, 0xe91e63, 0x5865f2, 0xf1c40f][pageIndex] || 0x5865f2)
    .setFooter({ text: `Page ${pageIndex + 1} of 4` });

  if (pageIndex === 0) {
    base.setTitle("🎧 Your Year at a Glance");
    base.setDescription(
      "Here’s your personal **ThinkLink's Land Wrapped** for this year.\n" +
        (isAnniversary ? "🎉 **Happy server anniversary!**\n\n" : "\n")
    );
    base.addFields(
      { name: "💬 Messages Sent", value: `${stats.messages || 0}`, inline: true },
      { name: "🔢 Counting Points", value: `${stats.countingPoints || 0}`, inline: true },
      { name: "🎫 Tickets Opened", value: `${stats.tickets || 0}`, inline: true },
      { name: "🎉 Giveaways Entered", value: `${stats.giveaways || 0}`, inline: true },
      { name: "🏆 Giveaways Won", value: `${stats.giveawaysWon || 0}`, inline: true },
      { name: "🎱 Magic 8-Ball Questions", value: `${stats.magic8 || 0}`, inline: true },
      { name: "🎙️ Time in Voice", value: formatVcTime(stats.vcTime || 0), inline: true },
      {
        name: "📅 Joined Server",
        value: joinedTimestamp ? `<t:${joinedTimestamp}:D>` : "Unknown",
        inline: true
      }
    );
    return base;
  }

  if (pageIndex === 1) {
    base.setTitle("📊 Activity Breakdown");
    base.setDescription("A closer look at how you show up around the server this year.");
    base.addFields(
      { name: "🤝 Collabs Accepted", value: `${stats.collabAccepted || 0}`, inline: true },
      { name: "🚫 Collabs Denied", value: `${stats.collabDenied || 0}`, inline: true },
      { name: "🛡️ Mod Apps Accepted", value: `${stats.modAccepted || 0}`, inline: true },
      { name: "📵 Mod Apps Denied", value: `${stats.modDenied || 0}`, inline: true },
      { name: "💬 Total Messages", value: `${stats.messages || 0}`, inline: true },
      { name: "🔢 Total Counting Points", value: `${stats.countingPoints || 0}`, inline: true }
    );
    return base;
  }

  if (pageIndex === 2) {
    base.setTitle("🏆 Your Top 3 Stats");

    const topChannels =
      getTopEntries(stats.topChannel, 3)
        .map(([id, count], idx) => `**${idx + 1}.** <#${id}> — ${count} messages`)
        .join("\n") || "No channel data yet.";

    const topEmojis =
      getTopEntries(stats.topEmoji, 3)
        .map(([emojiStr, count], idx) => `**${idx + 1}.** ${emojiStr} — ${count} uses`)
        .join("\n") || "No emoji data yet.";

    const topMentions =
      getTopEntries(stats.topMentions, 3)
        .map(([userId, count], idx) => `**${idx + 1}.** <@${userId}> — ${count} mentions`)
        .join("\n") || "No mention data yet.";

    base.addFields(
      { name: "📺 Top Channels", value: topChannels },
      { name: "😄 Top Emojis", value: topEmojis },
      { name: "📣 Top Mentions", value: topMentions }
    );

    base.setDescription("Your most iconic places, vibes, and people this year.");
    return base;
  }

  if (pageIndex === 3) {
    base.setTitle("🏅 Achievements");

    const achievements = [];

    if ((stats.messages || 0) >= 10000)
      achievements.push("**Message Machine** — 10,000+ messages.");
    if ((stats.messages || 0) >= 1000 && (stats.messages || 0) < 10000)
      achievements.push("**Chatty** — 1,000+ messages.");
    if ((stats.countingPoints || 0) >= 500)
      achievements.push("**Counting Legend** — 500+ correct counts.");
    if ((stats.tickets || 0) >= 20)
      achievements.push("**Ticket Enjoyer** — 20+ tickets opened.");
    if ((stats.giveaways || 0) >= 50)
      achievements.push("**Giveaway Goblin** — 50+ giveaway entries.");
    if ((stats.giveawaysWon || 0) >= 5)
      achievements.push("**Lucky Duck** — 5+ giveaway wins.");
    if ((stats.vcTime || 0) >= 24 * 3600000)
      achievements.push("**VC Warrior** — 24+ hours in voice.");
    if ((stats.collabAccepted || 0) >= 1)
      achievements.push("**Official Collaborator** — Collab accepted.");

    if (achievements.length === 0)
      achievements.push("No big achievements yet — but your story’s just getting started.");

    base.setDescription(achievements.map(a => `• ${a}`).join("\n"));
    return base;
  }

  return base.setDescription("Something went wrong building this page.");
}

function buildWrappedRow(pageIndex) {
  return new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId(`wrapped_prev_${pageIndex}`)
      .setLabel("Back")
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(pageIndex === 0),
    new ButtonBuilder()
      .setCustomId(`wrapped_next_${pageIndex}`)
      .setLabel("Next")
      .setStyle(ButtonStyle.Primary)
      .setDisabled(pageIndex === 3)
  );
}

function compactTopEntries(obj, limit = 5) {
  return getTopEntries(obj, limit).map(([id, count]) => ({
    id,
    count: Number(count) || 0
  }));
}

function labelTopEntries(entries, type, guild) {
  return entries.map(entry => {
    if (type === "channels") {
      const channel = guild?.channels?.cache?.get(entry.id);
      return {
        ...entry,
        label: channel?.name ? `#${channel.name}` : `Channel ${String(entry.id).slice(-4)}`
      };
    }

    if (type === "mentions") {
      const member = guild?.members?.cache?.get(entry.id);
      return {
        ...entry,
        label: member?.displayName || `User ${String(entry.id).slice(-4)}`
      };
    }

    return {
      ...entry,
      label: entry.id
    };
  });
}

function buildAchievements(stats, economy) {
  const achievements = [];
  const totalMoney = (economy.wallet || 0) + (economy.bank || 0);
  const ownedPets = economy.pets?.owned?.length || 0;
  const questCount = economy.stats?.questsCompleted || 0;

  if ((stats.messages || 0) >= 10000) achievements.push("Message Machine");
  else if ((stats.messages || 0) >= 1000) achievements.push("Chatty");
  if ((stats.countingPoints || 0) >= 500) achievements.push("Counting Legend");
  if ((stats.tickets || 0) >= 20) achievements.push("Ticket Regular");
  if ((stats.giveaways || 0) >= 50) achievements.push("Giveaway Regular");
  if ((stats.giveawaysWon || 0) >= 5) achievements.push("Lucky Streak");
  if ((stats.vcTime || 0) >= 24 * 3600000) achievements.push("VC Warrior");
  if ((stats.collabAccepted || 0) >= 1) achievements.push("Official Collaborator");
  if (totalMoney >= 1000000) achievements.push("Millionaire");
  if (ownedPets >= 5) achievements.push("Pet Collector");
  if (questCount >= 25) achievements.push("Quest Grinder");
  if ((economy.stats?.fishCaught || 0) >= 500) achievements.push("Master Angler");
  if ((economy.stats?.oresMined || 0) >= 500) achievements.push("Deep Miner");

  if (!achievements.length) achievements.push("Fresh Start");
  return achievements.slice(0, 8);
}

function buildEconomySnapshot(user) {
  const inventory = Object.entries(user.inventory || {})
    .filter(([, qty]) => Number(qty) > 0)
    .sort((a, b) => Number(b[1]) - Number(a[1]))
    .slice(0, 8)
    .map(([name, qty]) => ({ name, qty: Number(qty) || 0 }));

  const fishInventory = Object.entries(user.fishing?.inventory || {})
    .filter(([, qty]) => Number(qty) > 0)
    .sort((a, b) => Number(b[1]) - Number(a[1]))
    .slice(0, 8)
    .map(([name, qty]) => ({ name, qty: Number(qty) || 0 }));

  return {
    wallet: user.wallet || 0,
    bank: user.bank || 0,
    total: (user.wallet || 0) + (user.bank || 0),
    job: {
      name: user.job?.name || "Unemployed",
      level: user.job?.level || 1,
      streak: user.job?.streak || 0,
      pay: user.job?.pay || 0,
      raise: user.job?.raise || 0
    },
    house: user.house || "No house yet",
    fishing: {
      rod: user.fishing?.rod || "Basic Rod",
      upgrades: user.fishing?.upgrades || 0,
      inventory: fishInventory
    },
    gathering: {
      miningLevel: user.gathering?.miningLevel || 1,
      farmingLevel: user.gathering?.farmingLevel || 1,
      woodcuttingLevel: user.gathering?.woodcuttingLevel || 1
    },
    pets: {
      owned: user.pets?.owned || [],
      equipped: user.pets?.equipped || null
    },
    quests: {
      claimed: Boolean(user.quests?.claimed),
      weekly: user.quests?.weekly || {},
      progress: user.quests?.progress || {}
    },
    stats: {
      fishCaught: user.stats?.fishCaught || 0,
      oresMined: user.stats?.oresMined || 0,
      woodChopped: user.stats?.woodChopped || 0,
      farming: user.stats?.farming || 0,
      questsCompleted: user.stats?.questsCompleted || 0,
      minigamesWon: user.stats?.minigamesWon || 0
    },
    inventory
  };
}

function cleanRangePayload(range, guild) {
  const stats = range.stats || {};
  return {
    label: range.label,
    note: range.note,
    stats: {
      messages: stats.messages || 0,
      countingPoints: stats.countingPoints || 0,
      tickets: stats.tickets || 0,
      giveaways: stats.giveaways || 0,
      giveawaysWon: stats.giveawaysWon || 0,
      magic8: stats.magic8 || 0,
      vcTime: stats.vcTime || 0,
      collabAccepted: stats.collabAccepted || 0,
      collabDenied: stats.collabDenied || 0,
      modAccepted: stats.modAccepted || 0,
      modDenied: stats.modDenied || 0
    },
    top: {
      channels: labelTopEntries(compactTopEntries(stats.topChannel), "channels", guild),
      emojis: labelTopEntries(compactTopEntries(stats.topEmoji), "emojis", guild),
      mentions: labelTopEntries(compactTopEntries(stats.topMentions), "mentions", guild)
    }
  };
}

function buildWrappedPayload(interaction, stats, economy) {
  const ranges = buildRangeStats(interaction.user.id, stats);
  const cleanRanges = {};

  for (const [key, range] of Object.entries(ranges)) {
    cleanRanges[key] = cleanRangePayload(range, interaction.guild);
  }

  return {
    version: 1,
    id: crypto.randomBytes(9).toString("base64url"),
    generatedAt: new Date().toISOString(),
    user: {
      id: interaction.user.id,
      username: interaction.user.username,
      displayName: interaction.member?.displayName || interaction.user.username,
      avatar: interaction.user.displayAvatarURL({ extension: "png", size: 256 })
    },
    guild: {
      name: interaction.guild?.name || "ThinkLink's Land",
      icon: interaction.guild?.iconURL?.({ extension: "png", size: 256 }) || null
    },
    ranges: cleanRanges,
    economy,
    achievements: buildAchievements(stats, economy)
  };
}

function encodePayload(payload) {
  return zlib
    .deflateRawSync(Buffer.from(JSON.stringify(payload), "utf8"))
    .toString("base64url");
}

async function publishWrappedPayload(payload) {
  const apiUrl = process.env.WRAPPED_API_URL;
  if (!apiUrl) return null;

  const allowInsecureTls = process.env.WRAPPED_ALLOW_INSECURE_TLS === "true";
  const response = await axios.post(
    apiUrl,
    {
      key: process.env.WRAPPED_API_KEY || "",
      payload
    },
    {
      timeout: 10000,
      headers: { "Content-Type": "application/json" },
      ...(allowInsecureTls
        ? { httpsAgent: new https.Agent({ rejectUnauthorized: false }) }
        : {})
    }
  );

  if (!response.data?.ok || !response.data?.id) {
    throw new Error(`Wrapped API rejected payload: ${JSON.stringify(response.data)}`);
  }

  return response.data.id;
}

async function buildWrappedUrl(payload) {
  const pageUrl = process.env.WRAPPED_PAGE_URL || DEFAULT_WRAPPED_PAGE_URL;
  let publishError = "";

  try {
    const publishedId = await publishWrappedPayload(payload);
    if (publishedId) {
      const url = new URL(pageUrl);
      url.searchParams.set("id", publishedId);
      url.searchParams.set("api", process.env.WRAPPED_API_URL);
      return {
        url: url.toString(),
        mode: "api"
      };
    }
  } catch (err) {
    console.error("Failed to publish Wrapped payload:", err);
    publishError = err.response?.data?.error || err.message || "Wrapped API publish failed";
  }

  if (process.env.WRAPPED_API_URL && publishError) {
    const setupUrl = new URL(pageUrl);
    setupUrl.searchParams.set("setup", "api-error");
    setupUrl.searchParams.set("reason", publishError.slice(0, 180));
    return {
      url: setupUrl.toString(),
      mode: "api-error",
      error: publishError
    };
  }

  const url = new URL(pageUrl);
  url.searchParams.set("id", payload.id);
  url.searchParams.set("z", "1");
  url.searchParams.set("d", encodePayload(payload));

  if (url.toString().length > 500) {
    const setupUrl = new URL(pageUrl);
    setupUrl.searchParams.set("setup", "api-required");
    return {
      url: setupUrl.toString(),
      mode: "setup-required"
    };
  }

  return {
    url: url.toString(),
    mode: "inline"
  };
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName("wrapped")
    .setDescription("Open your ThinkLink Wrapped stats page"),

  async execute(i) {
    await i.deferReply({ ephemeral: true });

    const stats = getUserStats(i.user.id);
    const economy = buildEconomySnapshot(ensureUser(i.user.id));
    const payload = buildWrappedPayload(i, stats, economy);
    saveWrappedStats({ immediate: true, includeHistory: true });
    const { url, mode, error } = await buildWrappedUrl(payload);

    const embed = new EmbedBuilder()
      .setAuthor({
        name: `${payload.user.displayName}'s ThinkLink Wrapped`,
        iconURL: payload.user.avatar
      })
      .setTitle("Your stats page is ready")
      .setDescription(
        "Open the button below to view your full Wrapped page with range controls, activity stats, top lists, and economy progress."
      )
      .setColor(0xa9e875)
      .addFields(
        { name: "Messages", value: `${stats.messages || 0}`, inline: true },
        { name: "Voice Time", value: formatVcTime(stats.vcTime || 0), inline: true },
        { name: "Economy Total", value: formatCoins(economy.total), inline: true },
        {
          name: "Share Mode",
          value:
            mode === "api"
              ? "Saved by unique page ID"
              : mode === "api-error"
              ? `API setup problem: ${String(error || "Unknown error").slice(0, 120)}`
              : mode === "setup-required"
              ? "Waiting for Wrapped API setup"
              : "Encoded into this private link",
          inline: false
        }
      )
      .setFooter({ text: "This link contains your current Wrapped snapshot." })
      .setTimestamp();

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setLabel("Open Wrapped Page")
        .setStyle(ButtonStyle.Link)
        .setURL(url)
    );

    await i.editReply({ embeds: [embed], components: [row] });
  },

  buildWrappedEmbed,
  buildWrappedRow,
  buildWrappedPayload,
  buildWrappedUrl
};
