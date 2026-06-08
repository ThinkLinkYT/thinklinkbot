const houses = require("../../data/houses.json");

function getHouseData(user) {
    if (!user.house) return null;
    return houses[user.house] || null;
}

function getTierBonus(user) {
    const data = getHouseData(user);
    if (!data) return { daily: 0, cooldown: 0 };
    return data.tierBonus || { daily: 0, cooldown: 0 };
}

function getTypeBonus(user) {
    const data = getHouseData(user);
    if (!data) return { gather: "none", amount: 0 };
    return data.typeBonus || { gather: "none", amount: 0 };
}

module.exports = {
    getHouseData,
    getTierBonus,
    getTypeBonus
};