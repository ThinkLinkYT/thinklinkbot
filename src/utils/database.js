const fs = require("fs");
const path = require("path");
const { readJSON, writeJSONAtomic } = require("./jsonStore");

const USERS_PATH = path.join(__dirname, "../../data/users.json");

function isPlainObject(value) {
    return value && typeof value === "object" && !Array.isArray(value);
}

function ensureObject(parent, key, fallback = {}) {
    if (!isPlainObject(parent[key])) parent[key] = { ...fallback };
    return parent[key];
}

function ensureNumber(parent, key, fallback = 0) {
    const value = Number(parent[key]);
    parent[key] = Number.isFinite(value) ? value : fallback;
}

function ensureArray(parent, key) {
    if (!Array.isArray(parent[key])) parent[key] = [];
}

function normalizeUser(input = {}) {
    const user = isPlainObject(input) ? input : {};

    ensureNumber(user, "wallet", 0);
    ensureNumber(user, "bank", 0);
    ensureNumber(user, "lastInterest", 0);

    const job = ensureObject(user, "job");
    if (!Object.prototype.hasOwnProperty.call(job, "name")) job.name = null;
    ensureNumber(job, "level", 1);
    ensureNumber(job, "lastPayday", 0);
    ensureNumber(job, "lastActive", Date.now());
    ensureNumber(job, "streak", 0);
    ensureNumber(job, "raise", 0);
    if (!Object.prototype.hasOwnProperty.call(job, "pay")) job.pay = undefined;

    const fishing = ensureObject(user, "fishing");
    if (!fishing.rod) fishing.rod = "Basic Rod";
    ensureObject(fishing, "inventory");
    ensureNumber(fishing, "upgrades", 0);

    const gathering = ensureObject(user, "gathering");
    ensureNumber(gathering, "miningLevel", 1);
    ensureNumber(gathering, "farmingLevel", 1);
    ensureNumber(gathering, "woodcuttingLevel", 1);
    const gatheringCooldowns = ensureObject(gathering, "cooldowns");
    ensureNumber(gatheringCooldowns, "mine", 0);
    ensureNumber(gatheringCooldowns, "farm", 0);
    ensureNumber(gatheringCooldowns, "chop", 0);

    const cooldowns = ensureObject(user, "cooldowns");
    ensureNumber(cooldowns, "fish", 0);

    ensureObject(user, "inventory");

    const pets = ensureObject(user, "pets");
    ensureArray(pets, "owned");
    if (!Object.prototype.hasOwnProperty.call(pets, "equipped")) pets.equipped = null;

    if (!Object.prototype.hasOwnProperty.call(user, "house")) user.house = null;

    const quests = ensureObject(user, "quests");
    ensureObject(quests, "weekly");
    ensureObject(quests, "progress");
    if (!Object.prototype.hasOwnProperty.call(quests, "claimed")) quests.claimed = false;

    const stats = ensureObject(user, "stats");
    ensureNumber(stats, "fishCaught", 0);
    ensureNumber(stats, "oresMined", 0);
    ensureNumber(stats, "woodChopped", 0);
    ensureNumber(stats, "questsCompleted", 0);
    ensureNumber(stats, "minigamesWon", 0);
    ensureNumber(stats, "farming", 0);

    return user;
}

function loadUsers() {
    if (!fs.existsSync(USERS_PATH)) {
        writeJSONAtomic(USERS_PATH, {}, 4);
    }
    return readJSON(USERS_PATH, {}, { space: 4 });
}

function saveUsers(data) {
    writeJSONAtomic(USERS_PATH, data, 4);
}

function ensureUser(userId) {
    const users = loadUsers();
    const before = JSON.stringify(users[userId] || null);

    // Create new user if not exists
    if (!users[userId]) {
        users[userId] = {};
    }

    const user = normalizeUser(users[userId]);
    users[userId] = user;

    if (JSON.stringify(user) !== before) saveUsers(users);

    return user;
}

function updateUser(userId, newData) {
    const users = loadUsers();
    users[userId] = newData;
    saveUsers(users);
}

function addMoney(userId, amount) {
    const user = ensureUser(userId);
    user.wallet += Number(amount) || 0;
    updateUser(userId, user);
}

function removeMoney(userId, amount) {
    const user = ensureUser(userId);
    user.wallet = Math.max(0, user.wallet - (Number(amount) || 0));
    updateUser(userId, user);
}

module.exports = {
    loadUsers,
    saveUsers,
    normalizeUser,
    ensureUser,
    updateUser,
    addMoney,
    removeMoney
};
