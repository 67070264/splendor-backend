document.addEventListener("DOMContentLoaded", function () {
    const loginForm = document.getElementById("loginForm");
    const username = document.getElementById("username");
    const password = document.getElementById("password");
    const usernameError = document.getElementById("usernameError");
    const passwordError = document.getElementById("passwordError");

    if (!loginForm) return;

    loginForm.addEventListener("submit", async function (event) {
        event.preventDefault();

        const identifier = username?.value.trim() || "";
        const passwordVal = password?.value || "";

        if (usernameError) usernameError.textContent = "";
        if (passwordError) passwordError.textContent = "";
        username?.classList.remove("input-error");
        password?.classList.remove("input-error");

        let isValid = true;

        if (!identifier) {
            if (usernameError) usernameError.textContent = "กรุณากรอกชื่อผู้ใช้หรืออีเมล";
            username?.classList.add("input-error");
            isValid = false;
        }

        if (!passwordVal) {
            if (passwordError) passwordError.textContent = "กรุณากรอกรหัสผ่าน";
            password?.classList.add("input-error");
            isValid = false;
        }

        if (!isValid) return;

        const submitButton = loginForm.querySelector('button[type="submit"]');
        if (submitButton) submitButton.disabled = true;

        try {
            const response = await fetch(`${window.location.origin}/api/login`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    identifier,
                    password: passwordVal
                })
            });

            const result = await response.json();

            if (!response.ok) {
                if (response.status === 401) {
                    if (passwordError) {
                        passwordError.textContent = "ชื่อผู้ใช้/อีเมล หรือรหัสผ่านไม่ถูกต้อง";
                    }
                    password?.classList.add("input-error");
                } else {
                    if (passwordError) {
                        passwordError.textContent = result.error || "เข้าสู่ระบบไม่สำเร็จ";
                    }
                }
                return;
            }

            localStorage.setItem("playerName", result.playerName);
            window.location.href = "../dashboard/index.html";
        } catch (error) {
            console.error("Login API error:", error);
            if (passwordError) {
                passwordError.textContent = "เชื่อมต่อเซิร์ฟเวอร์ไม่ได้ กรุณาลองใหม่";
            }
        } finally {
            if (submitButton) submitButton.disabled = false;
        }
    });

    [username, password].forEach((input) => {
        input?.addEventListener("input", () => {
            input.classList.remove("input-error");
            if (input === username && usernameError) usernameError.textContent = "";
            if (input === password && passwordError) passwordError.textContent = "";
        });
    });
});
