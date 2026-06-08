const fs = require("fs");
const path = require("path");
const { readJSON, writeJSONAtomic } = require("./jsonStore");

const FILE = path.join(__dirname, "../../data/blackjack.json");

function loadGames() {
    if (!fs.existsSync(FILE)) writeJSONAtomic(FILE, {}, 4);
    return readJSON(FILE, {}, { space: 4 });
}

function saveGames(data) {
    writeJSONAtomic(FILE, data, 4);
}

function drawCard() {
    const ranks = ["A","2","3","4","5","6","7","8","9","10","J","Q","K"];
    const suits = ["♠","♥","♦","♣"];
    const rank = ranks[Math.floor(Math.random() * ranks.length)];
    const suit = suits[Math.floor(Math.random() * suits.length)];
    return `${rank}${suit}`;
}

function cardValue(card) {
    const rank = card.replace(/♠|♥|♦|♣/g, "");
    if (["J","Q","K"].includes(rank)) return 10;
    if (rank === "A") return 11;
    return parseInt(rank);
}

function handValue(hand) {
    let total = hand.reduce((sum, c) => sum + cardValue(c), 0);
    let aces = hand.filter(c => c.startsWith("A")).length;

    while (total > 21 && aces > 0) {
        total -= 10;
        aces--;
    }
    return total;
}

module.exports = {
    loadGames,
    saveGames,
    drawCard,
    handValue
};
