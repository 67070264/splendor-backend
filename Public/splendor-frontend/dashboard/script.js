const myName = localStorage.getItem("playerName");
if (!myName || myName === "undefined" || myName === "null") {
    alert("กรุณาล็อกอินก่อนเข้าสู่ระบบ");
    localStorage.removeItem("playerName");
    window.location.href = "/splendor-frontend/Main%20Game%20%26%20WIn%20Page/gem_dominion.html";
}

const socket = io();

socket.on('connect', () => {
    console.log("🟢 เชื่อมต่อเซิร์ฟเวอร์สำเร็จ! Socket ID:", socket.id);

    // ส่งคำสั่งไปถามเซิร์ฟเวอร์
    socket.emit('checkActiveGame', myName);
    socket.emit('getRoomList');
});

// เผื่อกรณีที่ Socket ต่อติดไปก่อนที่โค้ดข้างบนจะทำงาน
if (socket.connected) {
    socket.emit('checkActiveGame', myName);
}

socket.on('reconnectGame', (roomId) => {
    console.log("🔥 เซิร์ฟเวอร์เรียกตัวกลับเข้าห้อง:", roomId);
    // หน่วงเวลาให้หน้าเว็บโหลดเสร็จก่อนค่อยเด้ง Confirm
    setTimeout(() => {
        const wantToReconnect = confirm(`ระบบพบว่าคุณมีเกมที่กำลังเล่นค้างอยู่ในห้อง [${roomId}]\nต้องการกลับเข้าสู่เกมเพื่อเล่นต่อหรือไม่?`);
        if (wantToReconnect) {
            localStorage.setItem("roomId", roomId);
            window.location.href = "../Main Game & Win Page/gem_dominion.html";
        }
    }, 500); // หน่วง 0.5 วินาที
});

setInterval(() => {
    if (socket.connected) socket.emit('getRoomList');
}, 3000);

document.addEventListener("DOMContentLoaded", function () {
    const searchRoom = document.getElementById("searchRoom");
    if (searchRoom) {
        searchRoom.addEventListener("input", function () {
            const keyword = searchRoom.value.trim();
            const roomRows = document.querySelectorAll(".room-row");
            roomRows.forEach(function (row) {
                const roomCodeEl = row.querySelector(".room-code");
                if (roomCodeEl) {
                    row.style.display = roomCodeEl.textContent.trim().includes(keyword) ? "grid" : "none";
                }
            });
        });
    }

    const createRoomBtn = document.getElementById("createRoomBtn");
    if (createRoomBtn) {
        createRoomBtn.addEventListener("click", () => window.location.href = "../create_room/index.html");
    }

    const logoutBtn = document.getElementById("logoutBtn");
    if (logoutBtn) {
        logoutBtn.addEventListener("click", function () {
            localStorage.clear();
            sessionStorage.clear();
            window.location.href = "../login/index.html";
        });
    }
});

socket.on('roomListUpdate', (rooms) => renderRoomList(rooms));

function renderRoomList(rooms) {
    const roomList = document.getElementById("roomList");
    if (!roomList) return;
    roomList.innerHTML = "";

    if (!rooms || rooms.length === 0) {
        roomList.innerHTML = `<div class="no-rooms" style="text-align:center; padding:20px; color:#8a6a3a;">ยังไม่มีห้องที่เปิดอยู่</div>`;
        return;
    }

    rooms.forEach(room => {
        const isFull = room.current_players >= room.max_players;
        const roomRow = document.createElement("div");
        roomRow.className = `room-row ${isFull ? "full" : ""}`;
        roomRow.innerHTML = `
            <div class="room-code">${room.code}</div>
            <div class="room-player">${room.current_players}/${room.max_players}</div>
            <button class="join-btn" data-room="${room.code}" ${isFull ? "disabled" : ""}>Join</button>
        `;
        roomList.appendChild(roomRow);
    });
    attachJoinEvents();
}

function attachJoinEvents() {
    const joinButtons = document.querySelectorAll(".join-btn:not([disabled])");
    joinButtons.forEach(button => {
        button.addEventListener("click", function () {
            const roomCode = this.getAttribute("data-room");
            if (roomCode) {
                localStorage.setItem("roomId", roomCode);
                socket.emit("joinRoom", { roomId: roomCode, playerName: myName });
            }
        });
    });
}

socket.on("updateBoard", () => window.location.href = "../Main Game & Win Page/gem_dominion.html");
socket.on("errorMsg", (msg) => alert(msg));