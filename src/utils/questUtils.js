const path = require("path");
const { loadUsers, saveUsers, normalizeUser } = require("./database");
const { readJSON, writeJSONAtomic } = require("./jsonStore");

const configPath = path.join(__dirname, "../../data/questConfig.json");

function loadQuestConfig() {
    return readJSON(configPath, { lastReset: 0 }, { space: 4 });
}

function saveQuestConfig(config) {
    writeJSONAtomic(configPath, config, 4);
}

function generateWeeklyQuests() {
    return {
        fish: 100,
        mine: 75,
        chop: 75,
        farm: 100

    };
}

function resetWeeklyQuests() {
    const users = loadUsers();

    for (const userId in users) {
        users[userId] = normalizeUser(users[userId]);
        users[userId].quests = {
            weekly: generateWeeklyQuests(),
            progress: {
                fish: 0,
                mine: 0,
                chop: 0,
                farm: 0
            },
            claimed: false
        };
    }

    const questConfig = loadQuestConfig();
    questConfig.lastReset = Date.now();
    saveUsers(users);
    saveQuestConfig(questConfig);
}

function checkWeeklyReset() {
    const oneWeek = 7 * 24 * 60 * 60 * 1000;
    const questConfig = loadQuestConfig();

    if (Date.now() - (questConfig.lastReset || 0) >= oneWeek) {
        resetWeeklyQuests();
    }
}

module.exports = {
    checkWeeklyReset,
    generateWeeklyQuests
};
