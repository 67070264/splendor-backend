document.addEventListener("DOMContentLoaded", function () {
    const SUPABASE_URL = 'https://aatwzzxgsxbyjkmudaua.supabase.co';
    const SUPABASE_ANON_KEY = 'sb_publishable_wEctXOLBK4CScL-GzWRpfg_xa0drqn3';
    const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

    const loginForm = document.getElementById("loginForm");
    const usernameInput = document.getElementById("username");
    const passwordInput = document.getElementById("password");
    const usernameError = document.getElementById("usernameError");
    const passwordError = document.getElementById("passwordError");

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

        let loginEmail = inputVal;

        if (!inputVal.includes("@")) {
            const { data: foundEmail, error: rpcError } = await supabaseClient
                .rpc('get_email_by_username', { username_input: inputVal });

            if (rpcError || !foundEmail) {
                if (usernameError) usernameError.textContent = "ไม่พบชื่อผู้ใช้นี้ในระบบ";
                return;
            }
            loginEmail = foundEmail;
        }

        const { data, error } = await supabaseClient.auth.signInWithPassword({
            email: loginEmail,
            password: passwordVal,
        });

        if (error) {
            if (usernameError) usernameError.textContent = "ชื่อผู้ใช้/อีเมล หรือรหัสผ่านไม่ถูกต้อง";
        } else if (data.user) {
            let validPlayerName = inputVal;
            if (inputVal.includes("@")) {
                validPlayerName = inputVal.split("@")[0];
            }
            
            localStorage.setItem("playerName", validPlayerName);
            window.location.href = "../dashboard/index.html"; 
        }
    });
});