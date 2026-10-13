const nextTurn = require('./nextTurn');

function buyCard(gameState, playerId, tier, cardIndex, isReserved) {
    const playerIndex = gameState.players.findIndex(p => p.id === playerId);
    if (playerIndex === -1) return { success: false, message: "ไม่พบผู้เล่น" };
    
    const player = gameState.players[playerIndex];

    if (gameState.currentTurnIndex !== playerIndex) {
        return { success: false, message: "ยังไม่ถึงเทิร์นของคุณ" };
    }

    let card;
    const targetTier = String(tier).includes('tier') ? tier : `tier${tier}`;

    // 1. ค้นหาการ์ด (แยกกรณีระหว่างการ์ดบนกระดาน กับ การ์ดที่จองไว้)
    if (isReserved) {
        if (!player.reservedCards || !player.reservedCards[cardIndex]) {
            return { success: false, message: "ไม่พบการ์ดที่จองไว้" };
        }
        card = player.reservedCards[cardIndex];
    } else {
        const cardList = gameState.board.cardsOnBoard[targetTier];
        if (!cardList || !cardList[cardIndex]) {
            return { success: false, message: "ไม่พบการ์ดใบนี้บนกระดาน" };
        }
        card = cardList[cardIndex];
    }

    // 2. คำนวณราคาที่ต้องจ่ายจริง (ราคาการ์ด - การ์ดโบนัสที่มี)[cite: 12]
    let tokensToPay = { diamond: 0, sapphire: 0, emerald: 0, ruby: 0, onyx: 0 };
    let goldNeeded = 0; 

    for (const color in card.cost) {
        const costAmount = card.cost[color];
        const bonusAmount = player.bonuses[color] || 0;
        const tokenAmount = player.tokens[color] || 0;

        const remainingCost = Math.max(0, costAmount - bonusAmount);

        if (tokenAmount < remainingCost) {
            tokensToPay[color] = tokenAmount; 
            goldNeeded += (remainingCost - tokenAmount); 
        } else {
            tokensToPay[color] = remainingCost; 
        }
    }

    // 3. เช็กว่าเหรียญทองในมือมีพอจ่ายส่วนที่ขาดไหม[cite: 12]
    if ((player.tokens.gold || 0) < goldNeeded) {
        return { success: false, message: "เหรียญไม่พอซื้อการ์ดใบนี้" };
    }

    // 4. หักเหรียญจากผู้เล่น คืนสู่กองกลาง[cite: 12]
    for (const color in tokensToPay) {
        player.tokens[color] -= tokensToPay[color];
        gameState.board.tokens[color] += tokensToPay[color];
    }
    
    if (goldNeeded > 0) {
        player.tokens.gold -= goldNeeded;
        gameState.board.tokens.gold += goldNeeded;
    }

    // 5. นำการ์ดเข้าตัว (เพิ่มคะแนน และ โบนัส)[cite: 12]
    player.score = (player.score || 0) + (card.point || 0);
    player.bonuses[card.gem] = (player.bonuses[card.gem] || 0) + 1;
    
    if (!player.cards) player.cards = [];
    player.cards.push(card);

    // 6. ลบการ์ดใบนี้ออก และจั่วใบใหม่ (ถ้ามี)[cite: 12]
    if (isReserved) {
        player.reservedCards.splice(cardIndex, 1);
    } else {
        const cardList = gameState.board.cardsOnBoard[targetTier];
        const deck = gameState.board.decks[targetTier];
        
        if (deck && deck.length > 0) {
            cardList[cardIndex] = deck.shift(); 
        } else {
            cardList.splice(cardIndex, 1); 
        }
    }

    // 7. ระบบขุนนางเสด็จ (Noble Visits)[cite: 12]
    const nobleIndex = gameState.board.nobles.findIndex(noble => {
        return Object.keys(noble.requirement).every(color => 
            (player.bonuses[color] || 0) >= noble.requirement[color]
        );
    });

    if (nobleIndex !== -1) {
        const visitingNoble = gameState.board.nobles.splice(nobleIndex, 1)[0];
        player.nobles.push(visitingNoble);
        player.score += visitingNoble.point; 
    }

    // 8. เปลี่ยนเทิร์น[cite: 12]
    nextTurn(gameState);

    return { success: true, message: "สำเร็จ", gameState: gameState };
}

module.exports = buyCard;