const nextTurn = require('./nextTurn');

function buyCard(gameState, playerId, cardId, tier) {
    const playerIndex = gameState.players.findIndex(p => p.id === playerId);
    if (playerIndex === -1) return { success: false, message: "ไม่พบผู้เล่น" };
    
    const player = gameState.players[playerIndex];

    if (gameState.currentTurnIndex !== playerIndex) {
        return { success: false, message: "ยังไม่ถึงเทิร์นของคุณ" };
    }

    // 1. ค้นหาการ์ดบนกระดานตาม Tier ที่ส่งมา
    const cardList = gameState.board.cardsOnBoard[`tier${tier}`];
    const cardIndex = cardList.findIndex(c => c.id === cardId);
    
    if (cardIndex === -1) {
        return { success: false, message: "ไม่พบการ์ดใบนี้บนกระดาน" };
    }
    
    const card = cardList[cardIndex];

    // 2. คำนวณราคาที่ต้องจ่ายจริง (ราคาการ์ด - การ์ดโบนัสที่มี)
    let tokensToPay = { diamond: 0, sapphire: 0, emerald: 0, ruby: 0, onyx: 0 };
    let goldNeeded = 0; // จำนวนเหรียญทอง(Joker)ที่ต้องใช้เผื่อเหรียญสีไม่พอ

    for (const color in card.cost) {
        const costAmount = card.cost[color];
        const bonusAmount = player.bonuses[color];
        const tokenAmount = player.tokens[color];

        // หักลบโบนัสก่อน
        const remainingCost = Math.max(0, costAmount - bonusAmount);

        // ถ้าเหรียญสีนั้นมีไม่พอ ให้หักเหรียญสีนั้นให้หมด แล้วทดส่วนที่ขาดเป็นเหรียญทอง
        if (tokenAmount < remainingCost) {
            tokensToPay[color] = tokenAmount; // จ่ายหมดหน้าตักสำหรับสีนี้
            goldNeeded += (remainingCost - tokenAmount); // ขาดอีกเท่าไหร่ไปหักทองเอา
        } else {
            tokensToPay[color] = remainingCost; // จ่ายตามจริงที่เหลือ
        }
    }

    // 3. เช็กว่าเหรียญทองในมือมีพอจ่ายส่วนที่ขาดไหม
    if (player.tokens.gold < goldNeeded) {
        return { success: false, message: "เหรียญไม่พอซื้อการ์ดใบนี้" };
    }

    // 4. หักเหรียญจากผู้เล่น คืนสู่กองกลาง
    for (const color in tokensToPay) {
        player.tokens[color] -= tokensToPay[color];
        gameState.board.tokens[color] += tokensToPay[color];
    }
    
    if (goldNeeded > 0) {
        player.tokens.gold -= goldNeeded;
        gameState.board.tokens.gold += goldNeeded;
    }

    // 5. นำการ์ดเข้าตัว (เพิ่มคะแนน และ โบนัส)
    player.score += card.point;
    player.bonuses[card.gem] += 1;

    // 6. ลบการ์ดใบนี้ออกจากกระดาน (ในอนาคตคุณค่อยเขียนโค้ดจั่วการ์ดใบใหม่มาเสียบแทน)
    cardList.splice(cardIndex, 1);

    // 🌟 6.1 ระบบจั่วการ์ดอัตโนมัติมาเติมกระดาน
    const deck = gameState.board.decks[`tier${tier}`]; // ชี้ไปที่สำรับของ Tier นั้น
    if (deck && deck.length > 0) {
        const newCard = deck.shift(); // ดึงการ์ดใบบนสุด (ใบแรกสุดใน Array) ออกจากสำรับ
        cardList.push(newCard);       // เอาการ์ดใบใหม่ไปวางบนกระดานแทนที่
    }

    // 🌟 6.5 ระบบขุนนางเสด็จ (Noble Visits)
    const nobleIndex = gameState.board.nobles.findIndex(noble => {
        // เช็กว่าโบนัสในมือผู้เล่น มีมากกว่าหรือเท่ากับเงื่อนไขของขุนนางทุกสีหรือไม่
        return Object.keys(noble.requirement).every(color => 
            player.bonuses[color] >= noble.requirement[color]
        );
    });

    if (nobleIndex !== -1) {
        // ถ้าเงื่อนไขผ่าน ดึงขุนนางออกจากกระดานไปเข้าตัวผู้เล่น
        const visitingNoble = gameState.board.nobles.splice(nobleIndex, 1)[0];
        player.nobles.push(visitingNoble);
        player.score += visitingNoble.point; // บวกคะแนนขุนนางเพิ่มไปอีก 3 แต้ม
    }

    // 7. เปลี่ยนเทิร์น
    nextTurn(gameState);

    return { success: true, message: "สำเร็จ", gameState: gameState };
}

module.exports = buyCard;