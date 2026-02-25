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
