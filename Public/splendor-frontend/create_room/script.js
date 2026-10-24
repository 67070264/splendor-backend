document.addEventListener("DOMContentLoaded", function () {
    const myName = localStorage.getItem("playerName");
    if (!myName || myName === "undefined" || myName === "null") {
        alert("กรุณาล็อกอินเพื่อสร้างห้อง");
        localStorage.removeItem("playerName");
        window.location.href = "../login/index.html";
        return;
    }

    const playerCards = document.querySelectorAll(".player-card");
    const createRoomBtn = document.getElementById("createRoomBtn") || document.querySelector(".start-btn");
    const playerError = document.getElementById("playerError");
    let selectedPlayers = 4;


    const socket = io();

    playerCards.forEach(function (card) {
        card.addEventListener("click", function () {
            playerCards.forEach(item => item.classList.remove("active", "selected"));
            card.classList.add("active", "selected");
            const playerVal = card.dataset.player || card.querySelector(".num")?.textContent.trim();
            selectedPlayers = Number(playerVal);
            if (playerError) playerError.textContent = "";
        });
    });

    if (createRoomBtn) {
        createRoomBtn.addEventListener("click", function () {
            if (![2, 3, 4].includes(selectedPlayers)) {
                if (playerError) playerError.textContent = "กรุณาเลือกจำนวนผู้เล่น";
                return;
            }
            sessionStorage.setItem("selectedPlayers", selectedPlayers);
            socket.emit("createRoom", { playerName: myName, maxPlayers: selectedPlayers });
        });
    }

    socket.on("roomCreated", (data) => {
        localStorage.setItem("roomId", data.roomId);
        alert(`🎉 สร้างห้องสำเร็จ!\n\nรหัสห้องคือ: ${data.roomId}\n(บอกให้เพื่อนมากด Join ที่หน้า Dashboard นะครับ)`);
        window.location.href = "../Main Game & Win Page/gem_dominion.html";
    });

    socket.on("errorMsg", (msg) => alert("ข้อผิดพลาด: " + msg));
});