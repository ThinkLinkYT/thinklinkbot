const fs = require("fs");
const path = require("path");
const { readJSON, writeJSONAtomic } = require("./jsonStore");
const { clampBalance, MAX_BALANCE } = require("./economy");

const USERS_PATH = path.join(__dirname, "../../data/users.json");

function isPlainObject(value) {
    return value && typeof value === "object" && !Array.isArray(value);
}

function ensureObject(parent, key, fallback = {}) {
    if (!isPlainObject(parent[key])) parent[key] = { ...fallback };
    return parent[key];
}

function ensureNumber(parent, key, fallback = 0, options = {}) {
    const min = options.min ?? 0;
    const max = options.max ?? MAX_BALANCE;
    const value = Number(parent[key]);
    const normalized = Number.isFinite(value) ? Math.floor(value) : fallback;
    parent[key] = Math.max(min, Math.min(max, normalized));
}

function ensureArray(parent, key) {
    if (!Array.isArray(parent[key])) parent[key] = [];
}

function normalizeInventory(inventory) {
    if (!isPlainObject(inventory)) return {};

    for (const key of Object.keys(inventory)) {
        const qty = Math.floor(Number(inventory[key]));
        if (!Number.isFinite(qty) || qty <= 0) {
            delete inventory[key];
        } else {
            inventory[key] = Math.min(qty, MAX_BALANCE);
        }
    }

    return inventory;
}

function normalizeUser(input = {}) {
    const user = isPlainObject(input) ? input : {};

    user.wallet = clampBalance(user.wallet);
    user.bank = clampBalance(user.bank);
    ensureNumber(user, "lastInterest", 0);

    const job = ensureObject(user, "job");
    if (!Object.prototype.hasOwnProperty.call(job, "name")) job.name = null;
    ensureNumber(job, "level", 1, { min: 1 });
    ensureNumber(job, "lastPayday", 0);
    ensureNumber(job, "lastActive", Date.now());
    ensureNumber(job, "streak", 0);
    ensureNumber(job, "raise", 0);
    ensureNumber(job, "applyCooldown", 0);
    if (!Object.prototype.hasOwnProperty.call(job, "pay")) job.pay = undefined;
    else ensureNumber(job, "pay", 0);

    const fishing = ensureObject(user, "fishing");
    if (!fishing.rod) fishing.rod = "Basic Rod";
    ensureObject(fishing, "inventory");
    fishing.inventory = normalizeInventory(fishing.inventory);
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

    user.inventory = normalizeInventory(ensureObject(user, "inventory"));

    const pets = ensureObject(user, "pets");
    ensureArray(pets, "owned");
    pets.owned = [...new Set(pets.owned.filter(pet => typeof pet === "string" && pet.trim()))];
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
    users[userId] = normalizeUser(newData);
    saveUsers(users);
}

function addMoney(userId, amount) {
    const value = Math.max(0, Math.floor(Number(amount) || 0));
    const user = ensureUser(userId);
    user.wallet = clampBalance(user.wallet + value);
    updateUser(userId, user);
}

function removeMoney(userId, amount) {
    const value = Math.max(0, Math.floor(Number(amount) || 0));
    const user = ensureUser(userId);
    user.wallet = clampBalance(user.wallet - value);
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
