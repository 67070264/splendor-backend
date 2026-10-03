// ไฟล์: actions/nextTurn.js
function nextTurn(gameState) {
    // 1. เช็กว่ามีผู้เล่นคนไหนได้คะแนน >= 15 หรือยัง
    const hasWinner = gameState.players.some(p => p.score >= 15);
    if (hasWinner) {
        gameState.isLastRound = true; // เปิดโหมดรอบสุดท้าย
    }

    // 2. เปลี่ยนเทิร์นให้คนถัดไป
    gameState.currentTurnIndex = (gameState.currentTurnIndex + 1) % gameState.players.length;

    // 3. ถ้าเป็นรอบสุดท้าย แล้วตาเล่นวนกลับมาที่คนแรกสุด (Index 0) -> จบเกม!
    if (gameState.isLastRound && gameState.currentTurnIndex === 0) {
        gameState.status = "finished"; 
    }
}

module.exports = nextTurn;