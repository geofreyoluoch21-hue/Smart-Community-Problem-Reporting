// ============================================
// REGISTRATION
// ============================================

const registerForm = document.getElementById("registerForm");
const registerMessage = document.getElementById("registerMessage");

if (registerForm) {

    registerForm.addEventListener("submit", async function (event) {

        event.preventDefault();

        const fullName =
            document.getElementById("fullName").value.trim();

        const phone =
            document.getElementById("phone").value.trim();

        const email =
            document.getElementById("email").value.trim();

        const password =
            document.getElementById("password").value;

        const confirmPassword =
            document.getElementById("confirmPassword").value;


        if (password !== confirmPassword) {

            registerMessage.textContent =
                "Passwords do not match.";

            return;
        }


        if (password.length < 6) {

            registerMessage.textContent =
                "Password must be at least 6 characters.";

            return;
        }


        registerMessage.textContent =
            "Creating account...";


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

const loginForm =
    document.getElementById("loginForm");

const loginMessage =
    document.getElementById("loginMessage");


if (loginForm) {

    loginForm.addEventListener(
        "submit",
        async function (event) {

            event.preventDefault();


            const email =
                document.getElementById("email")
                    .value
                    .trim();


            const password =
                document.getElementById("password")
                    .value;


            loginMessage.textContent =
                "Logging in...";


            try {

                // Sign in
                const {
                    data,
                    error
                } =
                    await supabaseClient
                        .auth
                        .signInWithPassword({

                            email: email,

                            password: password
                        });


                if (error) {

                    throw error;
                }


                // Get logged-in user
                const user =
                    data.user;


                if (!user) {

                    throw new Error(
                        "Unable to get logged-in user."
                    );
                }


                // Get user's profile and role
                const {
                    data: profile,
                    error: profileError
                } =
                    await supabaseClient
                        .from("profiles")
                        .select("role")
                        .eq("id", user.id)
                        .single();


                if (profileError) {

                    throw profileError;
                }


                loginMessage.textContent =
                    "Login successful!";


                // ========================================
                // REDIRECT BASED ON ROLE
                // ========================================

                if (profile.role === "admin") {

                    window.location.href =
                        "admin.html";

                } else {

                    window.location.href =
                        "dashboard.html";
                }


            } catch (error) {

                console.error(
                    "Login error:",
                    error
                );


                loginMessage.textContent =
                    error.message;
            }

        }
    );
}
