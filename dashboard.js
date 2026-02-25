// dashboard.js - Logic for fetching and displaying cat data, sidebar, and profile picking
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
        // Save to session storage to persist across reloads
        sessionStorage.setItem('selected_cat_id', cat.id);

        // Populate Main Dashboard
        const name = cat.name || 'Твоето коте';
        document.getElementById('main-cat-avatar').src = `https://api.dicebear.com/7.x/bottts/svg?seed=${name}&backgroundColor=F8F9FA`;
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
                    <img src="https://api.dicebear.com/7.x/bottts/svg?seed=${cat.name}&backgroundColor=F8F9FA" class="sidebar-cat-avatar">
                    <span class="sidebar-cat-name">${cat.name}</span>
                `;
                catItem.addEventListener('click', () => {
                    activateCatProfile(cat);
                    toggleSidebar(false);
                });
                sidebarCatList.appendChild(catItem);
            });

            // 4. Handle Profile Selection Logic (Netflix Style)
            const savedCatId = sessionStorage.getItem('selected_cat_id');
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
                            <img src="https://api.dicebear.com/7.x/bottts/svg?seed=${cat.name}&backgroundColor=F8F9FA" class="profile-avatar">
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
});

// Global LogOut function (called by button)
async function handleLogout() {
    sessionStorage.clear();
    await signOut();
}
