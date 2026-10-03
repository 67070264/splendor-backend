const nextTurn = require('./nextTurn');

// ฟังก์ชันจัดการการหยิบเหรียญ
function takeGems(gameState, playerId, selectedGems) {
    // selectedGems คือ Array ที่ส่งมาจากหน้าบ้าน เช่น ['diamond', 'sapphire', 'ruby'] หรือ ['diamond', 'diamond']
    
    // 1. หาตำแหน่งของผู้เล่นใน Array
    const playerIndex = gameState.players.findIndex(p => p.id === playerId);
    if (playerIndex === -1) return { success: false, message: "ไม่พบผู้เล่น" };
    
    const player = gameState.players[playerIndex];

    // 2. เช็กว่าเป็นเทิร์นของผู้เล่นคนนี้หรือไม่
    if (gameState.currentTurnIndex !== playerIndex) {
        return { success: false, message: "ยังไม่ถึงเทิร์นของคุณ" };
    }

    // 3. ห้ามหยิบเหรียญทองโดยตรงจากการ Take Gems
    if (selectedGems.includes('gold')) {
        return { success: false, message: "ไม่สามารถหยิบเหรียญทองได้โดยตรง" };
    }

    const totalRequested = selectedGems.length;

    // 4. เช็กจำนวนเหรียญ (ต้องหยิบ 2 หรือ 3 เหรียญเท่านั้น)[cite: 36]
    if (totalRequested !== 2 && totalRequested !== 3) {
        return { success: false, message: "You can only take 2 or 3 gems." }; // Exception Flow 1[cite: 36]
    }

    // 5. เช็กว่าหยิบแล้วเหรียญในมือรวมกันเกิน 10 เหรียญหรือไม่[cite: 36]
    const currentTotalTokens = Object.values(player.tokens).reduce((sum, val) => sum + val, 0);
    if (currentTotalTokens + totalRequested > 10) {
        return { success: false, message: "Please return tokens until you have a maximum of 10 tokens." }; // Exception Flow 2[cite: 36]
    }

    // 6. กติกาสำหรับการหยิบ 3 เหรียญ (ต้องต่างสีกัน)[cite: 36]
    if (totalRequested === 3) {
        const uniqueGems = new Set(selectedGems);
        if (uniqueGems.size !== 3) {
            return { success: false, message: "Please take 3 gems of different colors." }; // Exception Flow 5[cite: 37]
        }
        // เช็กว่ากองกลางมีเหรียญพอให้หยิบไหม
        for (let color of selectedGems) {
            if (gameState.board.tokens[color] < 1) {
                return { success: false, message: `เหรียญสี ${color} ในกองกลางหมดแล้ว` };
            }
        }
    } 
    // 7. กติกาสำหรับการหยิบ 2 เหรียญ (ต้องสีเดียวกัน และกองนั้นต้องมี >= 4)[cite: 36, 37]
    else if (totalRequested === 2) {
        if (selectedGems[0] !== selectedGems[1]) {
            return { success: false, message: "Please take 2 gems of the same color." }; // Exception Flow 4[cite: 37]
        }
        const color = selectedGems[0];
        if (gameState.board.tokens[color] < 4) {
            return { success: false, message: "You cannot take 2 gems from this pile. Please choose another pile or take 3 gems." }; // Exception Flow 3[cite: 37]
        }
    }

    // 8. ถ่าผ่านทุกด่าน ให้หักเหรียญจากกองกลาง และเพิ่มเข้ามือผู้เล่น
    selectedGems.forEach(color => {
        gameState.board.tokens[color] -= 1;
        player.tokens[color] += 1;
    });

    // 9. จบเทิร์น เปลี่ยนตาให้ผู้เล่นคนถัดไป
    nextTurn(gameState);

    return { success: true, message: "สำเร็จ", gameState: gameState };
}

module.exports = takeGems;