// onboarding.js - Onboarding logic with persistence and validation
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

function getAvatarUrl(breed) {
    return breedAvatars[breed] || breedAvatars['default'];
}

let tempCatData = {
    name: '',
    age_years: 0,
    weight: 0,
    gender: '',
    breed: '',
    avatar_url: ''
};

let currentUserSession = null;

// Initialize from localStorage if exists
document.addEventListener('DOMContentLoaded', async () => {
    // Check if user is already logged in (adding a second cat)
    currentUserSession = await getSession();
    if (currentUserSession) {
        // Hide the "Already have an account?" text on step 1
        const loginLink = document.querySelector('#step-1 a[href="login.html"]');
        if (loginLink && loginLink.parentElement) {
            loginLink.parentElement.style.display = 'none';
        }

        // Modify Step 4 for logged-in users
        const step4Title = document.querySelector('#step-4 .onboarding-title h2');
        const step4Subtitle = document.querySelector('#step-4 .onboarding-title p');
        if (step4Title) step4Title.innerText = 'Запази котето 🐾';
        if (step4Subtitle) step4Subtitle.innerText = 'Всичко е готово, нека добавим новия член на семейството!';

        // Hide email and password inputs
        const emailGroup = document.getElementById('userEmail').closest('.form-group');
        const passwordGroup = document.getElementById('userPassword').closest('.form-group');
        if (emailGroup) emailGroup.style.display = 'none';
        if (passwordGroup) passwordGroup.style.display = 'none';

        // Change the finish button
        const finishBtn = document.getElementById('finish-btn');
        if (finishBtn) {
            finishBtn.innerText = 'Запази новото коте';
            finishBtn.removeAttribute('onclick');
            finishBtn.addEventListener('click', saveNewCat);
        }
    }

    const savedData = localStorage.getItem('onboarding_temp_data');
    if (savedData) {
        tempCatData = JSON.parse(savedData);
        // Fill fields if we are on step 1
        if (tempCatData.name) document.getElementById('catName').value = tempCatData.name;
        if (tempCatData.age_years) document.getElementById('catAge').value = tempCatData.age_years;
        if (tempCatData.weight) document.getElementById('catWeight').value = tempCatData.weight;
        if (tempCatData.breed) document.getElementById('catBreed').value = tempCatData.breed;

        // Setup breed logic
        const breedSelect = document.getElementById('catBreed');
        const customBreedInput = document.getElementById('custom-breed-input');
        if (breedSelect) {
            breedSelect.addEventListener('change', (e) => {
                const preview = document.getElementById('breed-avatar-preview');
                const breed = e.target.value;
                if (preview) {
                    preview.src = breedAvatars[breed] || breedAvatars['default'];
                    preview.style.opacity = '1';
                    preview.style.transform = 'scale(1)';
                }

                if (breed === 'Друга / Смесена') {
                    customBreedInput.style.display = 'block';
                    // Trigger reflow for animation
                    void customBreedInput.offsetWidth;
                    customBreedInput.style.opacity = '1';
                } else {
                    customBreedInput.style.opacity = '0';
                    setTimeout(() => {
                        customBreedInput.style.display = 'none';
                    }, 500);
                }
            });
            breedSelect.dispatchEvent(new Event('change')); // animate the initially selected breed
        }

        // Re-select gender if saved
        if (tempCatData.gender) {
            const radio = document.querySelector(`.radio-box input[value="${tempCatData.gender}"]`);
            if (radio) selectGender(tempCatData.gender, radio.parentElement);
        }
    }
});

function saveProgress() {
    tempCatData.name = document.getElementById('catName').value;
    tempCatData.age_years = parseInt(document.getElementById('catAge').value) || 0;
    tempCatData.weight = parseFloat(document.getElementById('catWeight').value) || 0;
    const breedSelectVal = document.getElementById('catBreed').value;
    const customBreedVal = document.getElementById('custom-breed-input').value;
    tempCatData.breed = breedSelectVal === 'Друга / Смесена' && customBreedVal.trim() ? customBreedVal.trim() : breedSelectVal;
    tempCatData.avatar_url = getAvatarUrl(breedSelectVal);
    localStorage.setItem('onboarding_temp_data', JSON.stringify(tempCatData));
}

function nextStep(step) {
    // Validation
    if (step === 2) {
        const nameInput = document.getElementById('catName');
        if (!nameInput.value.trim()) {
            showError(nameInput, 'Моля, въведете име на котето.');
            return;
        }
    }

    if (step === 3) {
        const age = document.getElementById('catAge').value;
        const weight = document.getElementById('catWeight').value;
        if (!age || !weight) {
            alert('Моля, попълнете възраст и тегло.');
            return;
        }
    }

    if (step === 4) {
        if (!tempCatData.gender) {
            alert('Моля, изберете пол.');
            return;
        }

        const breedSelect = document.getElementById('catBreed');
        const customBreedInput = document.getElementById('custom-breed-input');
        if (breedSelect && breedSelect.value === 'Друга / Смесена' && !customBreedInput.value.trim()) {
            showError(customBreedInput, 'Моля, въведете порода.');
            return;
        }
    }

    saveProgress();

    // Show step
    document.querySelectorAll('.step').forEach(s => s.classList.remove('active'));
    const targetStep = document.getElementById(`step-${step}`);
    if (targetStep) targetStep.classList.add('active');

    // Progress bar
    const progress = document.getElementById('progress-bar');
    if (progress) progress.style.width = `${step * 25}%`;

    window.scrollTo(0, 0);
}

function prevStep(step) {
    saveProgress();
    document.querySelectorAll('.step').forEach(s => s.classList.remove('active'));
    document.getElementById(`step-${step}`).classList.add('active');
    document.getElementById('progress-bar').style.width = `${step * 25}%`;
}

function selectGender(gender, element) {
    tempCatData.gender = gender;
    document.querySelectorAll('.radio-box').forEach(b => b.classList.remove('active'));
    element.classList.add('active');
    saveProgress();
}

function showError(input, message) {
    input.classList.add('error');
    input.style.animation = 'shake 0.5s';
    setTimeout(() => input.style.animation = '', 500);
    alert(message);
}

async function saveNewCat() {
    const finishBtn = document.getElementById('finish-btn');
    finishBtn.innerText = '⏳ Обработка...';
    finishBtn.disabled = true;

    saveProgress();

    try {
        const { error: catError } = await supabaseClient
            .from('cats')
            .insert([{
                user_id: currentUserSession.user.id,
                name: tempCatData.name,
                age_years: tempCatData.age_years,
                weight: tempCatData.weight,
                gender: tempCatData.gender,
                breed: tempCatData.breed,
                avatar_url: tempCatData.avatar_url
            }]);

        if (catError) throw catError;

        localStorage.removeItem('onboarding_temp_data');
        sessionStorage.removeItem('has_seen_picker'); // Show picker on dashboard
        window.location.href = "dashboard.html";
    } catch (err) {
        alert("Грешка: " + err.message);
        finishBtn.innerText = 'Запази новото коте';
        finishBtn.disabled = false;
    }
}

async function finishOnboarding() {
    const finishBtn = document.getElementById('finish-btn');
    const emailInput = document.getElementById('userEmail');
    const passwordInput = document.getElementById('userPassword');

    const email = emailInput.value.trim();
    const password = passwordInput.value;

    if (!email || password.length < 6) {
        alert('Паролата трябва да е поне 6 символа.');
        return;
    }

    finishBtn.innerText = '⏳ Обработка...';
    finishBtn.disabled = true;

    saveProgress();

    try {
        const { data: authData, error: authError } = await supabaseClient.auth.signUp({
            email,
            password,
        });

        if (authError) throw authError;

        const userId = authData.user.id;

        const { error: catError } = await supabaseClient
            .from('cats')
            .insert([{
                user_id: userId,
                name: tempCatData.name,
                age_years: tempCatData.age_years,
                weight: tempCatData.weight,
                gender: tempCatData.gender,
                breed: tempCatData.breed,
                avatar_url: tempCatData.avatar_url
            }]);

        if (catError) throw catError;

        localStorage.removeItem('onboarding_temp_data');
        window.location.href = "dashboard.html";
    } catch (err) {
        alert("Грешка: " + err.message);
        finishBtn.innerText = 'Завърши';
        finishBtn.disabled = false;
    }
}
