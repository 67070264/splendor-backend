require('dotenv').config();

const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

// นำเข้า Logic กติกา
const takeGems = require('./actions/takeGems');
const buyCard = require('./actions/buyCard'); 
const reserveCard = require('./actions/reserveCard'); 
const nextTurn = require('./actions/nextTurn');

// 🌟 นำเข้าข้อมูลการ์ดและขุนนาง
const { deckTier1, deckTier2, deckTier3 } = require('./data/cards');
const noblesData = require('./data/nobles');

// 🌟 ฟังก์ชันสำหรับสับไพ่ (ใช้ Fisher-Yates Algorithm)
function shuffle(array) {
    let currentIndex = array.length, randomIndex;
    while (currentIndex !== 0) {
        randomIndex = Math.floor(Math.random() * currentIndex);
        currentIndex--;
        [array[currentIndex], array[randomIndex]] = [array[randomIndex], array[currentIndex]];
    }
    return array;
}

const app = express();
app.use(cors());

app.get('/', (req, res) => res.send('🟢 Splendor Server: Online'));

const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

// 🌟 ตัวแปรหลักสำหรับเก็บข้อมูลทุกห้องในเซิร์ฟเวอร์
const gameRooms = {}; 

// ฟังก์ชันสุ่มรหัสห้อง 6 หลัก
function generateRoomCode() {
    return Math.floor(100000 + Math.random() * 900000).toString();
}

io.on('connection', (socket) => {
    console.log(`🟢 เชื่อมต่อ: ${socket.id}`);

    // ----- [หมวด: จัดการห้อง (Lobby)] -----
    
    // 1. สร้างห้องใหม่
    socket.on('createRoom', (playerName) => {
        const roomId = generateRoomCode();
        
        // สร้างกระดานเริ่มต้นสำหรับห้องนี้ (จำลองข้อมูลไปก่อน เดี๋ยวเรามาทำฟังก์ชันแจกไพ่จริงทีหลัง)
        gameRooms[roomId] = {
            roomId: roomId,
            status: 'waiting', 
            isLastRound: false,
            currentTurnIndex: 0,
            board: {
                tokens: { diamond: 7, sapphire: 7, emerald: 7, ruby: 7, onyx: 7, gold: 5 },
                cardsOnBoard: { tier1: [], tier2: [], tier3: [] },
                decks: { tier1: [], tier2: [], tier3: [] },
                nobles: []
            },
            players: []
        };

        // จับคนสร้างเข้าห้องเป็น Player 1
        const newPlayer = {
            id: socket.id,
            name: playerName || "Player 1",
            score: 0,
            tokens: { diamond: 0, sapphire: 0, emerald: 0, ruby: 0, onyx: 0, gold: 0 },
            bonuses: { diamond: 0, sapphire: 0, emerald: 0, ruby: 0, onyx: 0 },
            nobles: [],
            reservedCards: []
        };
        gameRooms[roomId].players.push(newPlayer);

        socket.join(roomId);
        console.log(`🏠 ${newPlayer.name} สร้างห้อง ${roomId}`);
        
        // ส่งรหัสห้องกลับไปให้คนสร้าง
        socket.emit('roomCreated', { roomId, gameState: gameRooms[roomId] });
    });

    // 2. เข้าร่วมห้อง
    socket.on('joinRoom', (data) => {
        const { roomId, playerName } = data;
        const room = gameRooms[roomId];

        if (!room) return socket.emit('errorMsg', '❌ ไม่พบห้องเกมนี้');
        if (room.status !== 'waiting') return socket.emit('errorMsg', '❌ เกมเริ่มไปแล้ว');
        if (room.players.length >= 4) return socket.emit('errorMsg', '❌ ห้องเต็มแล้ว');

        const newPlayer = {
            id: socket.id,
            name: playerName || `Player ${room.players.length + 1}`,
            score: 0,
            tokens: { diamond: 0, sapphire: 0, emerald: 0, ruby: 0, onyx: 0, gold: 0 },
            bonuses: { diamond: 0, sapphire: 0, emerald: 0, ruby: 0, onyx: 0 },
            nobles: [],
            reservedCards: []
        };
        
        room.players.push(newPlayer);
        socket.join(roomId);
        console.log(`🚶‍♂️ ${newPlayer.name} เข้าห้อง ${roomId}`);

        // 🌟 สำคัญ: ใช้ io.to(roomId) เพื่อส่งอัปเดตให้เฉพาะคนในห้องนี้เห็นว่ามีคนเข้าใหม่
        io.to(roomId).emit('updateBoard', room); 
    });

    // 🌟 3. เริ่มเกม (แจกไพ่, สุ่มขุนนาง, เซ็ตเหรียญ)
    socket.on('startGame', (roomId) => {
        const room = gameRooms[roomId];
        
        if (!room) return socket.emit('errorMsg', '❌ ไม่พบห้อง');
        if (room.status !== 'waiting') return socket.emit('errorMsg', '❌ เกมเริ่มไปแล้ว');
        if (room.players.length < 2) return socket.emit('errorMsg', '❌ ต้องมีผู้เล่นอย่างน้อย 2 คนถึงจะเริ่มเกมได้');

        room.status = 'playing';

        // 3.1 กำหนดจำนวนเหรียญกองกลางตามจำนวนผู้เล่น (2 คน=4, 3 คน=5, 4 คน=7)
        const playerCount = room.players.length;
        let tokenCount = 7;
        if (playerCount === 2) tokenCount = 4;
        if (playerCount === 3) tokenCount = 5;

        room.board.tokens = { 
            diamond: tokenCount, sapphire: tokenCount, emerald: tokenCount, 
            ruby: tokenCount, onyx: tokenCount, gold: 5 
        };

        // 3.2 สับไพ่ทั้งหมด (ต้องใส่ [...] เพื่อ Copy ข้อมูล ไม่ให้กระทบห้องอื่น)
        room.board.decks.tier1 = shuffle([...deckTier1]);
        room.board.decks.tier2 = shuffle([...deckTier2]);
        room.board.decks.tier3 = shuffle([...deckTier3]);
        
        // 3.3 สุ่มขุนนาง จำนวน = ผู้เล่น + 1
        const shuffledNobles = shuffle([...noblesData]);
        room.board.nobles = shuffledNobles.slice(0, playerCount + 1);

        // 3.4 ดึงไพ่ 4 ใบแรกจากกองจั่ว มาวางหงายบนกระดาน
        room.board.cardsOnBoard.tier1 = room.board.decks.tier1.splice(0, 4);
        room.board.cardsOnBoard.tier2 = room.board.decks.tier2.splice(0, 4);
        room.board.cardsOnBoard.tier3 = room.board.decks.tier3.splice(0, 4);

        console.log(`🎲 ห้อง ${roomId} เริ่มเกมแล้ว!`);
        
        // ประกาศบอกทุกคนในห้องว่ากระดานพร้อมแล้ว!
        io.to(roomId).emit('updateBoard', room);
        io.to(roomId).emit('gameStarted', 'เกมเริ่มแล้ว! ลุยเลย!');
    });

    // ----- [หมวด: แอ็กชันกติกาเกม (แก้ให้ใช้ RoomId)] -----
    
    socket.on('playerTakeGems', (data) => {
        const room = gameRooms[data.roomId];
        if (!room) return socket.emit('errorMsg', 'Session หมดอายุ');
        
        const result = takeGems(room, data.playerId, data.selectedGems);
        if (result.success) io.to(data.roomId).emit('updateBoard', result.gameState); 
        else socket.emit('errorMsg', result.message);
    });

    socket.on('buyCard', (data) => {
        const room = gameRooms[data.roomId];
        if (!room) return;
        
        const result = buyCard(room, data.playerId, data.cardId, data.tier);
        if (result.success) io.to(data.roomId).emit('updateBoard', result.gameState); 
        else socket.emit('errorMsg', result.message);
    });

    socket.on('reserveCard', (data) => {
        const room = gameRooms[data.roomId];
        if (!room) return;

        const result = reserveCard(room, data.playerId, data.cardId, data.tier);
        if (result.success) io.to(data.roomId).emit('updateBoard', result.gameState); 
        else socket.emit('errorMsg', result.message);
    });

    socket.on('forceWin', (roomId) => {
        const room = gameRooms[roomId];
        if (!room) return;
        
        const player = room.players.find(p => p.id === socket.id);
        if (player) {
            player.score = 15; // เสก 15 แต้มทันที
            console.log(`🔥 ${player.name} ใช้สูตรโกงคะแนนเต็ม 15!`);
            
            // เรียกฟังก์ชันเปลี่ยนเทิร์น (เพื่อเช็กเงื่อนไขจบเกม)
            nextTurn(room);
            io.to(roomId).emit('updateBoard', room); 
            
            // ดักเงื่อนไขจบเกมเหมือนตอนซื้อการ์ด
            if (room.status === "finished") {
                console.log(`🏆 ห้อง ${roomId} เล่นจบแล้ว!`);
                io.to(roomId).emit('gameOver', room); 
                
                // เรียกใช้ฟังก์ชันเซฟลงฐานข้อมูลที่ดึงมาจาก db.js
                const { saveMatchHistory } = require('./db');
                saveMatchHistory(room); 
                
                delete gameRooms[roomId]; 
            }
        }
    });

    socket.on('disconnect', () => {
        console.log(`🔴 หลุดการเชื่อมต่อ: ${socket.id}`);
        // วนลูปหาว่าคนที่หลุด ซ่อนอยู่ในห้องไหน
        for (const roomId in gameRooms) {
            const room = gameRooms[roomId];
            const playerIndex = room.players.findIndex(p => p.id === socket.id);
            
            // ถ้าเจอตัวคนหลุดในห้องนี้
            if (playerIndex !== -1) {
                const playerName = room.players[playerIndex].name;
                
                // 1. ลบผู้เล่นคนนั้นออกจาก Array
                room.players.splice(playerIndex, 1);
                console.log(`👋 ${playerName} หลุดออกจากห้อง ${roomId}`);
                
                // 2. เช็กว่าห้องว่างไหม ถ้าว่างให้ลบห้องทิ้งเพื่อคืน RAM ให้เซิร์ฟเวอร์
                if (room.players.length === 0) {
                    delete gameRooms[roomId];
                    console.log(`🗑️ ลบห้อง ${roomId} ทิ้งเพราะไม่มีคนอยู่แล้ว`);
                } else {
                    // 3. ถ้ายังมีคนเหลืออยู่ ให้อัปเดตกระดานใหม่ และแจ้งเตือนคนที่เหลือ
                    io.to(roomId).emit('updateBoard', room);
                    io.to(roomId).emit('errorMsg', `⚠️ ${playerName} หลุดออกจากห้อง`);
                }
                break; // ทำงานเสร็จแล้ว ออกจากลูปได้เลย
            }
        }
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`🚀 Game Server รันอยู่บนพอร์ต ${PORT}`));