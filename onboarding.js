// onboarding.js - Onboarding logic with persistence and validation
let tempCatData = {
    name: '',
    age_years: 0,
    weight: 0,
    gender: '',
    breed: ''
};

let currentUserSession = null;

// Initialize from localStorage if exists
document.addEventListener('DOMContentLoaded', async () => {
    // Check if user is already logged in (adding a second cat)
    currentUserSession = await getSession();
    if (currentUserSession) {
        const step3Btn = document.querySelector('#step-3 .btn-primary.btn-full');
        if (step3Btn) {
            step3Btn.innerText = '🏁 Добави котето';
            step3Btn.removeAttribute('onclick'); // Remove nextStep(4)
            step3Btn.addEventListener('click', addCatForExistingUser);
        }

        // Hide the "Already have an account?" text on step 1
        const loginLink = document.querySelector('#step-1 a[href="login.html"]');
        if (loginLink && loginLink.parentElement) {
            loginLink.parentElement.style.display = 'none';
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
    tempCatData.breed = document.getElementById('catBreed').value;
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

    if (step === 4 && !tempCatData.gender) {
        alert('Моля, изберете пол.');
        return;
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

async function addCatForExistingUser() {
    if (!tempCatData.gender) {
        alert('Моля, изберете пол.');
        return;
    }

    const btn = document.querySelector('#step-3 .btn-primary.btn-full');
    btn.innerText = '⏳ Обработка...';
    btn.disabled = true;

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
        btn.innerText = '🏁 Добави котето';
        btn.disabled = false;
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
