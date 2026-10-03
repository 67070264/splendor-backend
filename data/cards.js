// ไฟล์: data/cards.js

const deckTier1 = [
    // Black (onyx)
    { id: "t1_01", point: 0, gem: "onyx", cost: { sapphire: 1, emerald: 1, ruby: 1, diamond: 1 } },
    { id: "t1_02", point: 0, gem: "onyx", cost: { sapphire: 2, emerald: 1, ruby: 1, diamond: 1 } },
    { id: "t1_03", point: 0, gem: "onyx", cost: { sapphire: 2, ruby: 1, diamond: 2 } },
    { id: "t1_04", point: 0, gem: "onyx", cost: { onyx: 1, emerald: 1, ruby: 3 } },
    { id: "t1_05", point: 0, gem: "onyx", cost: { emerald: 2, ruby: 1 } },
    { id: "t1_06", point: 0, gem: "onyx", cost: { emerald: 2, diamond: 2 } },
    { id: "t1_07", point: 0, gem: "onyx", cost: { emerald: 3 } },
    { id: "t1_08", point: 1, gem: "onyx", cost: { sapphire: 4 } },
    // Blue (sapphire)
    { id: "t1_09", point: 0, gem: "sapphire", cost: { onyx: 1, emerald: 1, ruby: 1, diamond: 1 } },
    { id: "t1_10", point: 0, gem: "sapphire", cost: { onyx: 1, emerald: 1, ruby: 2, diamond: 1 } },
    { id: "t1_11", point: 0, gem: "sapphire", cost: { emerald: 2, ruby: 2, diamond: 1 } },
    { id: "t1_12", point: 0, gem: "sapphire", cost: { sapphire: 1, emerald: 3, ruby: 1 } },
    { id: "t1_13", point: 0, gem: "sapphire", cost: { onyx: 2, diamond: 1 } },
    { id: "t1_14", point: 0, gem: "sapphire", cost: { onyx: 2, emerald: 2 } },
    { id: "t1_15", point: 0, gem: "sapphire", cost: { onyx: 3 } },
    { id: "t1_16", point: 1, gem: "sapphire", cost: { ruby: 4 } },
    // White (diamond)
    { id: "t1_17", point: 0, gem: "diamond", cost: { onyx: 1, sapphire: 1, emerald: 1, ruby: 1 } },
    { id: "t1_18", point: 0, gem: "diamond", cost: { onyx: 1, sapphire: 1, emerald: 2, ruby: 1 } },
    { id: "t1_19", point: 0, gem: "diamond", cost: { onyx: 1, sapphire: 2, emerald: 2 } },
    { id: "t1_20", point: 0, gem: "diamond", cost: { onyx: 1, sapphire: 1, diamond: 3 } },
    { id: "t1_21", point: 0, gem: "diamond", cost: { onyx: 1, ruby: 2 } },
    { id: "t1_22", point: 0, gem: "diamond", cost: { onyx: 2, sapphire: 2 } },
    { id: "t1_23", point: 0, gem: "diamond", cost: { sapphire: 3 } },
    { id: "t1_24", point: 1, gem: "diamond", cost: { emerald: 4 } },
    // Green (emerald)
    { id: "t1_25", point: 0, gem: "emerald", cost: { onyx: 1, sapphire: 1, ruby: 1, diamond: 1 } },
    { id: "t1_26", point: 0, gem: "emerald", cost: { onyx: 2, sapphire: 1, ruby: 1, diamond: 1 } },
    { id: "t1_27", point: 0, gem: "emerald", cost: { onyx: 2, sapphire: 1, ruby: 2 } },
    { id: "t1_28", point: 0, gem: "emerald", cost: { sapphire: 3, emerald: 1, diamond: 1 } },
    { id: "t1_29", point: 0, gem: "emerald", cost: { sapphire: 1, diamond: 2 } },
    { id: "t1_30", point: 0, gem: "emerald", cost: { sapphire: 2, ruby: 2 } },
    { id: "t1_31", point: 0, gem: "emerald", cost: { ruby: 3 } },
    { id: "t1_32", point: 1, gem: "emerald", cost: { onyx: 4 } },
    // Red (ruby)
    { id: "t1_33", point: 0, gem: "ruby", cost: { onyx: 1, sapphire: 1, emerald: 1, diamond: 1 } },
    { id: "t1_34", point: 0, gem: "ruby", cost: { onyx: 1, sapphire: 1, emerald: 1, diamond: 2 } },
    { id: "t1_35", point: 0, gem: "ruby", cost: { onyx: 2, emerald: 1, diamond: 2 } },
    { id: "t1_36", point: 0, gem: "ruby", cost: { onyx: 3, ruby: 1, diamond: 1 } },
    { id: "t1_37", point: 0, gem: "ruby", cost: { sapphire: 2, emerald: 1 } },
    { id: "t1_38", point: 0, gem: "ruby", cost: { ruby: 2, diamond: 2 } },
    { id: "t1_39", point: 0, gem: "ruby", cost: { diamond: 3 } },
    { id: "t1_40", point: 1, gem: "ruby", cost: { diamond: 4 } }
];

const deckTier2 = [
    // Black (onyx)
    { id: "t2_01", point: 1, gem: "onyx", cost: { sapphire: 2, emerald: 2, diamond: 3 } },
    { id: "t2_02", point: 1, gem: "onyx", cost: { onyx: 2, emerald: 3, diamond: 3 } },
    { id: "t2_03", point: 2, gem: "onyx", cost: { sapphire: 1, emerald: 4, ruby: 2 } },
    { id: "t2_04", point: 2, gem: "onyx", cost: { emerald: 5, ruby: 3 } },
    { id: "t2_05", point: 2, gem: "onyx", cost: { diamond: 5 } },
    { id: "t2_06", point: 3, gem: "onyx", cost: { onyx: 6 } },
    // Blue (sapphire)
    { id: "t2_07", point: 1, gem: "sapphire", cost: { sapphire: 2, emerald: 2, ruby: 3 } },
    { id: "t2_08", point: 1, gem: "sapphire", cost: { onyx: 3, sapphire: 2, emerald: 3 } },
    { id: "t2_09", point: 2, gem: "sapphire", cost: { sapphire: 3, diamond: 5 } },
    { id: "t2_10", point: 2, gem: "sapphire", cost: { onyx: 4, ruby: 1, diamond: 2 } },
    { id: "t2_11", point: 2, gem: "sapphire", cost: { sapphire: 5 } },
    { id: "t2_12", point: 3, gem: "sapphire", cost: { sapphire: 6 } },
    // White (diamond)
    { id: "t2_13", point: 1, gem: "diamond", cost: { onyx: 2, emerald: 3, ruby: 2 } },
    { id: "t2_14", point: 1, gem: "diamond", cost: { sapphire: 3, ruby: 3, diamond: 2 } },
    { id: "t2_15", point: 2, gem: "diamond", cost: { onyx: 2, emerald: 1, ruby: 4 } },
    { id: "t2_16", point: 2, gem: "diamond", cost: { onyx: 3, ruby: 5 } },
    { id: "t2_17", point: 2, gem: "diamond", cost: { ruby: 5 } },
    { id: "t2_18", point: 3, gem: "diamond", cost: { diamond: 6 } },
    // Green (emerald)
    { id: "t2_19", point: 1, gem: "emerald", cost: { emerald: 2, ruby: 3, diamond: 3 } },
    { id: "t2_20", point: 1, gem: "emerald", cost: { onyx: 2, sapphire: 3, diamond: 2 } },
    { id: "t2_21", point: 2, gem: "emerald", cost: { onyx: 1, sapphire: 2, diamond: 4 } },
    { id: "t2_22", point: 2, gem: "emerald", cost: { sapphire: 5, emerald: 3 } },
    { id: "t2_23", point: 2, gem: "emerald", cost: { emerald: 5 } },
    { id: "t2_24", point: 3, gem: "emerald", cost: { emerald: 6 } },
    // Red (ruby)
    { id: "t2_25", point: 1, gem: "ruby", cost: { onyx: 3, ruby: 2, diamond: 2 } },
    { id: "t2_26", point: 1, gem: "ruby", cost: { onyx: 3, sapphire: 3, ruby: 2 } },
    { id: "t2_27", point: 2, gem: "ruby", cost: { sapphire: 4, emerald: 2, diamond: 1 } },
    { id: "t2_28", point: 2, gem: "ruby", cost: { onyx: 5, diamond: 3 } },
    { id: "t2_29", point: 2, gem: "ruby", cost: { onyx: 5 } },
    { id: "t2_30", point: 3, gem: "ruby", cost: { ruby: 6 } }
];

const deckTier3 = [
    // Black (onyx)
    { id: "t3_01", point: 3, gem: "onyx", cost: { sapphire: 3, emerald: 5, ruby: 3, diamond: 3 } },
    { id: "t3_02", point: 4, gem: "onyx", cost: { ruby: 7 } },
    { id: "t3_03", point: 4, gem: "onyx", cost: { onyx: 3, emerald: 3, ruby: 6 } },
    { id: "t3_04", point: 5, gem: "onyx", cost: { onyx: 3, ruby: 7 } },
    // Blue (sapphire)
    { id: "t3_05", point: 3, gem: "sapphire", cost: { onyx: 5, emerald: 3, ruby: 3, diamond: 3 } },
    { id: "t3_06", point: 4, gem: "sapphire", cost: { diamond: 7 } },
    { id: "t3_07", point: 4, gem: "sapphire", cost: { onyx: 3, sapphire: 3, diamond: 6 } },
    { id: "t3_08", point: 5, gem: "sapphire", cost: { sapphire: 3, diamond: 7 } },
    // White (diamond)
    { id: "t3_09", point: 3, gem: "diamond", cost: { onyx: 3, sapphire: 3, emerald: 3, ruby: 5 } },
    { id: "t3_10", point: 4, gem: "diamond", cost: { onyx: 7 } },
    { id: "t3_11", point: 4, gem: "diamond", cost: { onyx: 6, ruby: 3, diamond: 3 } },
    { id: "t3_12", point: 5, gem: "diamond", cost: { onyx: 7, diamond: 3 } },
    // Green (emerald)
    { id: "t3_13", point: 3, gem: "emerald", cost: { onyx: 3, sapphire: 3, ruby: 3, diamond: 5 } },
    { id: "t3_14", point: 4, gem: "emerald", cost: { sapphire: 7 } },
    { id: "t3_15", point: 4, gem: "emerald", cost: { sapphire: 6, emerald: 3, diamond: 3 } },
    { id: "t3_16", point: 5, gem: "emerald", cost: { sapphire: 7, emerald: 3 } },
    // Red (ruby)
    { id: "t3_17", point: 3, gem: "ruby", cost: { onyx: 3, sapphire: 5, emerald: 3, diamond: 3 } },
    { id: "t3_18", point: 4, gem: "ruby", cost: { emerald: 7 } },
    { id: "t3_19", point: 4, gem: "ruby", cost: { sapphire: 3, emerald: 6, ruby: 3 } },
    { id: "t3_20", point: 5, gem: "ruby", cost: { emerald: 7, ruby: 3 } }
];

module.exports = { deckTier1, deckTier2, deckTier3 };