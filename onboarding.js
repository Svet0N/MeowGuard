// onboarding.js - Onboarding logic with persistence and validation
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
                breed: tempCatData.breed
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
                breed: tempCatData.breed
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
