module.exports = function reserveCard(room, playerId, tier, cardIndex) {
    const player = room.players.find(p => p.id === playerId);
    if (!player) return { success: false, message: "ไม่พบผู้เล่น" };

    if (player.reservedCards.length >= 3) {
        return { success: false, message: "จองการ์ดได้สูงสุด 3 ใบเท่านั้น" };
    }

    const targetTier = String(tier).includes('tier') ? tier : `tier${tier}`;
    let cardToReserve;

    if (cardIndex === -1) {
        const deck = room.board.decks[targetTier];
        if (!deck || deck.length === 0) return { success: false, message: "กองการ์ดนี้หมดแล้ว" };
        cardToReserve = deck.shift();
    } else {
        const cardList = room.board.cardsOnBoard[targetTier];
        if (!cardList || !cardList[cardIndex]) {
            return { success: false, message: "ไม่พบการ์ดบนกระดาน" };
        }
        
        cardToReserve = cardList[cardIndex];
        
        const deck = room.board.decks[targetTier];
        if (deck && deck.length > 0) {
            cardList[cardIndex] = deck.shift();
        } else {
            cardList.splice(cardIndex, 1); 
        }
    }

    if (room.board.tokens.gold > 0) {
        room.board.tokens.gold -= 1;
        player.tokens.gold = (player.tokens.gold || 0) + 1;
    }

    player.reservedCards.push(cardToReserve);
    room.currentTurnIndex = (room.currentTurnIndex + 1) % room.players.length;

    return { success: true, gameState: room };
};