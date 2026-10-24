document.addEventListener("DOMContentLoaded", function () {
    const loginForm = document.getElementById("loginForm");
    const usernameInput = document.getElementById("username");
    const passwordInput = document.getElementById("password");
    const usernameError = document.getElementById("usernameError");
    const passwordError = document.getElementById("passwordError");

    // 🌟 กำหนด URL ของ Backend (ให้ทีมคลาวด์นำ IP หรือ Domain ของ Load Balancer มาใส่แทนเมื่อขึ้นระบบจริง)
    const SERVER_URL = window.location.hostname === '127.0.0.1' || window.location.hostname === 'localhost' 
        ? 'http://localhost:3000' 
        : 'http://<IP_ของ_Load_Balancer>:3000';

    if (!loginForm) return;

    loginForm.addEventListener("submit", async function (event) {
        event.preventDefault();

        if (usernameError) usernameError.textContent = "";
        if (passwordError) passwordError.textContent = "";

        const inputVal = usernameInput.value.trim();
        const passwordVal = passwordInput.value;

        if (inputVal === "" || passwordVal === "") {
            if (usernameError) usernameError.textContent = "กรุณากรอกชื่อผู้ใช้/อีเมล และรหัสผ่าน";
            return;
        }

        try {
            // ยิงข้อมูลไปที่ API ของ Backend แทน Supabase
            const response = await fetch(`${SERVER_URL}/api/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                // ส่ง inputVal ไปตรงๆ ให้ Backend จัดการเช็กเองว่าเป็น Email หรือ Username
                body: JSON.stringify({ identifier: inputVal, password: passwordVal })
            });

            const data = await response.json();

            if (response.ok) {
                // บันทึกชื่อผู้เล่นที่ Backend ส่งกลับมา แล้วเปลี่ยนหน้าไปที่ Dashboard
                localStorage.setItem("playerName", data.playerName);
                window.location.href = "../dashboard/index.html"; 
            } else {
                if (usernameError) usernameError.textContent = data.error || "ชื่อผู้ใช้/อีเมล หรือรหัสผ่านไม่ถูกต้อง";
            }
        } catch (error) {
            console.error("Login Error:", error);
            if (usernameError) usernameError.textContent = "ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้";
        }
    });
});