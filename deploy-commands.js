require("dotenv").config();
const fs = require("fs");
const path = require("path");
const { REST, Routes } = require("discord.js");
const { assertRequiredEnv } = require("./src/utils/env");

try {
    assertRequiredEnv(["DISCORD_TOKEN", "CLIENT_ID", "GUILD_ID"]);
} catch (err) {
    console.error(err.message);
    process.exit(1);
}

function loadCommandsRecursively(dir) {
    const loaded = [];
    if (!fs.existsSync(dir)) return loaded;

    const files = fs.readdirSync(dir, { withFileTypes: true });
    for (const file of files) {
        const fullPath = path.join(dir, file.name);

        if (file.isDirectory()) {
            loaded.push(...loadCommandsRecursively(fullPath));
            continue;
        }

        if (!file.name.endsWith(".js")) continue;

        const command = require(fullPath);
        if (!command.data) {
            console.log(`Skipping ${file.name}: missing .data`);
            continue;
        }

        loaded.push(command.data.toJSON());
        console.log(`Loaded slash command: ${command.data.name}`);
    }

    return loaded;
}

const commands = [];
const commandsPath = path.join(__dirname, "src", "commands");
commands.push(...loadCommandsRecursively(commandsPath));

const rest = new REST({ version: "10" }).setToken(process.env.DISCORD_TOKEN);

(async () => {
    try {
        console.log(`Refreshing ${commands.length} guild slash commands...`);

        await rest.put(
            Routes.applicationGuildCommands(
                process.env.CLIENT_ID,
                process.env.GUILD_ID
            ),
            { body: commands }
        );

        console.log("Guild slash commands registered successfully.");
    } catch (error) {
        console.error(error);
        process.exitCode = 1;
    }
})();
