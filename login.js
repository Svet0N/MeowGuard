// login.js - Login logic with enhanced validation
document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const emailInput = document.getElementById('email');
            const passwordInput = document.getElementById('password');
            const loginBtn = document.getElementById('login-btn');

            const email = emailInput.value.trim();
            const password = passwordInput.value;

            // 1. Client-side Validation (Pro UX)
            if (!email) {
                showValidationError(emailInput, 'Моля, въведете имейл.');
                return;
            }
            if (password.length < 6) {
                showValidationError(passwordInput, 'Паролата трябва да е поне 6 символа.');
                return;
            }

            loginBtn.innerText = '⌛ Обработка...';
            loginBtn.disabled = true;

            try {
                const { data, error } = await supabaseClient.auth.signInWithPassword({
                    email,
                    password,
                });

                if (error) {
                    let message = "Грешка при вход: ";
                    if (error.message.includes('Invalid login credentials')) {
                        message = "Грешна парола или имейл. Моля, опитайте отново.";
                    } else {
                        message += error.message;
                    }
                    alert(message);
                    loginBtn.innerText = 'Влез';
                    loginBtn.disabled = false;
                } else {
                    // Success - Redirect
                    window.location.href = "dashboard.html";
                }
            } catch (err) {
                console.error("Login unexpected error:", err);
                alert("Възникна неочаквана грешка. Моля, проверете връзката си.");
                loginBtn.innerText = 'Влез';
                loginBtn.disabled = false;
            }
        });
    }
});

function showValidationError(input, message) {
    input.classList.add('error');
    input.style.borderColor = '#ff4d4d';
    // Shake animation
    input.style.animation = 'shake 0.4s ease-in-out';
    setTimeout(() => {
        input.style.animation = '';
        input.style.borderColor = '';
    }, 400);
    alert(message);
}
