require("dotenv").config();
const {
  Client,
  GatewayIntentBits,
  Partials,
  Collection
} = require("discord.js");
const fs = require("fs");
const path = require("path");
const { assertRequiredEnv } = require("./src/utils/env");

try {
  assertRequiredEnv();
} catch (err) {
  console.error(err.message);
  process.exit(1);
}

process.on("unhandledRejection", err => {
  console.error("Unhandled promise rejection:", err);
});

process.on("uncaughtException", err => {
  console.error("Uncaught exception:", err);
});

// Create client
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildVoiceStates,
    GatewayIntentBits.GuildPresences,
    GatewayIntentBits.GuildBans
  ],
  partials: [
    Partials.Channel,
    Partials.Message,
    Partials.GuildMember
  ]
});

// Collections
client.commands = new Collection();
client.buttons = new Collection();

// ---- Load commands ----
const commandsPath = path.join(__dirname, "src", "commands");
if (fs.existsSync(commandsPath)) {
  const commandFiles = fs.readdirSync(commandsPath).filter(f => f.endsWith(".js"));
  for (const file of commandFiles) {
    let command;
    try {
      command = require(path.join(commandsPath, file));
    } catch (err) {
      console.error(`Failed to load command ${file}:`, err);
      continue;
    }

    // Slash command builder uses .data, fallback to .name for legacy
    const commandName = command.data?.name || command.name;

    if (!commandName) {
      console.warn(`⚠️ Command file ${file} is missing a name.`);
      continue;
    }

    client.commands.set(commandName, command);
  }
} else {
  console.error("❌ Missing folder: src/commands");
}

// ---- Load buttons ----
const buttonsPath = path.join(__dirname, "src", "buttons");
if (fs.existsSync(buttonsPath)) {
  const buttonFiles = fs.readdirSync(buttonsPath).filter(f => f.endsWith(".js"));
  for (const file of buttonFiles) {
    let button;
    try {
      button = require(path.join(buttonsPath, file));
    } catch (err) {
      console.error(`Failed to load button ${file}:`, err);
      continue;
    }

    if (!button.id) {
      console.warn(`⚠️ Button file ${file} is missing an ID.`);
      continue;
    }

    client.buttons.set(button.id, button);
  }
} else {
  console.error("❌ Missing folder: src/buttons");
}

// ---- Load events ----
const eventsPath = path.join(__dirname, "src", "events");
if (fs.existsSync(eventsPath)) {
  const eventFiles = fs.readdirSync(eventsPath).filter(f => f.endsWith(".js"));
  for (const file of eventFiles) {
    let event;
    try {
      event = require(path.join(eventsPath, file));
    } catch (err) {
      console.error(`Failed to load event ${file}:`, err);
      continue;
    }

    if (!event.name || !event.execute) {
      console.warn(`⚠️ Event file ${file} is missing name or execute.`);
      continue;
    }

    if (event.once) {
      client.once(event.name, (...args) => event.execute(...args, client));
    } else {
      client.on(event.name, (...args) => event.execute(...args, client));
    }
  }
} else {
  console.error("❌ Missing folder: src/events");
}

client.on("error", err => console.error("Discord client error:", err));
client.on("warn", warning => console.warn("Discord client warning:", warning));

client.login(process.env.DISCORD_TOKEN).catch(err => {
  console.error("Failed to log in to Discord:", err);
  process.exit(1);
});
