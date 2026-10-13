document.addEventListener("DOMContentLoaded", function () {
    // 1. ตั้งค่า Supabase (นำ anon key ภาษาอังกฤษมาใส่)
    const SUPABASE_URL = 'https://aatwzzxgsxbyjkmudaua.supabase.co';
    const SUPABASE_ANON_KEY = 'sb_publishable_wEctXOLBK4CScL-GzWRpfg_xa0drqn3'; 

    let supabaseClient = null;
    try {
        if (typeof supabase !== 'undefined') {
            supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
        }
    } catch (e) {
        console.error("Supabase Connection Error:", e);
    }

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
        // ดักจับไม่ให้หน้ารีโหลดทันที
        event.preventDefault();

        let isValid = true;

        // ล้างสถานะ Error เก่า
        [username, email, password, confirmPassword].forEach(input => input?.classList.remove("input-error"));
        if (usernameError) usernameError.textContent = "";
        if (emailError) emailError.textContent = "";
        if (passwordError) passwordError.textContent = "";
        if (confirmPasswordError) confirmPasswordError.textContent = "";

        const usernameVal = username ? username.value.trim() : "";
        const emailVal = email ? email.value.trim() : "";
        const passwordVal = password ? password.value : "";
        const confirmPasswordVal = confirmPassword ? confirmPassword.value : "";

        // --- 1. ตรวจสอบชื่อผู้ใช้ ---
        if (usernameVal === "") {
            if (username) username.classList.add("input-error");
            if (usernameError) usernameError.textContent = "กรุณากรอกชื่อผู้ใช้";
            isValid = false;
        }

        // --- 2. ตรวจสอบอีเมล ---
        if (emailVal === "") {
            if (email) email.classList.add("input-error");
            if (emailError) emailError.textContent = "กรุณากรอกอีเมล";
            isValid = false;
        } else if (!emailVal.includes("@") || !emailVal.includes(".")) {
            if (email) email.classList.add("input-error");
            if (emailError) emailError.textContent = "รูปแบบอีเมลไม่ถูกต้อง";
            isValid = false;
        }

        // --- 3. ตรวจสอบรหัสผ่าน ---
        if (passwordVal === "") {
            if (password) password.classList.add("input-error");
            if (passwordError) passwordError.textContent = "กรุณากรอกรหัสผ่าน";
            isValid = false;
        } else if (passwordVal.length < 6) {
            if (password) password.classList.add("input-error");
            if (passwordError) passwordError.textContent = "รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร";
            isValid = false;
        }

        // --- 4. ตรวจสอบยืนยันรหัสผ่าน ---
        if (confirmPasswordVal === "") {
            if (confirmPassword) confirmPassword.classList.add("input-error");
            if (confirmPasswordError) confirmPasswordError.textContent = "กรุณายืนยันรหัสผ่าน";
            isValid = false;
        } else if (passwordVal !== confirmPasswordVal) {
            if (confirmPassword) confirmPassword.classList.add("input-error");
            if (confirmPasswordError) confirmPasswordError.textContent = "รหัสผ่านไม่ตรงกัน";
            isValid = false;
        }

        // หากมีจุดผิดพลาด ให้หยุดทำงาน
        if (!isValid) return;

        // --- ส่งข้อมูลไป Supabase ---
        if (!supabaseClient) {
            if (passwordError) passwordError.textContent = "กรุณาใส่ API Key ของ Supabase ให้ถูกต้อง";
            return;
        }

        try {
            const { data, error } = await supabaseClient.auth.signUp({
                email: emailVal,
                password: passwordVal,
                options: {
                    data: { username: usernameVal }
                }
            });

            if (error) {
                if (error.message.includes("User already registered") || error.status === 422) {
                    if (email) email.classList.add("input-error");
                    if (emailError) emailError.textContent = "อีเมลนี้เคยลงทะเบียนไว้แล้ว";
                } else {
                    if (password) password.classList.add("input-error");
                    if (passwordError) passwordError.textContent = error.message;
                }
                return;
            }

            if (data.user) {
                window.location.href = "../login/index.html";
            }
        } catch (err) {
            if (passwordError) passwordError.textContent = "เกิดข้อผิดพลาด ไม่สามารถเชื่อมต่อระบบได้";
        }
    });

    // ล้าง Error เมื่อมีการพิมพ์ใหม่
    [
        [username, usernameError],
        [email, emailError],
        [password, passwordError],
        [confirmPassword, confirmPasswordError]
    ].forEach(([inputEl, errorEl]) => {
        if (inputEl) {
            inputEl.addEventListener("input", () => {
                if (inputEl.value.trim() !== "") {
                    inputEl.classList.remove("input-error");
                    if (errorEl) errorEl.textContent = "";
                }
            });
        }
    });
});