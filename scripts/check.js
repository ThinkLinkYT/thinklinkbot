const { spawnSync } = require("child_process");
const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
let failures = 0;

function fail(message) {
  failures += 1;
  console.error(message);
}

function walk(dir, predicate = () => true) {
  if (!fs.existsSync(dir)) return [];

  const result = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === "node_modules") continue;
      if (entry.name.startsWith("backup-before-")) continue;
      result.push(...walk(fullPath, predicate));
    } else if (predicate(fullPath)) {
      result.push(fullPath);
    }
  }
  return result;
}

function relative(file) {
  return path.relative(root, file);
}

function checkSyntax(files) {
  for (const file of files) {
    const result = spawnSync(process.execPath, ["--check", file], {
      cwd: root,
      encoding: "utf8"
    });

    if (result.status !== 0) {
      fail(`Syntax check failed: ${relative(file)}\n${result.stderr || result.stdout}`);
    }
  }
}

function checkJSON(files) {
  for (const file of files) {
    try {
      JSON.parse(fs.readFileSync(file, "utf8"));
    } catch (err) {
      fail(`Invalid JSON: ${relative(file)}\n${err.message}`);
    }
  }
}

function requireModule(file) {
  try {
    return require(file);
  } catch (err) {
    fail(`Failed to load ${relative(file)}: ${err.message}`);
    return null;
  }
}

function checkHandlers() {
  const commands = new Map();
  const buttons = new Map();

  for (const file of walk(path.join(root, "src", "commands"), file => file.endsWith(".js"))) {
    const command = requireModule(file);
    const name = command?.data?.name || command?.name;
    if (!name) {
      fail(`Command is missing data.name/name: ${relative(file)}`);
      continue;
    }
    if (commands.has(name)) fail(`Duplicate command "${name}": ${commands.get(name)} and ${relative(file)}`);
    commands.set(name, relative(file));
    if (typeof command.execute !== "function") fail(`Command is missing execute(): ${relative(file)}`);
  }

  for (const file of walk(path.join(root, "src", "buttons"), file => file.endsWith(".js"))) {
    const button = requireModule(file);
    if (!button?.id) {
      fail(`Button is missing id: ${relative(file)}`);
      continue;
    }
    if (buttons.has(button.id)) fail(`Duplicate button id "${button.id}": ${buttons.get(button.id)} and ${relative(file)}`);
    buttons.set(button.id, relative(file));
    if (typeof button.execute !== "function") fail(`Button is missing execute(): ${relative(file)}`);
  }

  for (const file of walk(path.join(root, "src", "events"), file => file.endsWith(".js"))) {
    const event = requireModule(file);
    if (!event?.name) fail(`Event is missing name: ${relative(file)}`);
    if (typeof event?.execute !== "function") fail(`Event is missing execute(): ${relative(file)}`);
  }
}

const jsFiles = walk(root, file => file.endsWith(".js"));
const jsonFiles = walk(path.join(root, "data"), file => file.endsWith(".json"));

checkSyntax(jsFiles);
checkJSON(jsonFiles);
checkHandlers();

if (failures) {
  console.error(`Check failed with ${failures} issue(s).`);
  process.exit(1);
}

console.log(`Check passed: ${jsFiles.length} JavaScript files and ${jsonFiles.length} JSON files.`);
