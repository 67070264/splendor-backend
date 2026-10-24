require('dotenv').config();

const path = require('path');
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

// ดึงข้อมูลการ์ดและขุนนางจากโฟลเดอร์ data
const cardsData = require('./data/cards');
const noblesData = require('./data/nobles');
// นำเข้า Logic กติกา
const takeGems = require('./actions/takeGems');
const buyCard = require('./actions/buyCard');
const reserveCard = require('./actions/reserveCard');
const nextTurn = require('./actions/nextTurn');
const app = express();

const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const { DynamoDBDocumentClient, PutCommand, GetCommand } = require("@aws-sdk/lib-dynamodb");

// 🌟 ย้าย CORS ขึ้นมาไว้บนสุด เพื่อให้ Amplify ยิง API ข้ามโดเมนมาที่ EC2 ได้
app.use(cors());
// บังคับให้ Express อ่านข้อมูล JSON ที่ส่งมาจาก Frontend ได้
app.use(express.json());

// ตั้งค่าเชื่อมต่อ DynamoDB (Region ต้องตรงกับที่ทีมคลาวด์สร้างไว้)
const client = new DynamoDBClient({ region: "ap-southeast-1" });
const docClient = DynamoDBDocumentClient.from(client);

// ---------------------------------------------------------
// 🌟 API สำหรับสมัครสมาชิก (Register)
// ---------------------------------------------------------
app.post('/api/register', async (req, res) => {
    const { email, password, playerName } = req.body;

    try {
        // เช็กก่อนว่ามีอีเมลนี้ในระบบหรือยัง
        const checkCommand = new GetCommand({
            TableName: "SplendorUsers",
            Key: { email: email }
        });
        const existingUser = await docClient.send(checkCommand);

        if (existingUser.Item) {
            return res.status(400).json({ error: "อีเมลนี้เคยลงทะเบียนไว้แล้ว" });
        }

        // บันทึกผู้ใช้ใหม่ลง DynamoDB
        const putCommand = new PutCommand({
            TableName: "SplendorUsers",
            Item: {
                email: email,
                password: password, // โปรเจกต์จริงควรเข้ารหัส (Hash) ก่อนเก็บ
                playerName: playerName
            }
        });
        await docClient.send(putCommand);
        res.status(200).json({ message: "Register Success" });
    } catch (error) {
        console.error("DynamoDB Register Error:", error);
        res.status(500).json({ error: "Failed to register" });
    }
});

// ---------------------------------------------------------
// 🌟 API สำหรับเข้าสู่ระบบ (Login)
// ---------------------------------------------------------
app.post('/api/login', async (req, res) => {
    const { identifier, password } = req.body; // identifier คือ อีเมลหรือชื่อผู้ใช้

    try {
        const command = new GetCommand({
            TableName: "SplendorUsers",
            Key: { email: identifier } // ค้นหาด้วยอีเมล
        });

        const response = await docClient.send(command);
        const user = response.Item;

        if (user && user.password === password) {
            res.status(200).json({ message: "Login Success", playerName: user.playerName });
        } else {
            res.status(401).json({ error: "ชื่อผู้ใช้/อีเมล หรือรหัสผ่านไม่ถูกต้อง" });
        }
    } catch (error) {
        console.error("DynamoDB Login Error:", error);
        res.status(500).json({ error: "Failed to login" });
    }
});

// ❌ ลบ app.use(express.static(...)) และ app.get('/', ...) ทิ้งไปเรียบร้อยแล้ว

// ฟังก์ชันสำหรับสับไพ่
function shuffle(array) {
    let currentIndex = array.length, randomIndex;
    while (currentIndex !== 0) {
        randomIndex = Math.floor(Math.random() * currentIndex);
        currentIndex--;
        [array[currentIndex], array[randomIndex]] = [array[randomIndex], array[currentIndex]];
    }
    return array;
}

const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

// ตัวแปรหลักสำหรับเก็บข้อมูลทุกห้องในเซิร์ฟเวอร์
const gameRooms = {};

// ฟังก์ชันสุ่มรหัสห้อง 6 หลัก
function generateRoomCode() {
    return Math.floor(100000 + Math.random() * 900000).toString();
}

// 🌟 ฟังก์ชันกระจายรายการห้องทั้งหมดให้คนหน้า Dashboard เห็นตรงกัน
function broadcastRoomList() {
    const roomsList = Object.values(gameRooms)
        .filter(room => room.status === 'waiting')
        .map(room => ({
            code: room.roomId,
            current_players: room.players.filter(p => p.isConnected).length, // นับเฉพาะคนที่เชื่อมต่อ
            max_players: room.maxPlayers || 4
        }));

    console.log("📢 [Dashboard] ส่งรายการห้องไปที่ล็อบบี้:", roomsList);
    io.emit('roomListUpdate', roomsList);
}

io.on('connection', (socket) => {
    console.log(`🟢 เชื่อมต่อ: ${socket.id}`);

    // ----- [หมวด: จัดการห้อง (Lobby)] -----

    socket.on('getRoomList', () => {
        broadcastRoomList();
    });

    socket.on('createRoom', (data) => {
        const playerName = typeof data === 'object' ? data.playerName : data;
        const maxPlayers = typeof data === 'object' ? (data.maxPlayers || 4) : 4;
        const roomId = generateRoomCode();

        gameRooms[roomId] = {
            roomId: roomId,
            maxPlayers: maxPlayers,
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

        const newPlayer = {
            id: socket.id,
            name: playerName || "Player 1",
            isConnected: true,
            score: 0,
            tokens: { diamond: 0, sapphire: 0, emerald: 0, ruby: 0, onyx: 0, gold: 0 },
            bonuses: { diamond: 0, sapphire: 0, emerald: 0, ruby: 0, onyx: 0 },
            nobles: [],
            reservedCards: []
        };
        gameRooms[roomId].players.push(newPlayer);

        socket.join(roomId);
        console.log(`🏠 ${newPlayer.name} สร้างห้อง ${roomId}`);

        broadcastRoomList();
        socket.emit('roomCreated', { roomId, playerName: newPlayer.name, gameState: gameRooms[roomId] });
    });

    socket.on('checkActiveGame', (playerName) => {
        console.log(`🔍 [เช็กเกมค้าง] กำลังค้นหาข้อมูลของ: ${playerName}`);
        for (const roomId in gameRooms) {
            const room = gameRooms[roomId];
            const playerExists = room.players.some(p => p.name === playerName);

            if (playerExists && room.status === 'playing') {
                console.log(`✅ [เช็กเกมค้าง] เจอผู้เล่น ${playerName} ในห้อง ${roomId} -> ส่งแจ้งเตือน!`);
                socket.emit('reconnectGame', roomId);
                return;
            }
        }
        console.log(`❌ [เช็กเกมค้าง] ไม่พบเกมค้างของ ${playerName}`);
    });

    socket.on('joinRoom', ({ roomId, playerName }) => {
        const room = gameRooms[roomId];
        if (!room) {
            socket.emit('errorMsg', 'ไม่พบห้องนี้ หรือห้องถูกปิดไปแล้ว');
            return;
        }

        const existingPlayer = room.players.find(p => p.name === playerName);

        if (existingPlayer) {
            existingPlayer.id = socket.id;
            existingPlayer.isConnected = true;
            socket.join(roomId);
            console.log(`🔄 ${playerName} Reconnect กลับเข้าห้อง ${roomId}`);
        } else {
            if (room.status === 'playing') {
                socket.emit('errorMsg', 'เกมนี้เริ่มไปแล้ว ไม่สามารถเข้าร่วมได้');
                return;
            }
            if (room.players.length >= room.maxPlayers) {
                socket.emit('errorMsg', 'ห้องเต็มแล้ว');
                return;
            }

            room.players.push({
                id: socket.id,
                name: playerName,
                isConnected: true,
                score: 0,
                tokens: { diamond: 0, sapphire: 0, emerald: 0, ruby: 0, onyx: 0, gold: 0 },
                bonuses: { diamond: 0, sapphire: 0, emerald: 0, ruby: 0, onyx: 0 },
                reservedCards: [],
                cards: [],
                nobles: []
            });
            socket.join(roomId);
            console.log(`🟢 ${playerName} เข้าร่วมห้อง ${roomId}`);
        }

        io.to(roomId).emit('updateBoard', room);
        broadcastRoomList();
    });

    socket.on('startGame', (roomId) => {
        const room = gameRooms[roomId];

        if (!room) return socket.emit('errorMsg', '❌ ไม่พบห้อง');
        if (room.status !== 'waiting') return socket.emit('errorMsg', '❌ เกมเริ่มไปแล้ว');
        if (room.players.length < 2) return socket.emit('errorMsg', '❌ ต้องมีผู้เล่นอย่างน้อย 2 คน');

        room.status = 'playing';

        const playerCount = room.players.length;
        let tokenCount = 7;
        if (playerCount === 2) tokenCount = 4;
        if (playerCount === 3) tokenCount = 5;

        room.board.tokens = {
            diamond: tokenCount, sapphire: tokenCount, emerald: tokenCount,
            ruby: tokenCount, onyx: tokenCount, gold: 5
        };

        room.board.decks.tier1 = shuffle([...cardsData.deckTier1]);
        room.board.decks.tier2 = shuffle([...cardsData.deckTier2]);
        room.board.decks.tier3 = shuffle([...cardsData.deckTier3]);

        const shuffledNobles = shuffle([...noblesData]);
        room.board.nobles = shuffledNobles.slice(0, playerCount + 1);

        room.board.cardsOnBoard.tier1 = room.board.decks.tier1.splice(0, 4);
        room.board.cardsOnBoard.tier2 = room.board.decks.tier2.splice(0, 4);
        room.board.cardsOnBoard.tier3 = room.board.decks.tier3.splice(0, 4);

        console.log(`🎲 ห้อง ${roomId} เริ่มเกมแล้ว!`);

        broadcastRoomList(); 
        io.to(roomId).emit('updateBoard', room);
        io.to(roomId).emit('gameStarted', 'เกมเริ่มแล้ว! ลุยเลย!');
    });

    // ----- [หมวด: แอ็กชันกติกาเกม] -----
    socket.on('playerTakeGems', (data) => {
        const room = gameRooms[data.roomId];
        if (!room) return;
        const result = takeGems(room, socket.id, data.selectedGems);
        if (result.success) io.to(data.roomId).emit('updateBoard', result.gameState);
        else socket.emit('errorMsg', result.message);
    });

    socket.on('buyCard', (data) => {
        const room = gameRooms[data.roomId];
        if (!room) return;
        const result = buyCard(room, socket.id, data.tier, data.cardIndex, data.isReserved);
        if (result.success) io.to(data.roomId).emit('updateBoard', result.gameState);
        else socket.emit('errorMsg', result.message);
    });

    socket.on('reserveCard', (data) => {
        const room = gameRooms[data.roomId];
        if (!room) return;
        const result = reserveCard(room, socket.id, data.tier, data.cardIndex);
        if (result.success) io.to(data.roomId).emit('updateBoard', result.gameState);
        else socket.emit('errorMsg', result.message);
    });

    socket.on('disconnect', () => {
        console.log('🔴 คอนเนคชั่นหลุด:', socket.id);
        for (const roomId in gameRooms) {
            const room = gameRooms[roomId];
            const playerIndex = room.players.findIndex(p => p.id === socket.id);

            if (playerIndex !== -1) {
                room.players[playerIndex].isConnected = false;

                if (room.status === 'waiting') {
                    room.players.splice(playerIndex, 1);
                }

                setTimeout(() => {
                    if (gameRooms[roomId]) {
                        const activePlayers = gameRooms[roomId].players.filter(p => p.isConnected);
                        if (activePlayers.length === 0) {
                            delete gameRooms[roomId];
                            console.log(`🗑️ ลบห้อง ${roomId} ทิ้งเพราะไม่มีคนอยู่แล้ว`);
                        }
                    }
                    broadcastRoomList();
                }, 60000);

                io.to(roomId).emit('updateBoard', room);
                break;
            }
        }
    });
});

const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
    console.log(`🚀 Server is running on port ${PORT}`);
});