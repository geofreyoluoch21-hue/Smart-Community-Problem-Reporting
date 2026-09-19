
// ============================================
// REGISTRATION
// ============================================

const registerForm = document.getElementById("registerForm");
const registerMessage = document.getElementById("registerMessage");

if (registerForm) {

    registerForm.addEventListener("submit", async function (event) {

        event.preventDefault();

        const fullName = document.getElementById("fullName").value.trim();
        const phone = document.getElementById("phone").value.trim();
        const email = document.getElementById("email").value.trim();
        const password = document.getElementById("password").value;
        const confirmPassword =
            document.getElementById("confirmPassword").value;

        if (password !== confirmPassword) {
            registerMessage.textContent = "Passwords do not match.";
            return;
        }

        if (password.length < 6) {
            registerMessage.textContent =
                "Password must be at least 6 characters.";
            return;
        }

        registerMessage.textContent = "Creating account...";

        try {

            const { data, error } =
                await supabaseClient.auth.signUp({
                    email: email,
                    password: password,

                    options: {
                        data: {
                            full_name: fullName,
                            phone: phone
                        }
                    }
                });

            if (error) {
                throw error;
            }

            registerMessage.textContent =
                "Account created! Please check your email to confirm your account.";

            registerForm.reset();

        } catch (error) {

            console.error(error);

            registerMessage.textContent =
                error.message;
        }
    });
}


// ============================================
// LOGIN
// ============================================

const loginForm = document.getElementById("loginForm");
const loginMessage = document.getElementById("loginMessage");

if (loginForm) {

    loginForm.addEventListener("submit", async function (event) {

        event.preventDefault();

        const email =
            document.getElementById("email").value.trim();

        const password =
            document.getElementById("password").value;

        loginMessage.textContent = "Logging in...";

        try {

            const { data, error } =
                await supabaseClient.auth.signInWithPassword({
                    email: email,
                    password: password
                });

            if (error) {
                throw error;
            }

            loginMessage.textContent =
                "Login successful!";

            setTimeout(function () {
                window.location.href = "dashboard.html";
            }, 1000);

        } catch (error) {

            console.error(error);

            loginMessage.textContent =
                error.message;
        }

    });
}