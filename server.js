require('dotenv').config();

const path = require('path');
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, GetCommand, PutCommand, ScanCommand } = require('@aws-sdk/lib-dynamodb');
const bcrypt = require('bcryptjs');

const dynamoClient = new DynamoDBClient({ region: 'us-east-1' });
const db = DynamoDBDocumentClient.from(dynamoClient);
const USERS_TABLE = 'SplendorUsers';


// ดึงข้อมูลการ์ดและขุนนางจากโฟลเดอร์ data
const cardsData = require('./data/cards');
const noblesData = require('./data/nobles');
// นำเข้า Logic กติกา
const takeGems = require('./actions/takeGems');
const buyCard = require('./actions/buyCard');
const reserveCard = require('./actions/reserveCard');
const nextTurn = require('./actions/nextTurn');
const app = express();

app.use(express.static(path.join(__dirname, 'Public')));

// นำเข้าข้อมูลการ์ดและขุนนาง

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

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
    // สั่ง Redirect ให้วิ่งไปหาไฟล์หน้า Login โดยตรง
    res.redirect('/splendor-frontend/login/index.html'); 
});

app.use('/splendor-frontend', express.static(path.join(__dirname, 'Public/splendor-frontend')));


// ===== User API: DynamoDB =====
app.post('/api/register', async (req, res) => {
    try {
        const email = String(req.body.email || '').trim().toLowerCase();
        const playerName = String(req.body.playerName || '').trim();
        const password = String(req.body.password || '');

        if (!email || !playerName || password.length < 6) {
            return res.status(400).json({
                error: 'กรุณากรอกอีเมล ชื่อผู้ใช้ และรหัสผ่านอย่างน้อย 6 ตัวอักษร'
            });
        }

        const existing = await db.send(new GetCommand({
            TableName: USERS_TABLE,
            Key: { email }
        }));

        if (existing.Item) {
            return res.status(409).json({ error: 'Email already registered' });
        }

        // ตรวจสอบชื่อผู้ใช้ซ้ำ เพื่อให้ล็อกอินด้วยชื่อผู้ใช้ได้ชัดเจน
        const names = await db.send(new ScanCommand({
            TableName: USERS_TABLE,
            ProjectionExpression: 'email, playerName'
        }));
        const duplicateName = (names.Items || []).some(
            user => String(user.playerName || '').toLowerCase() === playerName.toLowerCase()
        );

        if (duplicateName) {
            return res.status(409).json({ error: 'Username already registered' });
        }

        const passwordHash = await bcrypt.hash(password, 10);

        await db.send(new PutCommand({
            TableName: USERS_TABLE,
            Item: {
                email,
                playerName,
                passwordHash,
                createdAt: new Date().toISOString()
            },
            ConditionExpression: 'attribute_not_exists(email)'
        }));

        return res.status(201).json({
            success: true,
            message: 'Registration successful'
        });
    } catch (error) {
        if (error.name === 'ConditionalCheckFailedException') {
            return res.status(409).json({ error: 'Email already registered' });
        }
        console.error('[Register API]', error);
        return res.status(500).json({ error: 'Registration failed' });
    }
});

app.post('/api/login', async (req, res) => {
    try {
        const identifier = String(req.body.identifier || '').trim();
        const password = String(req.body.password || '');

        if (!identifier || !password) {
            return res.status(400).json({ error: 'กรุณากรอกชื่อผู้ใช้/อีเมลและรหัสผ่าน' });
        }

        let user;

        if (identifier.includes('@')) {
            const email = identifier.toLowerCase();
            const result = await db.send(new GetCommand({
                TableName: USERS_TABLE,
                Key: { email }
            }));
            user = result.Item;
        } else {
            const result = await db.send(new ScanCommand({
                TableName: USERS_TABLE,
                ProjectionExpression: 'email, playerName, passwordHash'
            }));
            user = (result.Items || []).find(
                item => String(item.playerName || '').toLowerCase() === identifier.toLowerCase()
            );
        }

        if (!user || !user.passwordHash || !(await bcrypt.compare(password, user.passwordHash))) {
            return res.status(401).json({ error: 'Invalid username/email or password' });
        }

        return res.json({
            success: true,
            playerName: user.playerName
        });
    } catch (error) {
        console.error('[Login API]', error);
        return res.status(500).json({ error: 'Login failed' });
    }
});
// ===== End User API =====

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

    // 🌟 พิมพ์ Log แจ้งเตือนว่าเซิร์ฟเวอร์ส่งข้อมูลอะไรไปบ้าง
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
            isConnected: true, // 🌟 เพิ่มสถานะว่ากำลังเชื่อมต่อ
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

            // หาว่ามีคนชื่อนี้อยู่ในห้องไหม
            const playerExists = room.players.some(p => p.name === playerName);

            // เช็กด้วยว่าเป็นห้องที่กำลังเล่นอยู่ (playing) ไม่ใช่ล็อบบี้
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

        // 🌟 ค้นหาว่ามีชื่อผู้เล่นนี้อยู่ในห้องอยู่แล้วหรือไม่ (กรณีรีคอนเนค)
        const existingPlayer = room.players.find(p => p.name === playerName);

        if (existingPlayer) {
            // ถ้าเป็นคนเดิมกลับมา ให้อัปเดต Socket ID ใหม่ และแจ้งว่าออนไลน์แล้ว
            existingPlayer.id = socket.id;
            existingPlayer.isConnected = true;
            socket.join(roomId);
            console.log(`🔄 ${playerName} Reconnect กลับเข้าห้อง ${roomId}`);
        } else {
            // ถ้าเป็นคนใหม่ และห้องยังไม่เต็ม และยังไม่เริ่มเกม ถึงจะให้เข้าได้
            if (room.status === 'playing') {
                socket.emit('errorMsg', 'เกมนี้เริ่มไปแล้ว ไม่สามารถเข้าร่วมได้');
                return;
            }
            if (room.players.length >= room.maxPlayers) {
                socket.emit('errorMsg', 'ห้องเต็มแล้ว');
                return;
            }

            // เพิ่มผู้เล่นใหม่
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

        // เตรียมเหรียญ
        room.board.tokens = {
            diamond: tokenCount, sapphire: tokenCount, emerald: tokenCount,
            ruby: tokenCount, onyx: tokenCount, gold: 5
        };

        // 🌟 ดึงข้อมูลจาก Data ของจริงมาสับไพ่
        // (ให้แน่ใจว่าคุณได้ตั้งตัวแปร cardsData และ noblesData ตามที่บอกไปก่อนหน้านี้)
        // เปลี่ยนจาก cardsData.tier1 เป็น cardsData.deckTier1 ให้ตรงกับชื่อในรูป
        room.board.decks.tier1 = shuffle([...cardsData.deckTier1]);
        room.board.decks.tier2 = shuffle([...cardsData.deckTier2]);
        room.board.decks.tier3 = shuffle([...cardsData.deckTier3]);

        // 🌟 ดึงข้อมูลขุนนางของจริงมาสับไพ่
        const shuffledNobles = shuffle([...noblesData]);
        room.board.nobles = shuffledNobles.slice(0, playerCount + 1);

        // ดึง 4 ใบแรกของแต่ละสำรับไปวางบนกระดาน
        room.board.cardsOnBoard.tier1 = room.board.decks.tier1.splice(0, 4);
        room.board.cardsOnBoard.tier2 = room.board.decks.tier2.splice(0, 4);
        room.board.cardsOnBoard.tier3 = room.board.decks.tier3.splice(0, 4);

        console.log(`🎲 ห้อง ${roomId} เริ่มเกมแล้ว!`);

        broadcastRoomList(); // สั่งลบห้องออกจาก Dashboard
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

    // 🌟 ระบบตัดการเชื่อมต่อใหม่ (ไม่เตะคนผิด)
    socket.on('disconnect', () => {
        console.log('🔴 คอนเนคชั่นหลุด:', socket.id);
        for (const roomId in gameRooms) {
            const room = gameRooms[roomId];
            const playerIndex = room.players.findIndex(p => p.id === socket.id);

            if (playerIndex !== -1) {
                // เปลี่ยนสถานะเป็นหลุดการเชื่อมต่อ แต่ยังไม่ลบข้อมูลทิ้ง
                room.players[playerIndex].isConnected = false;

                // 🌟 หัวใจสำคัญ: ถ้ายังอยู่ในล็อบบี้ (รอคน) ให้เตะออกได้
                // แต่ถ้าเกมเริ่มไปแล้ว (playing) ห้ามลบทิ้งเด็ดขาด!
                if (room.status === 'waiting') {
                    room.players.splice(playerIndex, 1);
                }

                // ถ้าคนออกหมดห้อง ค่อยลบห้องทิ้ง (หน่วงเวลา 1 นาทีเผื่อเน็ตกระตุก)
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

                // แจ้งเตือนคนในห้องที่เหลือว่ามีคนหลุด
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
