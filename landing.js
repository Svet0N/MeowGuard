// landing.js - Specific logic for the landing page (Demo & Waitlist)
document.addEventListener('DOMContentLoaded', () => {
    const body = document.body;

    // 1. Smooth Scrolling
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const targetId = this.getAttribute('href');
            if (targetId === '#') return;
            const targetElement = document.querySelector(targetId);
            if (targetElement) {
                targetElement.scrollIntoView({ behavior: 'smooth' });
            }
        });
    });

    // 1.5 Page Transition No-Jump Logic
    document.querySelectorAll('a').forEach(link => {
        link.addEventListener('click', (e) => {
            const href = link.getAttribute('href');
            // Check if it's an internal page link (not an anchor # link)
            if (href && href.endsWith('.html')) {
                e.preventDefault();
                const main = document.getElementById('main-content');
                if (main) {
                    main.classList.remove('page-transition');
                    main.classList.add('page-transition', 'fade-out');
                    setTimeout(() => {
                        window.location.href = href;
                    }, 400); // Wait for the fade-out animation
                } else {
                    window.location.href = href;
                }
            }
        });
    });

    // 1.6 Scroll Progress Bar
    const progressBar = document.getElementById('scroll-progress-bar');
    if (progressBar) {
        window.addEventListener('scroll', () => {
            const winScroll = document.body.scrollTop || document.documentElement.scrollTop;
            const height = document.documentElement.scrollHeight - document.documentElement.clientHeight;
            const scrolled = Math.min((winScroll / height) * 100, 100);
            progressBar.style.width = scrolled + "%";
        });
    }

    // 1.7 Intersection Observer for Fade-In-Up Animations
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                // Optional: Stop observing once visible if you want it to happen only once
                // observer.unobserve(entry.target); 
            }
        });
    }, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });

    document.querySelectorAll('[data-animate]').forEach((el) => {
        // Elements that start visible (like hero section on load) shouldn't be added again,
        // but it's safe since they already have .visible. 
        observer.observe(el);
    });

    // 1.8 Bento 3D Tilt Effect
    document.querySelectorAll('.bento-card[data-tilt]').forEach(card => {
        card.addEventListener('mousemove', (e) => {
            const rect = card.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            const centerX = rect.width / 2;
            const centerY = rect.height / 2;
            // Calculate rotation degrees (max 10deg)
            const rotateX = ((y - centerY) / centerY) * -10;
            const rotateY = ((x - centerX) / centerX) * 10;
            // Apply scale and rotation using the Bunny bezier
            card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.02, 1.02, 1.02)`;
            card.style.transition = 'none'; // Disable transition during JS movement to prevent lag
        });

        card.addEventListener('mouseleave', () => {
            // Restore smooth transition to snap back
            card.style.transition = 'transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.2s ease';
            card.style.transform = `perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)`;
        });
    });

    // 2. Symptom Checker Demo
    const demoBtns = document.querySelectorAll('.demo-btn');
    const demoResult = document.getElementById('demo-result');

    const demoTexts = {
        low: {
            en: '<span>🌿</span> <strong>Low Risk.</strong> Observe at home. Keep your cat hydrated.',
            bg: '<span>🌿</span> <strong>Нисък риск.</strong> Наблюдавайте у дома. Осигурете вода.'
        },
        medium: {
            en: '<span>⚠️</span> <strong>Medium Risk.</strong> Contact your vet for a consultation within 24h.',
            bg: '<span>⚠️</span> <strong>Среден риск.</strong> Свържете се с лекар за консултация до 24ч.'
        },
        high: {
            en: '<span>🚑</span> <strong>Emergency!</strong> Go to the nearest 24/7 clinic immediately.',
            bg: '<span>🚑</span> <strong>Спешно!</strong> Отидете в най-близката денонощна клиника веднага.'
        }
    };

    demoBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            demoBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            const severity = btn.getAttribute('data-severity');
            const currentLang = body.classList.contains('lang-mode-en') ? 'en' : 'bg';

            if (severity === 'low') {
                demoResult.style.backgroundColor = 'var(--secondary-light)';
                demoResult.style.color = 'var(--secondary)';
            } else if (severity === 'medium') {
                demoResult.style.backgroundColor = 'rgba(255, 202, 40, 0.2)';
                demoResult.style.color = '#e65100';
            } else if (severity === 'high') {
                demoResult.style.backgroundColor = 'rgba(239, 83, 80, 0.1)';
                demoResult.style.color = 'var(--red-alert)';
            }
            demoResult.innerHTML = demoTexts[severity][currentLang];
        });
    });

    // 3. Early Access Form submission
    const eaForm = document.getElementById('ea-form');
    const formMessage = document.getElementById('form-message');

    if (eaForm) {
        eaForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const isEn = body.classList.contains('lang-mode-en');
            const submitBtn = eaForm.querySelector('.submit-btn');
            const emailInput = eaForm.querySelector('input[name="email"]');
            const email = emailInput.value.trim();

            if (!email) return;

            const originalHTML = submitBtn.innerHTML;
            submitBtn.innerText = isEn ? '⏳ Processing...' : '⏳ Обработка...';
            submitBtn.style.pointerEvents = 'none';

            try {
                const { error } = await supabaseClient
                    .from('early_access_emails')
                    .insert([{ email }]);

                if (error) throw error;

                submitBtn.innerHTML = '✅ ' + (isEn ? 'Registered' : 'Готово');
                submitBtn.style.backgroundColor = 'var(--secondary)';

                formMessage.textContent = isEn
                    ? `Thanks! You've been added to the waitlist.`
                    : `Благодарим! Вече сте в списъка на чакащите.`;
                formMessage.style.color = 'var(--white)';

                eaForm.reset();
            } catch (err) {
                submitBtn.innerHTML = '❌ ' + (isEn ? 'Error' : 'Грешка');
                formMessage.textContent = isEn ? 'Something went wrong. Try again.' : 'Нещо се обърка. Опитайте пак.';
                formMessage.style.color = '#ef5350';
                console.error('Waitlist error:', err);
            }

            setTimeout(() => {
                submitBtn.innerHTML = originalHTML;
                submitBtn.style.backgroundColor = '';
                submitBtn.style.pointerEvents = 'auto';
                formMessage.textContent = '';
            }, 5000);
        });
    }
});
