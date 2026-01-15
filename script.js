// --- ДАННЫЕ И НАСТРОЙКИ ---
let foodLog = [];
let favorites = [];
let settings = {
    curWeight: 80, targetWeight: 75, height: 175, age: 25, 
    gender: 'male', activity: '1.375', proteinMode: '2.0',
    goals: { kcal: 2000, p: 160, f: 80, c: 200 },
    apiKey: '',
    water: 0,
    lastLogin: '', 
    streak: 0,
    unlockedTrophies: [] // ID полученных ачивок
};

// Список всех доступных ачивок
const allTrophies = [
    { id: 'first_step', icon: '🏁', name: 'Первый шаг', desc: 'Добавь первый продукт' },
    { id: 'water_master', icon: '💧', name: 'Водолей', desc: 'Выпей 2.5л воды за день' },
    { id: 'protein_king', icon: '🥩', name: 'Белковый король', desc: 'Выполни норму белка' },
    { id: 'streak_3', icon: '🔥', name: 'В огне', desc: 'Серия 3 дня подряд' },
    { id: 'streak_7', icon: '🚀', name: 'Неделя', desc: 'Серия 7 дней подряд' },
    { id: 'perfect_day', icon: '💎', name: 'Идеал', desc: 'Попади в КБЖУ (±10%)' }
];

// --- ЗАПУСК ---
window.onload = function() {
    loadAll();
    checkStreak();
    renderSettings();
    renderFavs();
    renderTrophies();
    updateUI();
};

function loadAll() {
    if(localStorage.getItem('cz_set')) settings = { ...settings, ...JSON.parse(localStorage.getItem('cz_set')) };
    if(localStorage.getItem('cz_log')) foodLog = JSON.parse(localStorage.getItem('cz_log'));
    if(localStorage.getItem('cz_fav')) favorites = JSON.parse(localStorage.getItem('cz_fav'));
}

function saveAll() {
    localStorage.setItem('cz_set', JSON.stringify(settings));
    localStorage.setItem('cz_log', JSON.stringify(foodLog));
    localStorage.setItem('cz_fav', JSON.stringify(favorites));
}

// --- СИСТЕМА ДОСТИЖЕНИЙ ---
function checkAchievements(totals) {
    let newUnlock = false;

    // 1. Первый шаг
    if (foodLog.length > 0) unlock('first_step');

    // 2. Вода
    if (settings.water >= 2.5) unlock('water_master');

    // 3. Белок (если набрал >= 95% цели)
    if (totals.p >= settings.goals.p * 0.95) unlock('protein_king');

    // 4. Стрики
    if (settings.streak >= 3) unlock('streak_3');
    if (settings.streak >= 7) unlock('streak_7');

    // 5. Идеальный день (все показатели в рамках 90-110%)
    if (totals.k >= settings.goals.kcal * 0.9 && totals.k <= settings.goals.kcal * 1.1 &&
        totals.p >= settings.goals.p * 0.9 &&
        totals.f >= settings.goals.f * 0.9) {
        unlock('perfect_day');
    }

    function unlock(id) {
        if (!settings.unlockedTrophies.includes(id)) {
            settings.unlockedTrophies.push(id);
            newUnlock = true;
            // Находим название ачивки для алерта
            const tr = allTrophies.find(t => t.id === id);
            alert(`🏆 Новое достижение: ${tr.name}!\n${tr.desc}`);
        }
    }

    if (newUnlock) {
        saveAll();
        renderTrophies();
    }
}

function renderTrophies() {
    const div = document.getElementById('trophyList');
    div.innerHTML = "";
    allTrophies.forEach(tr => {
        const isUnlocked = settings.unlockedTrophies.includes(tr.id);
        div.innerHTML += `
            <div class="trophy-item ${isUnlocked ? 'unlocked' : ''}">
                <span class="trophy-icon">${tr.icon}</span>
                <span class="trophy-name">${tr.name}</span>
            </div>
        `;
    });
}

function toggleTrophies() {
    const p = document.getElementById('trophyPanel');
    const s = document.getElementById('settingsPanel');
    s.style.display = 'none'; // Скрываем настройки если открыты
    p.style.display = (p.style.display === 'block') ? 'none' : 'block';
}

// --- ЛОГИКА СТРИКОВ ---
function checkStreak() {
    const today = new Date().toDateString();
    if (settings.lastLogin !== today) {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        
        if (settings.lastLogin === yesterday.toDateString()) {
            settings.streak++;
        } else if (settings.lastLogin && settings.lastLogin !== today) {
            settings.streak = 1; // Сброс, если пропустил день
        } else if (!settings.lastLogin) {
            settings.streak = 1;
        }
        settings.lastLogin = today;
        settings.water = 0; // Новый день - сброс воды
        saveAll();
    }
    document.getElementById('streakVal').innerText = settings.streak;
}

// --- ВОДА ---
function addWater() {
    settings.water = parseFloat((settings.water + 0.25).toFixed(2));
    saveAll();
    updateUI();
}

// --- ИЗБРАННОЕ ---
function saveToFav() {
    const name = document.getElementById('inName').value;
    const k = document.getElementById('inKcal').value;
    const p = document.getElementById('inProt').value;
    const f = document.getElementById('inFat').value;
    const c = document.getElementById('inCarb').value;
    if(!name || !k) { alert("Заполни поля!"); return; }
    favorites.push({ name, k:+k, p:+p, f:+f, c:+c });
    saveAll();
    renderFavs();
}

function renderFavs() {
    const div = document.getElementById('favList');
    div.innerHTML = "";
    favorites.forEach(fav => {
        const chip = document.createElement('div');
        chip.className = 'fav-chip';
        chip.innerText = fav.name;
        chip.onclick = () => {
            document.getElementById('inName').value = fav.name;
            document.getElementById('inKcal').value = fav.k;
            document.getElementById('inProt').value = fav.p;
            document.getElementById('inFat').value = fav.f;
            document.getElementById('inCarb').value = fav.c;
        };
        div.appendChild(chip);
    });
}

function quickAdd(name, k, p, f, c) {
    foodLog.push({ id: Date.now(), name, k, p, f, c });
    saveAll();
    updateUI();
}

// --- НАСТРОЙКИ ---
function toggleSettings() {
    const p = document.getElementById('settingsPanel');
    const t = document.getElementById('trophyPanel');
    t.style.display = 'none';
    p.style.display = (p.style.display === 'block') ? 'none' : 'block';
}

function saveData() {
    settings.curWeight = parseFloat(document.getElementById('curWeight').value) || 0;
    settings.targetWeight = parseFloat(document.getElementById('targetWeight').value) || 0;
    settings.height = parseFloat(document.getElementById('height').value) || 0;
    settings.age = parseFloat(document.getElementById('age').value) || 0;
    settings.gender = document.getElementById('gender').value;
    settings.activity = document.getElementById('activity').value;
    settings.proteinMode = document.getElementById('proteinMode').value;
    settings.apiKey = document.getElementById('apiKey').value;
    
    // Ручные цели
    settings.goals.kcal = parseInt(document.getElementById('goalKcal').value) || 0;
    settings.goals.p = parseInt(document.getElementById('goalProt').value) || 0;
    settings.goals.f = parseInt(document.getElementById('goalFat').value) || 0;
    settings.goals.c = parseInt(document.getElementById('goalCarb').value) || 0;
    
    saveAll();
}

function renderSettings() {
    document.getElementById('curWeight').value = settings.curWeight;
    document.getElementById('targetWeight').value = settings.targetWeight;
    document.getElementById('height').value = settings.height;
    document.getElementById('age').value = settings.age;
    document.getElementById('gender').value = settings.gender;
    document.getElementById('activity').value = settings.activity;
    document.getElementById('proteinMode').value = settings.proteinMode;
    document.getElementById('goalKcal').value = settings.goals.kcal;
    document.getElementById('goalProt').value = settings.goals.p;
    document.getElementById('goalFat').value = settings.goals.f;
    document.getElementById('goalCarb').value = settings.goals.c;
    document.getElementById('apiKey').value = settings.apiKey;
}

function autoCalculate() {
    const tW = parseFloat(document.getElementById('targetWeight').value);
    const cW = parseFloat(document.getElementById('curWeight').value);
    const h = parseFloat(document.getElementById('height').value);
    const age = parseFloat(document.getElementById('age').value);
    
    if(!tW || !cW) { alert("Введи веса!"); return; }

    let bmr = (10 * tW) + (6.25 * h) - (5 * age) + (document.getElementById('gender').value==='male'?5:-161);
    const act = parseFloat(document.getElementById('activity').value);
    const pMode = parseFloat(document.getElementById('proteinMode').value);

    settings.goals.kcal = Math.round(bmr * act);
    settings.goals.p = Math.round(cW * pMode);
    settings.goals.f = Math.round(cW * 1.0);
    settings.goals.c = Math.round((settings.goals.kcal - settings.goals.p*4 - settings.goals.f*9)/4);
    if(settings.goals.c < 30) settings.goals.c = 30;

    renderSettings();
    saveData();
    updateUI();
}

// --- CRUD ---
function addFood() {
    const name = document.getElementById('inName').value || "Еда";
    const k = +document.getElementById('inKcal').value || 0;
    const p = +document.getElementById('inProt').value || 0;
    const f = +document.getElementById('inFat').value || 0;
    const c = +document.getElementById('inCarb').value || 0;
    
    if(k===0 && p===0) return;
    
    foodLog.push({ id: Date.now(), name, k, p, f, c });
    document.getElementById('inName').value = "";
    document.getElementById('inKcal').value = "";
    document.getElementById('inProt').value = "";
    document.getElementById('inFat').value = "";
    document.getElementById('inCarb').value = "";
    
    saveAll();
    updateUI();
}

function del(id) {
    foodLog = foodLog.filter(x => x.id !== id);
    saveAll();
    updateUI();
}

function resetDay() {
    if(confirm("Сбросить день?")) {
        foodLog = [];
        settings.water = 0;
        saveAll();
        updateUI();
    }
}

function updateUI() {
    let t = { k:0, p:0, f:0, c:0 };
    const list = document.getElementById('foodList');
    list.innerHTML = "";
    
    foodLog.slice().reverse().forEach(x => {
        t.k += x.k; t.p += x.p; t.f += x.f; t.c += x.c;
        list.innerHTML += `
        <li class="food-item">
            <div class="f-left"><h4>${x.name}</h4><p>${x.k} ккал</p></div>
            <div class="f-right">
                <div class="macro-tag">Б <span>${x.p}</span></div>
                <div class="macro-tag">Ж <span>${x.f}</span></div>
                <div class="macro-tag">У <span>${x.c}</span></div>
                <div class="del-btn" onclick="del(${x.id})">×</div>
            </div>
        </li>`;
    });

    document.getElementById('waterCount').innerText = settings.water;
    document.getElementById('txtLeft').innerText = settings.goals.kcal - t.k;
    setArc('arcKcal', t.k, settings.goals.kcal, 251);
    
    document.getElementById('txtProt').innerText = `${t.p}/${settings.goals.p}`;
    setArc('arcProt', t.p, settings.goals.p, 125);
    
    document.getElementById('txtFat').innerText = `${t.f}/${settings.goals.f}`;
    setArc('arcFat', t.f, settings.goals.f, 125);
    
    document.getElementById('txtCarb').innerText = `${t.c}/${settings.goals.c}`;
    setArc('arcCarb', t.c, settings.goals.c, 125);

    checkAchievements(t); // Проверяем ачивки после каждого обновления
}

function setArc(id, val, max, len) {
    let pct = val / max; if(pct<0)pct=0; if(pct>1)pct=1;
    document.getElementById(id).style.strokeDashoffset = len - (len * pct);
}

// --- AI ИСПРАВЛЕННЫЙ ---
async function askAI() {
    const key = settings.apiKey;
    if(!key) { alert("Введи OpenRouter API Key в настройках!"); toggleSettings(); return; }
    
    const btn = document.querySelector('.ai-btn');
    const name = document.getElementById('inName').value;
    if(!name) return;

    btn.innerText = "⏳";
    
    try {
        const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
            method: "POST",
            headers: { 
                "Authorization": `Bearer ${key}`, 
                "Content-Type": "application/json"
                // УБРАЛИ HTTP-Referer, так как он вызывает ошибку в браузере
            },
            body: JSON.stringify({
                model: "xiaomi/mimo-v2-flash:free",
                messages: [{ role: "user", content: `JSON БЖУ 100г продукта: "${name}". Пример: {"k":100,"p":10,"f":5,"c":20}. ТОЛЬКО JSON.` }]
            })
        });

        if (!res.ok) throw new Error(`Ошибка API: ${res.status}`);

        const data = await res.json();
        const jsonStr = data.choices[0].message.content;
        const json = JSON.parse(jsonStr.match(/\{[\s\S]*?\}/)[0]);

        document.getElementById('inKcal').value = json.k;
        document.getElementById('inProt').value = json.p;
        document.getElementById('inFat').value = json.f;
        document.getElementById('inCarb').value = json.c;

    } catch(e) {
        alert("Ошибка: " + e.message + "\nПроверь ключ или интернет.");
    } finally {
        btn.innerText = "✨";
    }
}

async function askAdvice() {
    const key = settings.apiKey;
    if(!key) { alert("Введи API Key в настройках!"); toggleSettings(); return; }

    // Считаем остатки
    let t = { k:0, p:0, f:0, c:0 };
    foodLog.forEach(x => { t.k += x.k; t.p += x.p; t.f += x.f; t.c += x.c; });
    
    const leftK = settings.goals.kcal - t.k;
    const btn = document.querySelector('.ai-advisor-btn');
    btn.innerText = "Думаю...";

    try {
        const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
            method: "POST",
            headers: { 
                "Authorization": `Bearer ${key}`, 
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                model: "deepseek/deepseek-r1-0528:free",
                messages: [{ role: "user", content: `Я на диете. Осталось: ${leftK} ккал. Белки цель: ${settings.goals.p}г (съел ${t.p}г). Посоветуй ОДНО блюдо/продукт, чтобы добрать норму. Кратко. и более доступное блюдо например курицы и тд` }]
            })
        });

        if (!res.ok) throw new Error(`Ошибка API: ${res.status}`);
        
        const data = await res.json();
        alert(data.choices[0].message.content);
        
    } catch(e) {
        alert("Ошибка соединения: " + e.message);
    } finally {
        btn.innerText = "💡 Совет AI";
    }
}