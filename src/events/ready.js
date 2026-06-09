const { REST, Routes, Events } = require("discord.js");
const fs = require("fs");
const path = require("path");

const {
  ensureCountingSession,
  getCountingChannelId,
  loadLeaderboard,
  loadSessions
} = require("../utils/counting");
const { loadGiveaways } = require("../utils/giveaways");
const { checkWeeklyReset } = require("../utils/questUtils");
const { startUnderageTimeoutMonitor } = require("../utils/underageTimeouts");

const targetUserId = process.env.THINKLINK_USER_ID || "1169759575981953177";

function updatePresence(client, status) {
  client.user.setPresence({
    activities: [
      { name: `ThinkLink is ${status === "online" ? "Online" : "Offline"}`, type: 0 }
    ],
    status: status === "online" ? "online" : "dnd"
  });
}

// Recursively load all command files
function loadCommandsRecursively(dir) {
  const commands = [];

  const files = fs.readdirSync(dir, { withFileTypes: true });

  for (const file of files) {
    const fullPath = path.join(dir, file.name);

    if (file.isDirectory()) {
      commands.push(...loadCommandsRecursively(fullPath));
    } else if (file.name.endsWith(".js")) {
      let command;
      try {
        command = require(fullPath);
      } catch (err) {
        console.error(`Failed to load slash command from ${fullPath}:`, err);
        continue;
      }
      if (command.data) {
        commands.push(command.data.toJSON());
      }
    }
  }

  return commands;
}

module.exports = {
  name: Events.ClientReady,
  once: true,
  async execute(client) {
    console.log(`Logged in as ${client.user.tag}`);

    // Load persisted data
    loadLeaderboard();
    loadSessions();
    const countingChannelId = getCountingChannelId();
    const countingSession = ensureCountingSession(countingChannelId);
    if (countingSession.enabled === false) {
      console.log(`Counting is disabled in channel ${countingChannelId}.`);
    } else {
      console.log(
        `Counting restored in channel ${countingChannelId}: next number ${countingSession.currentNumber}, lives ${countingSession.lives}.`
      );
    }
    loadGiveaways(client);
    checkWeeklyReset();
    setInterval(checkWeeklyReset, 60 * 60 * 1000);
    startUnderageTimeoutMonitor(client);

    // Load all commands from src/commands recursively
    const commandsPath = path.join(__dirname, "../commands");
    const commands = loadCommandsRecursively(commandsPath);

    console.log(`Loaded ${commands.length} slash commands.`);

    // Register slash commands
    const rest = new REST({ version: "10" }).setToken(process.env.DISCORD_TOKEN);

    try {
      await rest.put(
        Routes.applicationGuildCommands(process.env.CLIENT_ID, process.env.GUILD_ID),
        { body: commands }
      );
      console.log("Slash commands registered.");
    } catch (err) {
      console.error("Failed to register slash commands:", err);
    }

    // Initial presence based on ThinkLink
    try {
      const guild = await client.guilds.fetch(process.env.GUILD_ID);
      const member = await guild.members.fetch(targetUserId);
      updatePresence(client, member.presence?.status || "offline");
    } catch (err) {
      console.error("Failed to set initial presence:", err);
    }

    client.updateThinkLinkPresence = status => updatePresence(client, status);
  }
};
