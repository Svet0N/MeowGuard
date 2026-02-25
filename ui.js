// ui.js - Global UI Logic (Hamburger, Language, Scroll Leak, Smart Buttons)
document.addEventListener('DOMContentLoaded', async () => {
    // 1. Hamburger Menu & Scroll Leak Prevention
    const hamburger = document.getElementById('hamburger-menu');
    const navLinksWrapper = document.querySelector('.nav-links-wrapper');

    if (hamburger && navLinksWrapper) {
        hamburger.addEventListener('click', () => {
            const isOpen = hamburger.classList.toggle('active');
            navLinksWrapper.classList.toggle('active');
            // Prevent background scroll when menu is open
            document.body.style.overflow = isOpen ? 'hidden' : 'auto';
        });

        // Close menu when a link is clicked
        document.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', () => {
                hamburger.classList.remove('active');
                navLinksWrapper.classList.remove('active');
                document.body.style.overflow = 'auto';
            });
        });
    }

    // 2. Language Toggle Logic
    const langToggle = document.getElementById('lang-toggle');
    const body = document.body;

    if (langToggle) {
        langToggle.addEventListener('click', () => {
            if (body.classList.contains('lang-mode-en')) {
                body.classList.remove('lang-mode-en');
                body.classList.add('lang-mode-bg');
            } else {
                body.classList.remove('lang-mode-bg');
                body.classList.add('lang-mode-en');
            }
        });
    }

    // 3. Smart Button CTA (Check Auth State)
    // Only if on landing page
    const ctaBtns = document.querySelectorAll('.hero-actions .btn-primary, .nav-links .btn-primary');
    if (ctaBtns.length > 0) {
        const session = await getSession();
        if (session) {
            ctaBtns.forEach(btn => {
                if (btn.classList.contains('lang-en')) {
                    btn.innerText = "To Dashboard ✨";
                } else {
                    btn.innerText = "Към таблото ✨";
                }
                btn.href = "dashboard.html";
            });
        }
    }
});
