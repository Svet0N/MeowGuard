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
    const userName = userEmail.split('@')[0];

    // UI Elements
    const loader = document.getElementById('loading-overlay');
    const profilePicker = document.getElementById('profile-picker');
    const pickerProfiles = document.getElementById('picker-profiles');

    // Sidebar Elements
    const sidebar = document.getElementById('dashboard-sidebar');
    const sidebarOverlay = document.getElementById('sidebar-overlay');
    const menuBtn = document.getElementById('dashboard-menu-btn');
    const closeSidebarBtn = document.getElementById('close-sidebar');
    const sidebarCatList = document.getElementById('sidebar-cat-list');

    // Chat UI Elements (Moved here to prevent ReferenceError)
    const symptomCheckerBtn = document.getElementById('symptom-checker-btn');
    const aiChatOverlay = document.getElementById('ai-chat-overlay');
    const closeChatBtn = document.getElementById('close-chat');
    const chatForm = document.getElementById('chat-form');
    const chatInput = document.getElementById('chat-input');
    const chatMessages = document.getElementById('chat-messages');

    let isChatInitialized = false;

    document.getElementById('sidebar-owner-email').innerText = userEmail;

    const hideLoader = () => {
        if (loader) {
            loader.style.opacity = '0';
            setTimeout(() => loader.style.display = 'none', 500);
        }
    };

    // 2. Sidebar Toggles (Phase 22 Fix: Toggle Logic)
    const toggleSidebar = (show) => {
        const isActive = show !== undefined ? show : !sidebar.classList.contains('active');

        if (isActive) {
            sidebar.classList.add('active');
            sidebarOverlay.classList.add('active');
            menuBtn.classList.add('active'); // Синхронизация с иконата
            document.body.style.overflow = 'hidden';
        } else {
            sidebar.classList.remove('active');
            sidebarOverlay.classList.remove('active');
            menuBtn.classList.remove('active');
            document.body.style.overflow = '';
        }
    };

    menuBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        toggleSidebar(); // Използваме toggle логика
    });

    closeSidebarBtn.addEventListener('click', () => toggleSidebar(false));
    sidebarOverlay.addEventListener('click', () => toggleSidebar(false));

    // --- NEW: TAB SWITCHING LOGIC (Phase 22 Fix: AI App Look) ---
    const tabBtns = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');

    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const tabName = btn.dataset.tab;
            const tabId = `tab-${tabName}`;

            tabBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            tabContents.forEach(content => {
                content.classList.toggle('active', content.id === tabId);
            });

            // Lock body scroll ONLY for AI Tab on mobile
            if (window.innerWidth <= 768 && tabName === 'ai') {
                document.body.classList.add('no-scroll');
                if (!isChatInitialized) {
                    appendDisclaimer();
                    isChatInitialized = true;
                }
            } else {
                document.body.classList.remove('no-scroll');
            }

            // Optional: Auto-scroll chat to bottom when entering AI tab
            if (tabName === 'ai') {
                setTimeout(() => {
                    chatMessages.scrollTop = chatMessages.scrollHeight;
                }, 100);
            }
        });
    });

    // --- NEW: MODAL LOGIC (Manual Reminders) ---
    const reminderModal = document.getElementById('reminder-modal');
    const addReminderBtn = document.getElementById('add-reminder-btn');
    const closeModalBtn = document.getElementById('close-modal');
    const manualForm = document.getElementById('manual-reminder-form');

    if (addReminderBtn) {
        addReminderBtn.addEventListener('click', () => reminderModal.classList.remove('modal-hidden'));
    }
    if (closeModalBtn) {
        closeModalBtn.addEventListener('click', () => reminderModal.classList.add('modal-hidden'));
    }
    window.addEventListener('click', (e) => {
        if (e.target === reminderModal) reminderModal.classList.add('modal-hidden');
    });

    if (manualForm) {
        manualForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const type = document.getElementById('manual-type').value;
            const label = document.getElementById('manual-label').value;
            const dateStr = document.getElementById('manual-date').value;

            if (!dateStr) return;
            const dateObj = new Date(dateStr);

            saveReminderData({
                type: type,
                label: label,
                date: dateObj.toLocaleDateString('bg-BG'),
                dateISO: dateObj.toISOString(),
                id: Date.now()
            });

            manualForm.reset();
            reminderModal.classList.add('modal-hidden');
        });
    }

    // Helper logic used by both AI and Manual form:
    function saveReminderData(newObj) {
        const activeCatId = localStorage.getItem('active_cat_id');
        if (!activeCatId) {
            console.warn("No active cat ID found, cannot save reminder.");
            return;
        }

        newObj.catId = activeCatId; // Tag with current cat
        let reminders = JSON.parse(localStorage.getItem('meowguard_reminders') || '[]');

        // Deduplicate: same type AND same catId
        const existingIndex = reminders.findIndex(r => r.type === newObj.type && r.catId === activeCatId);

        if (existingIndex !== -1) {
            newObj.id = reminders[existingIndex].id; // Keep same ID for list consistency
            reminders[existingIndex] = newObj;
            console.log("Updated existing reminder of type:", newObj.type, "for cat:", activeCatId);
        } else {
            reminders.push(newObj);
            console.log("Added new reminder of type:", newObj.type, "for cat:", activeCatId);
        }

        localStorage.setItem('meowguard_reminders', JSON.stringify(reminders));
        renderReminders();
    }
    window.saveReminderData = saveReminderData; // Expose to internal logic if needed

    // 8. Render Reminders on dashboard
    function renderReminders() {
        const list = document.getElementById('reminders-list');
        const countEl = document.getElementById('reminders-count');
        if (!list) return;

        const activeCatId = localStorage.getItem('active_cat_id');
        let reminders = JSON.parse(localStorage.getItem('meowguard_reminders') || '[]');

        // Filter by active cat
        reminders = reminders.filter(r => r.catId === activeCatId);

        const typeTranslations = {
            'vaccination': 'Ваксинация',
            'neutering': 'Кастрация',
            'deworming': 'Обезпаразитяване',
            'checkup': 'Контролен преглед'
        };
        const icons = { vaccination: '💉', deworming: '💊', checkup: '🩺', neutering: '✂️' };

        if (reminders.length === 0) {
            list.innerHTML = '<p style="color: var(--text-muted); font-size: 0.9rem; text-align: center; padding: 15px 0;">Няма записани напомняния. Споделете медицинско събитие в чата! 🐾</p>';
            if (countEl) countEl.textContent = '0';
            return;
        }

        reminders.sort((a, b) => new Date(a.dateISO) - new Date(b.dateISO));

        list.innerHTML = reminders.map(r => `
            <div class="reminder-item" data-id="${r.id}">
                <div class="reminder-icon">${icons[r.type] || '📅'}</div>
                <div class="reminder-info">
                    <div class="reminder-label">${typeTranslations[r.type] || r.label}</div>
                    <div class="reminder-date">${r.date}</div>
                </div>
                <button class="reminder-delete" onclick="deleteReminder(${r.id})" title="Изтрий">✕</button>
            </div>
        `).join('');

        if (countEl) countEl.textContent = reminders.length;
    }
    window.renderReminders = renderReminders; // Expose globally

    function renderTip(breed = '') {
        const tipEl = document.getElementById('daily-tip-text');
        if (!tipEl) return;

        const tips = {
            general: [
                "Осигурете прясна течаща вода на Вашата котка – това помага за предотвратяване на бъбречни проблеми.",
                "Редовните игри (поне 15 мин на ден) намаляват стреса и поддържат здравословно тегло.",
                "Котешката трева помага за естественото пречистване на стомаха от косми.",
                "Спокойната среда е ключът към дълголетието. Избягвайте силни шумове около мястото за сън."
            ],
            longHaired: [
                "Сресвайте козината ежедневно, за да предотвратите болезнени сплъстявания.",
                "Използвайте специални малцови пасти за предотвратяване на образуването на топчета косми.",
                "Редовното подстригване на козината около лапите помага за по-добра хигиена.",
                "Персийските котки изискват ежедневно почистване на зоната около очите."
            ],
            hairless: [
                "Сфинксовете нямат козина, която да абсорбира мазнините – къпете ги веднъж седмично с мек шампоан.",
                "През зимата осигурете топли дрешки, тъй като безкосместите котки губят топлина бързо.",
                "Използвайте слънцезащитен крем за котки, ако Вашият Сфинкс обича да стои на прозореца.",
                "Редовно почиствайте ушите и гънките на кожата от натрупан себум."
            ],
            active: [
                "Активните породи (Бенгал, Сиам) обожават вертикалните пространства – осигурете им високи катерушки.",
                "Използвайте интелигентни пъзели за храна, за да стимулирате ума и ловните инстинкти.",
                "Играчките тип 'въдица' са идеални за изразходване на енергията на Бенгалските котки.",
                "Осигурете достъп до обезопасен прозорец, за да може котката да наблюдава външния свят."
            ]
        };

        const b = breed.toLowerCase();
        let selectedCategory = 'general';

        if (b.includes('сфинкс') || b.includes('sphynx') || b.includes('безкосместа')) {
            selectedCategory = 'hairless';
        } else if (b.includes('персийска') || b.includes('persian') || b.includes('мей куун') || b.includes('maine coon')) {
            selectedCategory = 'longHaired';
        } else if (b.includes('бенгалска') || b.includes('bengal') || b.includes('сиамска') || b.includes('siamese')) {
            selectedCategory = 'active';
        }

        const categoryTips = tips[selectedCategory];
        const randomTip = categoryTips[Math.floor(Math.random() * categoryTips.length)];
        tipEl.innerText = randomTip;
    }
    const activateCatProfile = (cat) => {
        // Save to local storage to persist across reloads
        localStorage.setItem('active_cat_id', cat.id);

        // Populate Main Dashboard
        const name = cat.name || 'Твоето коте';
        document.getElementById('main-cat-avatar').src = cat.avatar_url || `https://api.dicebear.com/7.x/bottts/svg?seed=${name}&backgroundColor=F8F9FA`;
        document.getElementById('cat-name-display').innerText = name;
        document.getElementById('sidebar-name').innerText = name;
        document.getElementById('cat-greeting').innerText = `Как е ${name} днес?`;

        document.getElementById('val-age').innerText = `${cat.age_years}`;
        document.getElementById('val-weight').innerText = `${cat.weight}`;
        document.getElementById('sidebar-breed').innerText = cat.breed || 'Неизвестна';
        document.getElementById('val-gender').innerText = cat.gender === 'male' ? 'Мъжки' : 'Женски';

        document.getElementById('user-greeting').innerText = `Здравей, ${userName}! 👋`;

        // Update active state in sidebar
        document.querySelectorAll('.sidebar-cat-item').forEach(el => {
            el.classList.toggle('active', el.dataset.id === String(cat.id));
        });

        profilePicker.classList.remove('active');

        // Trigger Progress Animation
        const circle = document.getElementById('health-score-stroke');
        if (circle) circle.setAttribute('stroke-dasharray', '0, 100'); // reset
        setTimeout(() => {
            if (circle) circle.setAttribute('stroke-dasharray', '100, 100');
        }, 500);

        // Refresh reminders for this specific cat
        renderReminders();

        // Show personalized tip
        renderTip(cat.breed);

        // Clear chat history for fresh context
        if (chatMessages) {
            chatMessages.innerHTML = '';
            appendDisclaimer(); // Always show disclaimer in new chat
        }
        isChatInitialized = true;
    };

    function appendDisclaimer() {
        if (!chatMessages) return;
        // Check if disclaimer already exists to avoid duplicates
        if (chatMessages.querySelector('.ai-disclaimer')) return;

        const disclaimer = document.createElement('div');
        disclaimer.className = 'ai-disclaimer';
        disclaimer.innerHTML = '⚠️ <strong>Важно:</strong> AI асистентът не е ветеринарен лекар. Информацията тук е само с консултативна цел и не замества професионална медицинска помощ.';
        chatMessages.prepend(disclaimer);
    }
    window.appendDisclaimer = appendDisclaimer; // Expose if needed

    // 3. Fetch All Cats
    try {
        const { data: cats, error } = await supabaseClient
            .from('cats')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: true }); // keep consistency

        if (error) throw error;

        if (cats && cats.length > 0) {
            // Populate Sidebar Cat List
            cats.forEach(cat => {
                const catItem = document.createElement('div');
                catItem.className = 'sidebar-cat-item';
                catItem.dataset.id = cat.id;
                catItem.innerHTML = `
                    <img src="${cat.avatar_url || `https://api.dicebear.com/7.x/bottts/svg?seed=${cat.name}&backgroundColor=F8F9FA`}" class="sidebar-cat-avatar">
                    <span class="sidebar-cat-name">${cat.name}</span>
                `;
                catItem.addEventListener('click', () => {
                    activateCatProfile(cat);
                    toggleSidebar(false);
                });
                sidebarCatList.appendChild(catItem);
            });

            // 4. Handle Profile Selection Logic (Netflix Style)
            const savedCatId = localStorage.getItem('active_cat_id');
            const hasSeenPicker = sessionStorage.getItem('has_seen_picker');

            if (cats.length > 1 && !savedCatId && !hasSeenPicker) {
                // Show Netflix style picker
                sessionStorage.setItem('has_seen_picker', 'true');

                // Populate Picker
                cats.forEach(cat => {
                    const card = document.createElement('div');
                    card.className = 'profile-card';
                    card.innerHTML = `
                        <div class="profile-avatar-wrapper">
                            <img src="${cat.avatar_url || `https://api.dicebear.com/7.x/bottts/svg?seed=${cat.name}&backgroundColor=F8F9FA`}" class="profile-avatar">
                        </div>
                        <span class="profile-name">${cat.name}</span>
                    `;
                    card.addEventListener('click', () => {
                        activateCatProfile(cat);
                    });
                    pickerProfiles.appendChild(card);
                });

                // Also Add 'New Cat' button to picker
                const addCard = document.createElement('div');
                addCard.className = 'profile-card';
                addCard.innerHTML = `
                    <div class="profile-avatar-wrapper" style="background: rgba(255,255,255,0.1); border: 2px dashed #ffffff;">
                        <span style="font-size: 3rem; color: #ffffff;">+</span>
                    </div>
                    <span class="profile-name">Ново коте</span>
                `;
                addCard.addEventListener('click', () => {
                    window.location.href = 'onboarding.html';
                });
                pickerProfiles.appendChild(addCard);

                profilePicker.classList.add('active');
                hideLoader();
            } else {
                // Default to last selected, or the first one
                let targetCat = cats[0];
                if (savedCatId) {
                    const found = cats.find(c => String(c.id) === savedCatId);
                    if (found) targetCat = found;
                }
                activateCatProfile(targetCat);
                hideLoader();
            }
        } else {
            // No cats found. Redirect to onboarding so they can add one.
            window.location.href = 'onboarding.html';
        }
    } catch (err) {
        console.error("Dashboard data error:", err);
        hideLoader();
    }

    // Safety timeout
    setTimeout(hideLoader, 3000);

    // 5. Phase 13: AI Symptom Checker Logic
    // Toggle Chat Overlay (Elements now initialized at top)

    // Toggle Chat Overlay
    if (symptomCheckerBtn) {
        symptomCheckerBtn.addEventListener('click', (e) => {
            e.preventDefault();
            aiChatOverlay.classList.remove('ai-chat-overlay-hidden');
            document.body.style.overflow = 'hidden'; // prevent bg scroll

            // Send initial medical disclaimer if first time opening
            if (!isChatInitialized) {
                appendDisclaimer();
                isChatInitialized = true;
            }
            chatInput.focus();
        });
    }

    if (closeChatBtn) {
        closeChatBtn.addEventListener('click', () => {
            aiChatOverlay.classList.add('ai-chat-overlay-hidden');
            document.body.style.overflow = '';
        });
    }

    // Helper to add messages to the DOM
    function appendMessage(text, type = 'user') {
        const msgDiv = document.createElement('div');
        msgDiv.className = `chat-msg ${type}`;

        // Convert \n to <br> to ensure paragraphs work in the UI
        let formattedText = text.replace(/\n/g, '<br>');

        msgDiv.innerHTML = formattedText;

        chatMessages.appendChild(msgDiv);
        chatMessages.scrollTop = chatMessages.scrollHeight; // Auto-scroll to bottom
    }

    // Typing Animation
    function showTypingIndicator() {
        const div = document.createElement('div');
        div.className = 'chat-msg system typing-indicator';
        div.id = 'typing-indicator';
        div.innerHTML = '<div class="dot"></div><div class="dot"></div><div class="dot"></div>';
        chatMessages.appendChild(div);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    function removeTypingIndicator() {
        const el = document.getElementById('typing-indicator');
        if (el) el.remove();
    }

    // 6. Gemini AI Symptom Checker (Model Fallback Chain - Stability Focus)
    const MODEL_CHAIN = ['gemini-2.0-flash-exp', 'gemini-1.5-flash', 'gemini-1.5-pro', 'gemini-1.5-flash-8b'];

    async function getAIResponse(userMessage) {
        const catName = document.getElementById('cat-name-display').innerText || 'Котка';
        const catBreed = document.getElementById('sidebar-breed').innerText || 'Неизвестна';
        const catAge = document.getElementById('val-age').innerText || 'Неизвестна';
        const catGender = document.getElementById('val-gender').innerText || 'Неизвестен';

        const isFirstMessage = chatMessages.children.length <= 1;

        // System instruction — Expert SaaS Consultant (Gender-Aware & Filtered)
        const systemInstruction = `Ти си ветеринарен консултант на MeowGuard в специалната секция "AI Консултант". Твоята задача е да помагаш на собственика на котката ${catName} (${catBreed}, ${catAge}, пол: ${catGender}).

ПРАВИЛА ЗА ПОВЕДЕНИЕ:
1. РОЛЯ: Ти си висококвалифициран експерт. Говориш възпитано и професионално.
2. ГРАМАТИКА: Използвай правилни местоимения спрямо пола на котката (${catGender}). 
   - Ако е Мъжки: използвай "той", "него", "му".
   - Ако е Женски: използвай "тя", "нея", "й".

3. МЕДИЦИНСКА ЛОГИКА СЪОБРАЗНО ПОЛА:
   - АКО Е МЪЖКИ: Бъди изключително бдителен за симптоми, свързани с долните пикочни пътища (FLUTD/кристали).
   - АКО Е ЖЕНСКИ: Съобразявай съветите с женското хормонално здраве и специфики при кастрация.

4. ИНТЕЛИГЕНТНО ФИЛТРИРАНЕ (ВАЖНО!):
   - Генерирай <!--REMINDER:...--> таг за Контролен преглед САМО ако:
     а) Потребителят ИЗРИЧНО поиска напомняне.
     б) Симптомите са сериозни (кръв, летаргия, системно повръщане, пълна липса на апетит).
   - ЗА ПОВЕДЕНЧЕСКИ ВЪПРОСИ (хранене, навици, игра): Давай само съвети. НЕ генерирай напомняния в таблото.
   - ПРЕДИ ДА ГЕНЕРИРАШ JSON, СИ КАЖИ "НА УМ": "Това изисква ли лекар или е просто съвет за ежедневието?". Ако е съвет - не генерирай JSON.

5. КАТЕГОРИЗАЦИЯ:
   - Симптоми: Обясни причините и дай план за действие.
   - Процедури/Дати: Потвърди, пожелай успех и генерирай JSON.
   - Корекции: Потвърди актуализацията.

6. ИЗЧИСЛЯВАНЕ НА ДАТИ (Днес е ${new Date().toLocaleDateString('bg-BG')}):
   - Винаги пресмятай финалната дата спрямо днешната и я съобщавай.

7. ФОРМАТ:
   - Макс 2 абзаца, 2 емоджита. Използвай <strong> и <em>.
   - ЗАБРАНЕНИ: "носталгия", "въпластват", "хладзагубителна", "празнородни".

8. JSON ТАГ (ВИНАГИ В КРАЯ, АКО Е ОДОБРЕН ОТ ФИЛТЪРА):
   - <!--REMINDER:{"type":"vaccination","days":365,"label":"Ваксинация: ${catName}"}-->
   - Типове: "vaccination", "neutering", "deworming", "checkup".

ПОТВЪРЖДЕНИЕ: Само ако има генериран JSON, завършвай с: "🐾 Обнових напомнянето в Таблото Ви за [ДАТА].";

Отговаряйте ТОЧНО в този стил. Не се отклонявайте.`;

        // Try each model in the chain
        for (let i = 0; i < MODEL_CHAIN.length; i++) {
            const model = MODEL_CHAIN[i];
            const url = 'https://generativelanguage.googleapis.com/v1beta/models/' + model + ':generateContent?key=' + GEMINI_API_KEY;

            // Prepare request body (Gemma models don't always support system_instruction field)
            let bodyObj;
            if (model.includes('gemma')) {
                bodyObj = {
                    contents: [{
                        parts: [{ text: `SYSTEM INSTRUCTION: \n${systemInstruction} \n\nUSER MESSAGE: \n${userMessage} ` }]
                    }]
                };
            } else {
                bodyObj = {
                    system_instruction: {
                        parts: [{ text: systemInstruction }]
                    },
                    contents: [{
                        parts: [{ text: userMessage }]
                    }]
                };
            }

            try {
                const response = await fetch(url, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(bodyObj)
                });

                if (response.status === 403) {
                    console.error('Forbidden (403): This usually means Billing is required for EEA/Bulgaria.');
                    return '⚠️ <strong>Достъпът е отказан (403).</strong> В България (ЕИЗ) Google изисква активиран <strong>Billing</strong> в AI Studio, дори за безплатни лимити. Моля, проверете настройките си. 🐾';
                }

                if (response.status === 429 || response.status === 404) {
                    console.warn('Model ' + model + ' returned ' + response.status + '. Trying fallback...');
                    if (i === MODEL_CHAIN.length - 1) {
                        return 'Всички модели са заети или недостъпни. Моля, опитайте по-къвсно. 🐾';
                    }
                    continue;
                }

                if (!response.ok) {
                    const errorData = await response.json().catch(() => ({ msg: 'Parse error' }));
                    console.error('Gemini ' + model + ' error:', errorData);
                    if (i < MODEL_CHAIN.length - 1) continue;
                    throw new Error('API request failed');
                }

                const data = await response.json();
                if (!data.candidates || !data.candidates[0]) {
                    console.error('Unexpected API response:', data);
                    if (i < MODEL_CHAIN.length - 1) continue;
                    return 'AI не успя да генерира отговор в момента.';
                }
                return data.candidates[0].content.parts[0].text;

            } catch (error) {
                console.error('Fetch error for model ' + model + ':', error);
                if (i === MODEL_CHAIN.length - 1) {
                    return 'Възникна грешка при връзката с AI. Проверете интернет връзката си.';
                }
            }
        }
        return 'Всички опити за връзка с AI пропаднаха.';
    }

    // 7. Reminder Parser — extracts hidden tags, saves to localStorage, returns clean text
    function parseReminder(text) {
        const regex = /<!--REMINDER:(\{.*?\})-->/g;
        let match;
        let cleaned = text;

        while ((match = regex.exec(text)) !== null) {
            try {
                const data = JSON.parse(match[1]);
                const reminderDate = new Date();
                reminderDate.setDate(reminderDate.getDate() + data.days);

                saveReminderData({
                    type: data.type,
                    label: data.label,
                    date: reminderDate.toLocaleDateString('bg-BG'),
                    dateISO: reminderDate.toISOString(),
                    id: Date.now()
                });
            } catch (e) {
                console.warn('Failed to parse reminder:', e);
            }
        }

        cleaned = cleaned.replace(/<!--REMINDER:\{.*?\}-->/g, '');
        renderReminders();
        return cleaned;
    }

    // Render on page load
    renderReminders();

    // Handle Form Submit with 10-second Cooldown
    let cooldownActive = false;

    if (chatForm) {
        chatForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const message = chatInput.value.trim();
            if (!message || cooldownActive) return;

            // 1. Disable input, button, and activate cooldown
            const submitBtn = chatForm.querySelector('button[type="submit"]');
            chatInput.disabled = true;
            if (submitBtn) submitBtn.disabled = true;
            cooldownActive = true;

            // 2. Append User Message and clear input
            appendMessage(message, 'user');
            chatInput.value = '';

            // 3. Show Typing Indicator
            showTypingIndicator();

            try {
                // 4. Get AI Response (with fallback chain)
                const aiReply = await getAIResponse(message);

                // 5. Parse reminders from response and get clean text
                const cleanReply = parseReminder(aiReply);

                // 6. Remove Indicator and append clean Reply
                removeTypingIndicator();
                appendMessage(cleanReply, 'system');

                // 7. Success confirmation in Bulgarian for state update
                if (aiReply.includes('<!--REMINDER:')) {
                    console.log("Reminder detected and processed via saveReminderData");
                }
            } catch (err) {
                removeTypingIndicator();
                appendMessage("Възникна грешка при връзката с AI.", 'system');
            } finally {
                // 6. Re-enable input after response
                chatInput.disabled = false;
                if (submitBtn) submitBtn.disabled = false;
                chatInput.focus();

                // 7. Cooldown Timer (10 seconds) — conserves API limits
                setTimeout(() => {
                    cooldownActive = false;
                }, 10000);
            }
        });
    }

});

// Global LogOut function (called by button)
async function handleLogout() {
    sessionStorage.clear();
    localStorage.removeItem('active_cat_id');
    await signOut();
}

// Global Delete Reminder function
function deleteReminder(id) {
    let reminders = JSON.parse(localStorage.getItem('meowguard_reminders') || '[]');
    reminders = reminders.filter(r => r.id !== id);
    localStorage.setItem('meowguard_reminders', JSON.stringify(reminders));
    if (window.renderReminders) window.renderReminders();
}
