// Supabase setup
const SUPABASE_URL = 'https://fzbhvfegkjwkwtgbftsy.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ6Ymh2ZmVna2p3a3d0Z2JmdHN5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE5NjcyOTYsImV4cCI6MjA4NzU0MzI5Nn0.o3oyt8-jt4oNEolCDg_nCFYkEzdxHL8VqcrMhfIO31c';
// Use supabaseClient to avoid collision with the global 'supabase' object from the CDN
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

document.addEventListener('DOMContentLoaded', () => {

    // Language Toggle Logic
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

    // Smooth Scrolling
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

    // Symptom Checker Demo
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

    // Form submission (Supabase Integrated)
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

                // Detailed check for 401 error (often RLS)
                if (err.status === 401 || err.code === '42501' || (err.message && err.message.includes('401'))) {
                    formMessage.textContent = isEn
                        ? 'Database access denied. Please enable RLS policies.'
                        : 'Достъпът отказан. Моля, разрешете RLS политиките в Supabase.';
                } else {
                    formMessage.textContent = isEn ? 'Something went wrong. Try again.' : 'Нещо се обърка. Опитайте пак.';
                }

                formMessage.style.color = '#ef5350';
                console.error('Supabase detailed error:', JSON.stringify(err, null, 2));
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
