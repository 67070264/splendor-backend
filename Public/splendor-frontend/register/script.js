document.addEventListener("DOMContentLoaded", function () {
    const registerForm = document.getElementById("registerForm");
    const username = document.getElementById("username");
    const email = document.getElementById("email");
    const password = document.getElementById("password");
    const confirmPassword = document.getElementById("confirmPassword");

    const usernameError = document.getElementById("usernameError");
    const emailError = document.getElementById("emailError");
    const passwordError = document.getElementById("passwordError");
    const confirmPasswordError = document.getElementById("confirmPasswordError");

    if (!registerForm) return;

    registerForm.addEventListener("submit", async function (event) {
        event.preventDefault();

        let isValid = true;

        [username, email, password, confirmPassword].forEach(input =>
            input?.classList.remove("input-error")
        );

        [usernameError, emailError, passwordError, confirmPasswordError].forEach(el => {
            if (el) el.textContent = "";
        });

        const usernameVal = username?.value.trim() || "";
        const emailVal = email?.value.trim() || "";
        const passwordVal = password?.value || "";
        const confirmPasswordVal = confirmPassword?.value || "";

        if (!usernameVal) {
            username?.classList.add("input-error");
            if (usernameError) usernameError.textContent = "กรุณากรอกชื่อผู้ใช้";
            isValid = false;
        }

        if (!emailVal) {
            email?.classList.add("input-error");
            if (emailError) emailError.textContent = "กรุณากรอกอีเมล";
            isValid = false;
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailVal)) {
            email?.classList.add("input-error");
            if (emailError) emailError.textContent = "รูปแบบอีเมลไม่ถูกต้อง";
            isValid = false;
        }

        if (!passwordVal) {
            password?.classList.add("input-error");
            if (passwordError) passwordError.textContent = "กรุณากรอกรหัสผ่าน";
            isValid = false;
        } else if (passwordVal.length < 6) {
            password?.classList.add("input-error");
            if (passwordError) passwordError.textContent = "รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร";
            isValid = false;
        }

        if (!confirmPasswordVal) {
            confirmPassword?.classList.add("input-error");
            if (confirmPasswordError) confirmPasswordError.textContent = "กรุณายืนยันรหัสผ่าน";
            isValid = false;
        } else if (passwordVal !== confirmPasswordVal) {
            confirmPassword?.classList.add("input-error");
            if (confirmPasswordError) confirmPasswordError.textContent = "รหัสผ่านไม่ตรงกัน";
            isValid = false;
        }

        if (!isValid) return;

        const submitButton = registerForm.querySelector('button[type="submit"]');
        if (submitButton) submitButton.disabled = true;

        try {
            const response = await fetch(`${window.location.origin}/api/register`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    email: emailVal,
                    password: passwordVal,
                    playerName: usernameVal
                })
            });

            const result = await response.json();

            if (!response.ok) {
                const message = result.error || "สมัครสมาชิกไม่สำเร็จ";

                if (message.toLowerCase().includes("email")) {
                    email?.classList.add("input-error");
                    if (emailError) emailError.textContent = "อีเมลนี้ลงทะเบียนแล้ว";
                } else if (message.toLowerCase().includes("username")) {
                    username?.classList.add("input-error");
                    if (usernameError) usernameError.textContent = "ชื่อผู้ใช้นี้ถูกใช้แล้ว";
                } else if (passwordError) {
                    passwordError.textContent = message;
                }
                return;
            }

            alert("สมัครสมาชิกสำเร็จ กรุณาเข้าสู่ระบบ");
            window.location.href = "../login/index.html";
        } catch (error) {
            console.error("Register API error:", error);
            if (passwordError) {
                passwordError.textContent = "เชื่อมต่อเซิร์ฟเวอร์ไม่ได้ กรุณาลองใหม่";
            }
        } finally {
            if (submitButton) submitButton.disabled = false;
        }
    });

    [
        [username, usernameError],
        [email, emailError],
        [password, passwordError],
        [confirmPassword, confirmPasswordError]
    ].forEach(([inputEl, errorEl]) => {
        if (inputEl) {
            inputEl.addEventListener("input", () => {
                inputEl.classList.remove("input-error");
                if (errorEl) errorEl.textContent = "";
            });
        }
    });
});
