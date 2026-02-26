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

    document.getElementById('sidebar-owner-email').innerText = userEmail;

    const hideLoader = () => {
        if (loader) {
            loader.style.opacity = '0';
            setTimeout(() => loader.style.display = 'none', 500);
        }
    };

    // 2. Sidebar Toggles
    const toggleSidebar = (show) => {
        if (show) {
            sidebar.classList.add('active');
            sidebarOverlay.classList.add('active');
            document.body.style.overflow = 'hidden';
        } else {
            sidebar.classList.remove('active');
            sidebarOverlay.classList.remove('active');
            document.body.style.overflow = '';
        }
    };

    menuBtn.addEventListener('click', () => toggleSidebar(true));
    closeSidebarBtn.addEventListener('click', () => toggleSidebar(false));
    sidebarOverlay.addEventListener('click', () => toggleSidebar(false));

    // Display selected cat data function
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
    };

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
    const symptomCheckerBtn = document.getElementById('symptom-checker-btn');
    const aiChatOverlay = document.getElementById('ai-chat-overlay');
    const closeChatBtn = document.getElementById('close-chat');
    const chatForm = document.getElementById('chat-form');
    const chatInput = document.getElementById('chat-input');
    const chatMessages = document.getElementById('chat-messages');

    let isChatInitialized = false;

    // Toggle Chat Overlay
    if (symptomCheckerBtn) {
        symptomCheckerBtn.addEventListener('click', (e) => {
            e.preventDefault();
            aiChatOverlay.classList.remove('ai-chat-overlay-hidden');
            document.body.style.overflow = 'hidden'; // prevent bg scroll

            // Send initial medical disclaimer if first time opening
            if (!isChatInitialized) {
                appendMessage('Това е AI асистент, а не ветеринар. При спешност се свържете с лекар.', 'system disclaimer');
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

    // 6. Gemini AI Symptom Checker (Model Fallback Chain - Adjusted for User Quotas)
    const MODEL_CHAIN = ['gemini-3-flash', 'gemini-2.5-flash', 'gemini-2.5-flash-lite', 'gemma-3-27b'];

    async function getAIResponse(userMessage) {
        const catName = document.getElementById('cat-name-display').innerText || 'Котка';
        const catBreed = document.getElementById('sidebar-breed').innerText || 'Неизвестна';
        const catAge = document.getElementById('val-age').innerText || 'Неизвестна';

        const isFirstMessage = chatMessages.children.length <= 1;

        // System instruction — High-Precision Vet Consultant (Updated)
        const systemInstruction = `Ти си ветеринарен консултант на MeowGuard. Твоята задача е да помагаш на собственика на котката ${catName} (${catBreed}, ${catAge}).

ПРАВИЛА ЗА ПОВЕДЕНИЕ:
1. КАТЕГОРИЗАЦИЯ НА ЗАЯВКАТА:
   - АКО потребителят съобщава за симптом (повръщане, болка): Обясни вероятната причина (напр. диетична грешка) и дай план за действие.
   - АКО потребителят планира процедура (ваксина, кастрация): НЕ давай медицински съвети. Потвърди, пожелай успех и генерирай JSON тага.
   - АКО потребителят коригира дата: Потвърди актуализацията и генерирай нов JSON таг със СЪЩИЯ "type".

2. ИЗЧИСЛЯВАНЕ НА ДАТИ (Днес е ${new Date().toLocaleDateString('bg-BG')}):
   - "след 3 месеца" = 90 дни.
   - "след месец" = 30 дни.
   - "следващата седмица" = 7 дни.
   - Винаги пресмятай финалната дата спрямо днешната и я съобщавай в чата.

3. ФОРМАТ И ОГРАНИЧЕНИЯ:
   - Максимум 2 абзаца, разделени с ЕДИН <br>.
   - Използвай <strong> за ключови термини и <em> за действия.
   - Използвай точно 2 емоджита (едно в началото, едно в края).
   - ЗАБРАНЕНИ ДУМИ: "носталгия", "въпластват", "хладзагубителна", "празнородни", "дрехтиът".

4. АВТОМАТИЧНИ НАПОМНЯНИЯ (JSON):
Генерирайте скрит таг В КРАЯ на отговора:
- Ваксинация → <!--REMINDER:{"type":"vaccination","days":365,"label":"Ваксинация: ${catName}"}-->
- Кастрация (планирана) → <!--REMINDER:{"type":"neutering","days":БРОЙ_ДНИ,"label":"Предстояща кастрация: ${catName}"}-->
- Кастрация (преглед след) → <!--REMINDER:{"type":"checkup","days":7,"label":"Контролен преглед: ${catName}"}-->
- Обезпаразитяване → <!--REMINDER:{"type":"deworming","days":30,"label":"Обезпаразитяване: ${catName}"}-->
Ако потребителят коригира дата, използвайте СЪЩИЯ "type", за да се обнови съществуващото напомняне.

ПОТВЪРЖДЕНИЕ: Винаги казвайте в чата: "🐾 Записах/Обнових напомняне за [събитието] на [дата].";

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
                        parts: [{ text: `SYSTEM INSTRUCTION:\n${systemInstruction}\n\nUSER MESSAGE:\n${userMessage}` }]
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

                if (response.status === 429 || response.status === 404) {
                    console.warn('Model ' + model + ' returned ' + response.status + '. Trying fallback...');
                    if (i === MODEL_CHAIN.length - 1) {
                        return 'Всички модели са заети. Моля, изчакайте минута и опитайте отново. 🐾';
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
                return data.candidates[0].content.parts[0].text;

            } catch (error) {
                if (i === MODEL_CHAIN.length - 1) {
                    console.error('All models failed:', error);
                    return 'Възникна грешка при връзката с AI.';
                }
            }
        }
        return 'Възникна грешка при връзката с AI.';
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

                const reminders = JSON.parse(localStorage.getItem('meowguard_reminders') || '[]');

                // Check for duplicate type
                const existingIndex = reminders.findIndex(r => r.type === data.type);

                const reminderObj = {
                    label: data.label,
                    type: data.type,
                    date: reminderDate.toLocaleDateString('bg-BG'),
                    dateISO: reminderDate.toISOString(),
                    id: existingIndex !== -1 ? reminders[existingIndex].id : Date.now()
                };

                if (existingIndex !== -1) {
                    // Update existing
                    reminders[existingIndex] = reminderObj;
                    console.log(`Updated reminder of type ${data.type}`);
                } else {
                    // Add new
                    reminders.push(reminderObj);
                    console.log(`Added new reminder of type ${data.type}`);
                }

                localStorage.setItem('meowguard_reminders', JSON.stringify(reminders));
            } catch (e) {
                console.warn('Failed to parse reminder:', e);
            }
        }

        cleaned = cleaned.replace(/<!--REMINDER:\{.*?\}-->/g, '');
        renderReminders();
        return cleaned;
    }

    // 8. Render Reminders on dashboard
    function renderReminders() {
        const list = document.getElementById('reminders-list');
        const countEl = document.getElementById('reminders-count');
        const emptyEl = document.getElementById('reminders-empty');
        if (!list) return;

        const reminders = JSON.parse(localStorage.getItem('meowguard_reminders') || '[]');

        // Sort by date ascending
        reminders.sort((a, b) => new Date(a.dateISO) - new Date(b.dateISO));

        // Translation mapping and Icon map
        const typeTranslations = {
            'vaccination': 'Ваксинация',
            'neutering': 'Кастрация',
            'deworming': 'Обезпаразитяване',
            'checkup': 'Контролен преглед'
        };
        const icons = { vaccination: '💉', deworming: '💧', checkup: '🩺', neutering: '✂️' };

        if (reminders.length === 0) {
            list.innerHTML = '<p class="reminders-empty" style="color: var(--text-muted); font-size: 0.9rem; text-align: center; padding: 15px 0;">Няма записани напомняния. Споделете медицинско събитие в чата! 🐾</p>';
            if (countEl) countEl.textContent = '0';
            return;
        }

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

// Global Delete Reminder function (called by inline onclick in reminder items)
function deleteReminder(id) {
    let reminders = JSON.parse(localStorage.getItem('meowguard_reminders') || '[]');
    reminders = reminders.filter(r => r.id !== id);
    localStorage.setItem('meowguard_reminders', JSON.stringify(reminders));

    // Re-render the reminders list
    const list = document.getElementById('reminders-list');
    const countEl = document.getElementById('reminders-count');
    if (!list) return;

    const typeTranslations = {
        'vaccination': 'Ваксинация',
        'neutering': 'Кастрация',
        'deworming': 'Обезпаразитяване',
        'checkup': 'Контролен преглед'
    };
    const icons = { vaccination: '💉', deworming: '💧', checkup: '🩺', neutering: '✂️' };

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
