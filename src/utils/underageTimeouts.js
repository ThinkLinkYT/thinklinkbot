const path = require("path");
const { EmbedBuilder } = require("discord.js");
const { readJSON, writeJSONAtomic } = require("./jsonStore");
const { sendAuditLog } = require("./audit");

const ONE_WEEK_MS = 7 * 24 * 60 * 60 * 1000;
const CHECK_INTERVAL_MS = 10 * 60 * 1000;
const DISCORD_TIMEOUT_BUFFER_MS = 60 * 1000;
const MOD_TIMEOUT_GRACE_MS = 10 * 60 * 1000;
const STORE_PATH = path.join(__dirname, "../../data/underageTimeouts.json");

let monitorStarted = false;

function loadUnderageTimeouts() {
  return readJSON(STORE_PATH, {}, { space: 2 });
}

function saveUnderageTimeouts(data) {
  writeJSONAtomic(STORE_PATH, data, 2);
}

function recordKey(guildId, userId) {
  return `${guildId}:${userId}`;
}

function getReleaseAt(user) {
  return user.createdTimestamp + ONE_WEEK_MS + DISCORD_TIMEOUT_BUFFER_MS;
}

function getAccountAgeMs(user, now = Date.now()) {
  return now - user.createdTimestamp;
}

function isAccountUnderOneWeek(user, now = Date.now()) {
  return now < getReleaseAt(user);
}

function formatAgeDays(ms) {
  return (ms / (24 * 60 * 60 * 1000)).toFixed(1);
}

function saveRecord(member, releaseAt) {
  const data = loadUnderageTimeouts();
  data[recordKey(member.guild.id, member.id)] = {
    guildId: member.guild.id,
    userId: member.id,
    releaseAt,
    appliedAt: Date.now(),
    username: member.user.tag
  };
  saveUnderageTimeouts(data);
}

function removeRecord(guildId, userId) {
  const data = loadUnderageTimeouts();
  delete data[recordKey(guildId, userId)];
  saveUnderageTimeouts(data);
}

async function applyUnderageTimeout(member) {
  if (member.user.bot) return false;

  const now = Date.now();
  const releaseAt = getReleaseAt(member.user);
  if (!isAccountUnderOneWeek(member.user, now)) return false;

  const existingTimeout = member.communicationDisabledUntilTimestamp || 0;
  if (existingTimeout >= releaseAt - DISCORD_TIMEOUT_BUFFER_MS) {
    saveRecord(member, releaseAt);
    return true;
  }

  const durationMs = Math.max(1000, releaseAt - now);
  await member.timeout(durationMs, "Account under 7 days old - auto timeout for safety");
  saveRecord(member, releaseAt);

  const avatar = member.user.displayAvatarURL({ size: 128 });
  const embed = new EmbedBuilder()
    .setAuthor({ name: member.user.tag, iconURL: avatar })
    .setTitle("Auto Timeout Applied")
    .setColor(0xe67e22)
    .setDescription(`User: <@${member.id}>`)
    .addFields(
      {
        name: "Account Age",
        value: `${formatAgeDays(getAccountAgeMs(member.user, now))} days`,
        inline: true
      },
      {
        name: "Auto Release",
        value: `<t:${Math.floor(releaseAt / 1000)}:F>`,
        inline: true
      }
    )
    .setTimestamp();

  await sendAuditLog(member.guild, embed);
  return true;
}

async function releaseUnderageTimeout(client, record) {
  if (!record?.guildId || !record?.userId || !record?.releaseAt) return;
  if (Date.now() < record.releaseAt) return;

  const guild = await client.guilds.fetch(record.guildId).catch(() => null);
  if (!guild) {
    removeRecord(record.guildId, record.userId);
    return;
  }

  const member = await guild.members.fetch(record.userId).catch(() => null);
  if (!member) {
    removeRecord(record.guildId, record.userId);
    return;
  }

  if (isAccountUnderOneWeek(member.user)) return;

  const timeoutUntil = member.communicationDisabledUntilTimestamp || 0;
  if (!timeoutUntil) {
    removeRecord(record.guildId, record.userId);
    return;
  }

  if (timeoutUntil > record.releaseAt + MOD_TIMEOUT_GRACE_MS) {
    removeRecord(record.guildId, record.userId);
    return;
  }

  await member.timeout(null, "Account is now over 7 days old");
  removeRecord(record.guildId, record.userId);

  const avatar = member.user.displayAvatarURL({ size: 128 });
  const embed = new EmbedBuilder()
    .setAuthor({ name: member.user.tag, iconURL: avatar })
    .setTitle("Auto Timeout Removed")
    .setDescription(`<@${member.id}> is now over 7 days old.`)
    .setColor(0x2ecc71)
    .setTimestamp();

  await sendAuditLog(guild, embed);
}

async function processUnderageTimeoutRecords(client) {
  const data = loadUnderageTimeouts();
  for (const record of Object.values(data)) {
    await releaseUnderageTimeout(client, record).catch(err => {
      console.error("Failed to process underage timeout release:", err);
    });
  }
}

async function scanGuildForUnderageAccounts(client) {
  const guildId = process.env.GUILD_ID;
  if (!guildId) return;

  const guild = await client.guilds.fetch(guildId).catch(() => null);
  if (!guild) return;

  const members = await guild.members.fetch().catch(() => null);
  if (!members) return;

  for (const member of members.values()) {
    if (member.user.bot) continue;
    if (!isAccountUnderOneWeek(member.user)) continue;

    await applyUnderageTimeout(member).catch(err => {
      console.error(`Failed to auto-timeout underage account ${member.id}:`, err);
    });
  }
}

function startUnderageTimeoutMonitor(client) {
  if (monitorStarted) return;
  monitorStarted = true;

  const run = async () => {
    await processUnderageTimeoutRecords(client);
    await scanGuildForUnderageAccounts(client);
  };

  run().catch(err => console.error("Underage timeout monitor failed:", err));
  setInterval(() => {
    run().catch(err => console.error("Underage timeout monitor failed:", err));
  }, CHECK_INTERVAL_MS);
}

module.exports = {
  ONE_WEEK_MS,
  getReleaseAt,
  isAccountUnderOneWeek,
  applyUnderageTimeout,
  startUnderageTimeoutMonitor
};
