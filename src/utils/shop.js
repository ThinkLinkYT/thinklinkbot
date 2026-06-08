const fs = require("fs");
const path = require("path");
const { readJSON, writeJSONAtomic } = require("./jsonStore");

const SHOP_PATH = path.join(__dirname, "../../data/shop.json");

const ITEMS = [
    { name: "Basic Rod", price: 200 },
    { name: "Sturdy Rod", price: 500 },
    { name: "Pro Rod", price: 1200 },
    { name: "Enchanted Rod", price: 3000 },
    { name: "Crate", price: 250 },
    { name: "Pet Egg", price: 800 }
];

function loadShop() {
    return readJSON(SHOP_PATH, { lastRotation: 0, rotation: [] }, { space: 4 });
}

function saveShop(data) {
    writeJSONAtomic(SHOP_PATH, data, 4);
}

function rotateShop() {
    const shop = loadShop();
    const now = Date.now();

    const oneDay = 24 * 60 * 60 * 1000;

    if (now - shop.lastRotation < oneDay) return shop.rotation;

    const shuffled = [...ITEMS].sort(() => Math.random() - 0.5);
    shop.rotation = shuffled.slice(0, 4);
    shop.lastRotation = now;

    saveShop(shop);

    return shop.rotation;
}

module.exports = {
    loadShop,
    saveShop,
    rotateShop
};
