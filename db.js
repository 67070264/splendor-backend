// ไฟล์: db.js
const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, PutCommand } = require('@aws-sdk/lib-dynamodb');

// ตั้งค่า Client คุยกับ AWS (มันจะดึงกุญแจจาก .env อัตโนมัติ)
const client = new DynamoDBClient({ region: "us-east-1" }); 
const docClient = DynamoDBDocumentClient.from(client);

async function saveMatchHistory(room) {
    // หาผู้ชนะ (คนที่คะแนนเยอะสุด)
    const winner = room.players.reduce((prev, current) => (prev.score > current.score) ? prev : current);

    // ปั้นข้อมูลเตรียมส่งขึ้น Database
    const params = {
        TableName: "SplendorMatchHistory", // ต้องสร้าง Table ชื่อนี้ใน AWS รอไว้
        Item: {
            matchId: `${room.roomId}-${Date.now()}`, 
            playedAt: new Date().toISOString(),
            winnerName: winner.name,
            winnerScore: winner.score,
            playersDetails: room.players.map(p => ({ 
                name: p.name, 
                score: p.score 
            }))
        }
    };

    try {
        await docClient.send(new PutCommand(params));
        console.log("💾 [DynamoDB] บันทึกประวัติการเล่นสำเร็จ!");
    } catch (err) {
        console.error("❌ [DynamoDB] บันทึกข้อมูลพลาด:", err);
    }
}

module.exports = { saveMatchHistory };