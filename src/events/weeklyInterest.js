const { Events } = require("discord.js");
const { loadUsers, saveUsers, normalizeUser } = require("../utils/database");

let intervalStarted = false;

module.exports = {
    name: Events.ClientReady,
    once: false,

    async execute(client) {
        if (intervalStarted) return;
        intervalStarted = true;

        setInterval(() => {
            const users = loadUsers();
            const now = Date.now();
            let changed = false;

            const oneWeek = 7 * 24 * 60 * 60 * 1000;

            for (const userId in users) {
                const user = normalizeUser(users[userId]);
                users[userId] = user;

                if (!user.lastInterest) user.lastInterest = 0;

                if (now - user.lastInterest < oneWeek) continue;

                const rate = Math.random() * (3 - 1) + 1; // 1–3%
                const interest = Math.floor(user.bank * (rate / 100));

                user.bank += interest;
                user.lastInterest = now;
                changed = true;
            }

            if (changed) saveUsers(users);
        }, 60 * 1000); // check every minute
    }
};
