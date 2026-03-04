// dashboard.js - Logic for fetching and displaying cat data, sidebar, and profile picking
const GEMINI_API_KEY = 'AIzaSyCbWMHG7Rh7kOljaZ1dkyyaOX_LhIggdBo';

document.addEventListener('DOMContentLoaded', async () => {
    // 1. Session Protection
    const session = await getSession();
    if (!session) {
        window.location.href = "index.html";
        return;
    }

    const userId = session.user.id;
    const userEmail = session.user.email;
    const userName = (session.user.user_metadata?.first_name) || userEmail.split('@')[0];

    // --- PRO LOGIC CONSTANTS & STATE ---
    let dailyActions = JSON.parse(localStorage.getItem(`daily_actions_${userId}`)) || { food: 0, play: 0, health: 0, date: new Date().toDateString() };
    if (dailyActions.date !== new Date().toDateString()) {
        dailyActions = { food: 0, play: 0, health: 0, date: new Date().toDateString() };
    }

    let aiQuestionCount = parseInt(localStorage.getItem(`ai_count_${userId}`)) || 0;
    const AI_LIMIT = 3;

    // UI Elements
    const loader = document.getElementById('loading-overlay');
    const chatInput = document.getElementById('chat-input');
    const chatMessages = document.getElementById('chat-messages');
    const chatForm = document.getElementById('chat-form');
    let isChatInitialized = false;

    const hideLoader = () => {
        if (loader) {
            loader.style.opacity = '0';
            setTimeout(() => loader.style.display = 'none', 500);
        }
    };
    setTimeout(hideLoader, 3000); // Safety

    // --- TAB SWITCHING LOGIC (Globally Scoped) ---
    window.switchTab = function (tabId) {
        console.log("Switching to tab:", tabId);
        // Toggle Active Content
        document.querySelectorAll('.tab-content').forEach(section => {
            section.classList.toggle('active', section.id === `tab-${tabId}`);
        });

        // Toggle Active Nav Icon
        document.querySelectorAll('.nav-item').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.tab === tabId);
        });

        // Specific Logic for Tabs
        if (tabId === 'ai') {
            if (!isChatInitialized) {
                isChatInitialized = true;
            }
            setTimeout(() => {
                const msgs = document.getElementById('chat-messages');
                if (msgs) msgs.scrollTop = msgs.scrollHeight;
            }, 100);
        }

        // Lock/Unlock body scroll for AI chat viewport
        if (tabId === 'ai') {
            document.body.style.overflow = 'hidden';
            document.body.style.height = '100dvh';
        } else {
            document.body.style.overflow = '';
            document.body.style.height = '';
        }
    };

    // --- PET DATA & SELECTION ---
    let weightChartInstance = null;

    function renderWeightChart(cat) {
        const ctx = document.getElementById('weightChart');
        if (!ctx) return;

        if (weightChartInstance) weightChartInstance.destroy();

        const currentW = parseFloat(cat.weight) || 4.2;

        weightChartInstance = new Chart(ctx, {
            type: 'line',
            data: {
                labels: ['Яну', 'Фев', 'Мар', 'Апр', 'Май'],
                datasets: [{
                    label: 'Тегло (кг)',
                    data: [currentW - 0.4, currentW - 0.3, currentW - 0.1, currentW + 0.1, currentW],
                    borderColor: '#F28F3B',
                    backgroundColor: 'rgba(242, 143, 59, 0.1)',
                    borderWidth: 3,
                    tension: 0.4,
                    fill: true,
                    pointRadius: 4,
                    pointBackgroundColor: '#fff'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: {
                    y: { beginAtZero: false, grid: { color: 'rgba(0,0,0,0.05)' } },
                    x: { grid: { display: false } }
                }
            }
        });
    }

    const activateCatProfile = (cat) => {
        localStorage.setItem('active_cat_id', cat.id);
        const name = cat.name || 'Твоето коте';

        // Update UI Text
        const catNameHero = document.getElementById('active-cat-name-hero');
        if (catNameHero) catNameHero.innerText = name;

        const catNameDisplay = document.getElementById('cat-name-display');
        if (catNameDisplay) catNameDisplay.innerText = name;

        document.getElementById('val-age').innerText = `${cat.age_years} г.`;
        document.getElementById('val-weight').innerText = `${cat.weight} кг`;

        // Update Hero Avatar
        const avatarEl = document.getElementById('main-cat-avatar');
        if (avatarEl) {
            avatarEl.src = getAvatarUrl(cat.breed) || `https://api.dicebear.com/7.x/bottts/svg?seed=${name}&backgroundColor=F8F9FA`;
        }

        // Update Global Stats in Insight Cards
        const trendEl = document.getElementById('global-weight-trend');
        if (trendEl) trendEl.innerText = `${cat.weight} кг`;

        // Update Active State in Carousel
        document.querySelectorAll('.pet-card').forEach(card => {
            card.classList.toggle('active', card.dataset.id === String(cat.id));
        });

        // Initialize/Update Chart
        renderWeightChart(cat);

        // Update Greeting
        const greetingNameEl = document.getElementById('user-first-name');
        if (greetingNameEl) greetingNameEl.innerText = userName;

        // Populate Medical History (Mocked for now)
        renderMedicalHistory();

        // Update Progress Bar on cat change
        updateProgressBar();

        // Update breed-specific tips
        updateDailyTip(cat);
    };

    function updateDailyTip(cat) {
        const breed = cat.breed ? cat.breed.toLowerCase() : 'bg_shorthair';
        const tips = {
            'british_shorthair': [
                "Британските късокосмести са предразположени към напълняване. Следете внимателно порциите.",
                "Тъй като са със заоблено тяло, ставите им се натоварват. Играйте с тях за умерена активност.",
                "Техният плътен кожух се нуждае от ежеседмично разресване за добър вид."
            ],
            'siamese': [
                "Сиамските котки са много вокални и социални. Говорете им често!",
                "Тъй като са много атлетични, те имат нужда от високи места за катерене.",
                "Интелигентни са – опитайте да ги научите на прости трикове или 'донеси'."
            ],
            'persian': [
                "Персийските котки се нуждаят от ЕЖЕДНЕВНО разресване, за да не се заплита козината им.",
                "Следете чистотата на очите – поради формата на лицето им често се насълзяват.",
                "Те обичат спокойната среда и предпочитат да не бъдат местени често."
            ],
            'mainecoon': [
                "Мейн Куун са гигантите сред котките – осигурете им достатъчно големи драскалки.",
                "Тази порода обича водата – не се изненадвайте, ако искат да влязат с вас под душа.",
                "Следете здравето на сърцето им редовно при ветеринар."
            ],
            'bengal': [
                "Бенгалските котки имат безкрайна енергия – играйте с тях поне 40 минути на ден.",
                "Обичат пъзелите с храна – това стимулира техния ловен инстинкт.",
                "Осигурете им безопасно място на балкона или на висок прозорец."
            ],
            'general': [
                "Поне 15 минути активна игра на ден помагат за психическото здраве на всяко коте.",
                "Винаги осигурявайте прясна вода на няколко места в дома.",
                "Редовните ветеринарни прегледи помагат за откриване на проблеми преди да са станали сериозни.",
                "Котешката трева (Catnip) е чудесен начин да стимулирате активността им.",
                "Избягвайте да давате на котката си прясно мляко – повечето имат непоносимост към лактоза."
            ]
        };

        const breedTips = tips[breed] || tips['general'];
        const randomTip = breedTips[Math.floor(Math.random() * breedTips.length)];

        const tipTextEl = document.querySelector('.daily-tip-premium .tip-content p');
        if (tipTextEl) tipTextEl.innerText = randomTip;
    }

    // --- PRO ACTION LOGIC ---
    window.logAction = function (type) {
        // Vibrate feedback (mobile)
        if (window.navigator.vibrate) window.navigator.vibrate(50);

        dailyActions[type]++;
        localStorage.setItem(`daily_actions_${userId}`, JSON.stringify(dailyActions));

        // Update Streak check
        updateStreak();
        updateProgressBar();
    };

    function updateProgressBar() {
        const totalActions = dailyActions.food + dailyActions.play + dailyActions.health;
        // Simple goal: 1 food, 1 play, 1 health = 100% (or more)
        const goal = 3;
        const percent = Math.min(Math.round((totalActions / goal) * 100), 100);

        const bar = document.getElementById('daily-progress-fill');
        const text = document.getElementById('progress-percent');
        if (bar) bar.style.width = `${percent}%`;
        if (text) text.innerText = `${percent}%`;
    }

    function updateStreak() {
        let streak = parseInt(localStorage.getItem(`streak_${userId}`)) || 0;
        let lastDate = localStorage.getItem(`streak_date_${userId}`);
        const today = new Date().toDateString();
        const yesterday = new Date(Date.now() - 86400000).toDateString();

        if (lastDate === today) {
            // Already updated today
        } else if (lastDate === yesterday) {
            streak++;
            localStorage.setItem(`streak_${userId}`, streak);
            localStorage.setItem(`streak_date_${userId}`, today);
        } else {
            // Reset or start new
            streak = 1;
            localStorage.setItem(`streak_${userId}`, streak);
            localStorage.setItem(`streak_date_${userId}`, today);
        }

        const streakEl = document.querySelector('#daily-streak .streak-count');
        if (streakEl) streakEl.innerText = streak;
    }

    // Initial Streak Update
    updateStreak();

    // Modal Control
    window.toggleReminderModal = function (show) {
        const modal = document.getElementById('reminder-modal');
        if (modal) modal.classList.toggle('modal-hidden', !show);
    };

    // --- FETCH CATS ---
    try {
        const { data: cats, error } = await supabaseClient
            .from('cats')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: true });

        if (error) throw error;

        if (cats && cats.length > 0) {
            // 1. Populate Pet Carousel (Mini nav)
            const petCarousel = document.getElementById('pet-carousel');
            if (petCarousel) {
                petCarousel.innerHTML = '';
                cats.forEach(cat => {
                    const card = document.createElement('div');
                    card.className = 'pet-card';
                    card.dataset.id = cat.id;
                    card.innerHTML = `
                        <img src="${getAvatarUrl(cat.breed) || `https://api.dicebear.com/7.x/bottts/svg?seed=${cat.name}`}" alt="${cat.name}">
                        <span>${cat.name}</span>
                    `;
                    card.addEventListener('click', () => activateCatProfile(cat));
                    petCarousel.appendChild(card);
                });
            }

            // 2. Show Profile Picker on Start
            showProfilePicker(cats);
        } else {
            window.location.href = 'onboarding.html';
        }

        // Update User Info in Profile Tab
        const ownerEmailEl = document.getElementById('sidebar-owner-email');
        if (ownerEmailEl) ownerEmailEl.innerText = userEmail;

        hideLoader();

    } catch (err) {
        console.error("Dashboard error:", err);
        hideLoader();
    }

    function showProfilePicker(cats) {
        const picker = document.getElementById('profile-picker');
        const grid = document.getElementById('picker-grid');
        if (!picker || !grid) return;

        grid.innerHTML = '';

        // Add existing cats
        cats.forEach(cat => {
            const profile = document.createElement('div');
            profile.className = 'picker-profile';
            profile.innerHTML = `
                <div class="picker-avatar-box">
                    <img src="${getAvatarUrl(cat.breed)}" alt="${cat.name}">
                </div>
                <span>${cat.name}</span>
            `;
            profile.addEventListener('click', () => {
                picker.classList.add('modal-hidden');
                activateCatProfile(cat);
            });
            grid.appendChild(profile);
        });

        // Add "New cat" button
        const addBtn = document.createElement('div');
        addBtn.className = 'add-profile-btn';
        addBtn.innerHTML = `
            <div class="add-box">+</div>
            <span>Ново коте</span>
        `;
        addBtn.addEventListener('click', () => {
            window.location.href = 'onboarding.html';
        });
        grid.appendChild(addBtn);

        // Show the picker
        picker.classList.remove('modal-hidden');
    }

    // --- AI CHAT LOGIC ---
    function appendMessage(text, type = 'user') {
        const msgDiv = document.createElement('div');
        msgDiv.className = `chat-msg ${type}`;
        msgDiv.innerHTML = text.replace(/\n/g, '<br>');

        chatMessages.appendChild(msgDiv);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    let cooldownActive = false;
    if (chatForm) {
        chatForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const message = chatInput.value.trim();
            if (!message || cooldownActive) return;

            appendMessage(message, 'user');
            chatInput.value = '';
            cooldownActive = true;

            const typing = document.createElement('div');
            typing.id = 'typing';
            typing.innerText = 'MeowGuard пише...';
            typing.style.fontSize = '0.75rem';
            typing.style.color = 'var(--text-muted)';
            typing.style.padding = '0 10px';
            chatMessages.appendChild(typing);

            try {
                const aiReply = await getAIResponse(message);
                typing.remove();
                appendMessage(aiReply, 'system');
            } catch (err) {
                typing.remove();
                appendMessage("Възникна грешка. Моля, провери връзката си.", 'system');
            } finally {
                setTimeout(() => cooldownActive = false, 2000);
            }
        });
    }

    async function getAIResponse(userMessage) {
        if (aiQuestionCount >= AI_LIMIT) {
            document.getElementById('paywall-modal').classList.remove('modal-hidden');
            return "Моля, абонирайте се за MeowGuard Pro, за да продължите да задавате въпроси.";
        }

        const catName = document.getElementById('active-cat-name-hero').innerText || 'Котка';
        const sys = `Ти си ветеринарен AI експерт на MeowGuard Pro. 
            Твоята цел е да отговаряш СТРИКТНО само на въпроси за котешко здраве, хранене (изчисления на порции) и поведение. 
            Котката се казва ${catName}. 
            Ако потребителят пита за неща извън грижата за котки (политика, обща наука, други животни), учтиво откажи да отговориш.
            Дръж отговорите професионални, кратки и на български език. 
            ВАЖНО: Винаги напомняй, че не си истински лекар и при спешни случаи трябва да се потърси клиника.`;

        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`;

        try {
            const res = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    system_instruction: { parts: [{ text: sys }] },
                    contents: [{ parts: [{ text: userMessage }] }]
                })
            });

            if (!res.ok) throw new Error('AI API error');
            const data = await res.json();

            // Increment question count only on success
            aiQuestionCount++;
            localStorage.setItem(`ai_count_${userId}`, aiQuestionCount);

            return data.candidates[0].content.parts[0].text;
        } catch (err) {
            console.error(err);
            throw err;
        }
    }

    function renderMedicalHistory() {
        const timelines = [
            document.getElementById('medical-timeline'),
            document.getElementById('home-reminders-list')
        ];

        const html = `
            <li class="timeline-item done">
                <div class="timeline-dot"></div>
                <div class="timeline-info">
                    <span class="time-date">10 Дек 2023</span>
                    <span class="time-title">Годишна ваксина 💉</span>
                </div>
            </li>
            <li class="timeline-item pending">
                <div class="timeline-dot"></div>
                <div class="timeline-info">
                    <span class="time-date">15 Май 2024</span>
                    <span class="time-title">Обезпаразитяване 💊</span>
                </div>
            </li>
            <li class="timeline-item pending">
                <div class="timeline-dot"></div>
                <div class="timeline-info">
                    <span class="time-date">22 Юни 2024</span>
                    <span class="time-title">Контролен преглед 🩺</span>
                </div>
            </li>
        `;

        timelines.forEach(tl => {
            if (tl) tl.innerHTML = html;
        });
    }

});

async function handleLogout() {
    sessionStorage.clear();
    localStorage.removeItem('active_cat_id');
    await signOut();
    window.location.href = "index.html";
}
