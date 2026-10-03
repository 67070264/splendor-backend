const nextTurn = require('./nextTurn');

function reserveCard(gameState, playerId, cardId, tier) {
    const playerIndex = gameState.players.findIndex(p => p.id === playerId);
    if (playerIndex === -1) return { success: false, message: "ไม่พบผู้เล่น" };

    const player = gameState.players[playerIndex];

    // 1. เช็กเทิร์น
    if (gameState.currentTurnIndex !== playerIndex) {
        return { success: false, message: "ยังไม่ถึงเทิร์นของคุณ" };
    }

    // 2. เช็กโควต้าการจอง (กติกา: ห้ามจองเกิน 3 ใบ)
    if (player.reservedCards.length >= 3) {
        return { success: false, message: "คุณจองการ์ดครบ 3 ใบแล้ว ไม่สามารถจองเพิ่มได้" };
    }

    // 3. ค้นหาการ์ดบนกระดานตาม Tier
    const cardList = gameState.board.cardsOnBoard[`tier${tier}`];
    const cardIndex = cardList.findIndex(c => c.id === cardId);
    
    if (cardIndex === -1) {
        return { success: false, message: "ไม่พบการ์ดใบนี้บนกระดาน" };
    }

    const card = cardList[cardIndex];

    // 4. ย้ายการ์ดออกจากกระดานไปเข้า Array การ์ดที่จองไว้ของผู้เล่น
    cardList.splice(cardIndex, 1);
    player.reservedCards.push(card);

    // 🌟 4.1 ระบบจั่วการ์ดอัตโนมัติมาเติมกระดาน
    const deck = gameState.board.decks[`tier${tier}`]; 
    if (deck && deck.length > 0) {
        const newCard = deck.shift(); 
        cardList.push(newCard);       
    }

    // 5. แจกเหรียญทอง 1 เหรียญ (ถ้ากองกลางมี และเหรียญในมือผู้เล่นรวมกันยังไม่เกิน 10)
    const currentTotalTokens = Object.values(player.tokens).reduce((sum, val) => sum + val, 0);
    if (gameState.board.tokens.gold > 0 && currentTotalTokens < 10) {
        gameState.board.tokens.gold -= 1;
        player.tokens.gold += 1;
    }

    // 6. เปลี่ยนเทิร์น
    nextTurn(gameState);

    return { success: true, message: "สำเร็จ", gameState: gameState };
}

module.exports = reserveCard;