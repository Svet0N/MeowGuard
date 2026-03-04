// auth.js - Supabase Initialization & Helpers
const SUPABASE_URL = 'https://fzbhvfegkjwkwtgbftsy.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ6Ymh2ZmVna2p3a3d0Z2JmdHN5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE5NjcyOTYsImV4cCI6MjA4NzU0MzI5Nn0.o3oyt8-jt4oNEolCDg_nCFYkEzdxHL8VqcrMhfIO31c';

// Initialize Supabase Client
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// Helper for check session
const getSession = async () => {
    const { data: { session }, error } = await supabaseClient.auth.getSession();
    if (error) console.error("Session fetch error:", error);
    return session;
};

// Sign Out
const signOut = async () => {
    await supabaseClient.auth.signOut();
    window.location.href = "index.html";
};

const generatePremiumAvatar = (type, bgColor, iconColor) => {
    let path = '';
    if (type === 'hairless') {
        path = `<path fill="${iconColor}" d="M256,380 C150,380 100,260 100,260 L30,40 L180,150 C210,135 302,135 332,150 L482,40 L412,260 C412,260 362,380 256,380 Z"/><circle cx="190" cy="240" r="25" fill="${bgColor}"/><circle cx="322" cy="240" r="25" fill="${bgColor}"/>`;
    } else if (type === 'longhair') {
        path = `<path fill="${iconColor}" d="M256,380 C100,380 50,280 50,280 L40,80 L180,180 C210,165 302,165 332,180 L472,80 L462,280 C462,280 412,380 256,380 Z"/><path fill="${iconColor}" d="M50,280 L10,300 L60,330 L20,360 L90,360 Z"/><path fill="${iconColor}" d="M462,280 L502,300 L452,330 L492,360 L422,360 Z"/><circle cx="190" cy="260" r="25" fill="${bgColor}"/><circle cx="322" cy="260" r="25" fill="${bgColor}"/>`;
    } else if (type === 'mixed') {
        path = `<path fill="${iconColor}" d="M256,360 C150,360 100,260 100,260 L60,80 L180,160 C210,145 302,145 332,160 L452,80 L412,260 C412,260 362,360 256,360 Z"/><circle cx="190" cy="240" r="25" fill="${bgColor}"/><circle cx="322" cy="240" r="25" fill="${bgColor}"/><path fill="#ff6b6b" d="M380,320 C380,300 350,300 350,320 C350,340 380,370 380,370 C380,370 410,340 410,320 C410,300 380,300 380,320 Z"/>`;
    } else { // standard
        path = `<path fill="${iconColor}" d="M256,360 C150,360 100,260 100,260 L60,80 L180,160 C210,145 302,145 332,160 L452,80 L412,260 C412,260 362,360 256,360 Z"/><circle cx="190" cy="240" r="25" fill="${bgColor}"/><circle cx="322" cy="240" r="25" fill="${bgColor}"/>`;
    }

    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
        <circle cx="256" cy="256" r="256" fill="${bgColor}"/>
        <g transform="translate(0, 30)">
            ${path}
        </g>
    </svg>`;
    return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
};

const breedAvatars = {
    'Сфинкс': generatePremiumAvatar('hairless', '#f3e5f5', '#8e24aa'),
    'Мейн Куун': generatePremiumAvatar('longhair', '#e3f2fd', '#1565c0'),
    'Сибирска': generatePremiumAvatar('longhair', '#e0f7fa', '#00838f'),
    'Улична превъзходна': generatePremiumAvatar('standard', '#fff3e0', '#ef6c00'),
    'Европейска късокосместа': generatePremiumAvatar('standard', '#e8f5e9', '#2e7d32'),
    'Британска късокосместа': generatePremiumAvatar('standard', '#eceff1', '#455a64'),
    'Персийска': generatePremiumAvatar('longhair', '#fce4ec', '#ad1457'),
    'Сиамска': generatePremiumAvatar('standard', '#fff8e1', '#ff8f00'),
    'Шотландска клепоуха (Scottish Fold)': generatePremiumAvatar('standard', '#f3e5f5', '#6a1b9a'),
    'Бенгалска': generatePremiumAvatar('standard', '#fff3e0', '#d84315'),
    'Ангорска (Турска ангора)': generatePremiumAvatar('longhair', '#e8eaf6', '#283593'),
    'Руска синя': generatePremiumAvatar('standard', '#e3f2fd', '#1976d2'),
    'Рагдол': generatePremiumAvatar('longhair', '#e0f2f1', '#00695c'),
    'Бирманска': generatePremiumAvatar('standard', '#fbe9e7', '#d84315'),
    'Абисинска': generatePremiumAvatar('standard', '#fff8e1', '#f57f17'),
    'Екзотична късокосместа': generatePremiumAvatar('standard', '#fce4ec', '#c2185b'),
    'Норвежка горска': generatePremiumAvatar('longhair', '#e8f5e9', '#388e3c'),
    'Тайландска': generatePremiumAvatar('standard', '#fff3e0', '#e65100'),
    'Бурманска': generatePremiumAvatar('standard', '#efebe9', '#4e342e'),
    'Картезианска (Шартрьо)': generatePremiumAvatar('standard', '#eceff1', '#546e7a'),
    'Друга / Смесена': generatePremiumAvatar('mixed', '#f5f5f5', '#616161'),
    'default': generatePremiumAvatar('mixed', '#f5f5f5', '#616161')
};

const getAvatarUrl = (breed) => {
    return breedAvatars[breed] || breedAvatars['default'];
};
