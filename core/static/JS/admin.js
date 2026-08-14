// ============================================================
// Admin JS - مدیریت داشبورد ادمین (فقط صفحه اصلی)
// ============================================================

// ===========================
// متغیرهای سراسری
// ===========================
let selectedKey = null;
let foods = [];

// ===========================
// دریافت CSRF Token
// ===========================
function getCSRFToken() {
    const cookieValue = document.cookie
        .split('; ')
        .find(row => row.startsWith('csrftoken='))
        ?.split('=')[1];
    return cookieValue || '';
}

// ===========================
// تابع کمکی: ساخت URL تصویر
// ===========================
function getImageUrl(imagePath) {
    if (!imagePath || imagePath === '') {
        return '/static/images/no-food.png';
    }
    
    if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
        return imagePath;
    }
    
    if (imagePath.startsWith('/media/')) {
        return imagePath;
    }
    
    if (imagePath.startsWith('media/')) {
        return '/' + imagePath;
    } 
    if (imagePath.includes('foods/')) {
        return '/media/' + imagePath;
    }
    
    return '/static/images/no-food.png';
}

// ===========================
// دریافت لیست غذاها از سرور
// ===========================
function fetchFoods() {
    console.log('📡 دریافت لیست غذاها از سرور...');
    
    return fetch('/menu/foods/list/', {
        method: 'GET',
        headers: {
            'X-Requested-With': 'XMLHttpRequest',
        },
    })
    .then(response => {
        if (!response.ok) {
            throw new Error(`خطا در دریافت غذاها: ${response.status}`);
        }
        return response.json();
    })
    .then(data => {
        if (data.success) {
            foods = data.foods;
            console.log(`✅ ${foods.length} غذا دریافت شد.`);
            return foods;
        } else {
            throw new Error('دریافت غذاها با خطا مواجه شد.');
        }
    })
    .catch(error => {
        console.error('❌ خطا:', error);
        foods = [];
        return foods;
    });
}

// ===========================
// دریافت menuData از سرور (API)
// ===========================
function fetchMenuData() {
    console.log('📡 دریافت داده‌های تقویم از سرور...');
    
    return fetch('/menu/daily-menus/', {
        method: 'GET',
        headers: {
            'X-Requested-With': 'XMLHttpRequest',
        },
    })
    .then(response => {
        if (!response.ok) {
            throw new Error(`خطا در دریافت داده‌ها: ${response.status}`);
        }
        return response.json();
    })
    .then(data => {
        for (let key in menuData) {
            delete menuData[key];
        }
        Object.assign(menuData, data);
        console.log(`✅ ${Object.keys(menuData).length} روز با غذا دریافت شد.`);
        return menuData;
    })
    .catch(error => {
        console.error('❌ خطا در دریافت داده‌های تقویم:', error);
        menuData = {};
        return menuData;
    });
}

// ===========================
// بروزرسانی لیست غذاها در Select
// ===========================
function updateAllFoodSelects() {
    const selectIds = ['foodSelect', 'editFoodSelect'];
    
    selectIds.forEach(selectId => {
        const select = document.getElementById(selectId);
        if (!select) return;
        
        const currentValue = select.value;
        select.innerHTML = '<option value=""></option>';
        
        foods.forEach(food => {
            const option = document.createElement('option');
            option.value = food.id;
            option.textContent = food.name;
            select.appendChild(option);
        });
        
        if (currentValue && foods.some(f => f.id == currentValue)) {
            select.value = currentValue;
        }
    });
}

// ===========================
// تبدیل اعداد فارسی به انگلیسی
// ===========================
function toEnglishDigits(str) {
    if (!str) return str;
    
    const map = {
        '۰': '0', '۱': '1', '۲': '2', '۳': '3', '۴': '4',
        '۵': '5', '۶': '6', '۷': '7', '۸': '8', '۹': '9'
    };
    
    return str.replace(/[۰-۹]/g, function(match) {
        return map[match];
    });
}

// ===========================
// بارگذاری اطلاعات روز
// ===========================
function loadDayData(year, month, day) {
    const g = jalaali.toGregorian(year, month, day);
    selectedKey = `${g.gy}-${String(g.gm).padStart(2, "0")}-${String(g.gd).padStart(2, "0")}`;
    
    const months = [
        "فروردین",
        "اردیبهشت",
        "خرداد",
        "تیر",
        "مرداد",
        "شهریور",
        "مهر",
        "آبان",
        "آذر",
        "دی",
        "بهمن",
        "اسفند"
    ];

    const selectedDateEl = document.getElementById("selectedDate");
    if (selectedDateEl) {
        selectedDateEl.textContent = `${day} ${months[month - 1]} ${year}`;
    }
    
    const menu = menuData[selectedKey];
    const foodSelectEl = document.getElementById("foodSelect");
    const foodImageEl = document.getElementById("foodImage");
    const foodTitleEl = document.getElementById("foodTitle");
    
    if (menu && menu.foodId) {
        const food = foods.find(f => f.id === menu.foodId);
        if (food) {
            if (foodSelectEl) foodSelectEl.value = food.id;
            if (foodImageEl) foodImageEl.src = getImageUrl(food.image);
            if (foodTitleEl) foodTitleEl.textContent = food.name;
        } else {
            if (foodSelectEl) foodSelectEl.value = menu.foodId;
            if (foodImageEl) foodImageEl.src = '/static/images/no-food.png';
            if (foodTitleEl) foodTitleEl.textContent = `غذای با ID: ${menu.foodId}`;
        }
    } else {
        if (foodSelectEl) foodSelectEl.value = "";
        if (foodImageEl) foodImageEl.src = "/static/images/no-food.png";
        if (foodTitleEl) foodTitleEl.textContent = "هنوز غذایی انتخاب نشده است.";
    }
}

// ===========================
// ذخیره برنامه هفتگی
// ===========================
function saveWeeklyProgram() {
    const fromDate = document.getElementById("fromDate");
    const toDate = document.getElementById("toDate");
    const foodSelect = document.getElementById("foodSelect");
    const weekChecks = document.querySelectorAll("#weekDays input[type='checkbox']:checked");
    
    if (!fromDate || !fromDate.value.trim()) {
        alert("⚠️ لطفاً تاریخ شروع را انتخاب کنید.");
        return;
    }
    
    if (!toDate || !toDate.value.trim()) {
        alert("⚠️ لطفاً تاریخ پایان را انتخاب کنید.");
        return;
    }
    
    if (!foodSelect || foodSelect.value === "") {
        alert("⚠️ لطفاً یک غذا را انتخاب کنید.");
        return;
    }
    
    if (weekChecks.length === 0) {
        alert("⚠️ لطفاً حداقل یک روز از هفته را انتخاب کنید.");
        return;
    }
    
    const fromDateValue = toEnglishDigits(fromDate.value.trim());
    const toDateValue = toEnglishDigits(toDate.value.trim());
    const foodId = foodSelect.value;
    
    const fromParts = fromDateValue.split('/').map(Number);
    const toParts = toDateValue.split('/').map(Number);
    
    if (fromParts.some(isNaN) || toParts.some(isNaN)) {
        alert("⚠️ تاریخ وارد شده نامعتبر است.");
        return;
    }
    
    const fromGreg = jalaali.toGregorian(fromParts[0], fromParts[1], fromParts[2]);
    const toGreg = jalaali.toGregorian(toParts[0], toParts[1], toParts[2]);
    
    const fromDateGreg = `${fromGreg.gy}-${String(fromGreg.gm).padStart(2, "0")}-${String(fromGreg.gd).padStart(2, "0")}`;
    const toDateGreg = `${toGreg.gy}-${String(toGreg.gm).padStart(2, "0")}-${String(toGreg.gd).padStart(2, "0")}`;
    

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const fromDateObj = new Date(fromGreg.gy, fromGreg.gm - 1, fromGreg.gd);
    fromDateObj.setHours(0, 0, 0, 0);
    
    if (fromDateObj < today) {
        alert("⚠️ امکان ثبت برنامه برای روزهای گذشته وجود ندارد.\nلطفاً تاریخ شروع را به روزهای آینده تغییر دهید.");
        return;
    }
    
    const weekdays = [];
    weekChecks.forEach(checkbox => {
        weekdays.push(checkbox.value);
    });
    
    const csrfToken = getCSRFToken();
    const saveBtn = document.getElementById("saveWeekly");
    
    if (saveBtn) {
        saveBtn.disabled = true;
        saveBtn.innerHTML = '<span class="spinner-border spinner-border-sm"></span> در حال ثبت...';
    }
    
    const formData = new URLSearchParams();
    formData.append('from_date', fromDateGreg);
    formData.append('to_date', toDateGreg);
    formData.append('food_id', foodId);
    
    weekdays.forEach(day => {
        formData.append('weekdays', day);
    });
    
    fetch('/menu/save-weekly/', {
        method: 'POST',
        headers: {
            'X-CSRFToken': csrfToken,
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: formData,
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            alert(`✅ ${data.message}`);
            fetchMenuData().then(() => {
                calendar.render();
            });
        } else {
            alert(`❌ ${data.message}`);
        }
    })
    .catch(error => {
        console.error('❌ Error:', error);
        alert(`❌ خطا در ارتباط با سرور: ${error.message}`);
    })
    .finally(() => {
        if (saveBtn) {
            saveBtn.disabled = false;
            saveBtn.innerHTML = '<i class="bi bi-calendar-week"></i> ثبت برنامه';
        }
    });
}

// ===========================
// راه‌اندازی اولیه تقویم
// ===========================
const calendar = new PersianCalendar("calendarGrid", true);

// ===========================
// رویداد: انتخاب روز از تقویم
// ===========================
document.addEventListener("daySelected", function (e) {
    loadDayData(e.detail.year, e.detail.month, e.detail.day);
});

// ===========================
// رویداد: تغییر غذا
// ===========================
const foodSelectEl = document.getElementById("foodSelect");
if (foodSelectEl) {
    foodSelectEl.addEventListener("change", function () {
        const food = foods.find(f => f.id == this.value);
        const foodImageEl = document.getElementById("foodImage");
        const foodTitleEl = document.getElementById("foodTitle");
        
        if (!food) {
            if (foodImageEl) foodImageEl.src = "/static/images/no-food.png";
            if (foodTitleEl) foodTitleEl.textContent = "هنوز غذایی انتخاب نشده است.";
            return;
        }
        
        if (foodImageEl) foodImageEl.src = getImageUrl(food.image);
        if (foodTitleEl) foodTitleEl.textContent = food.name;
    });
}

// ===========================
// رویداد: ذخیره غذای روز
// ===========================
document.getElementById("saveFood").addEventListener("click", function () {
    if (!selectedKey) {
        alert("⚠️ ابتدا یک روز را در تقویم انتخاب کنید.");
        return;
    }

    const [gy, gm, gd] = selectedKey.split("-").map(Number);
    const jSelected = jalaali.toJalaali(gy, gm, gd);
    const selectedNumber = jSelected.jy * 10000 + jSelected.jm * 100 + jSelected.jd;
    
    const today = new Date();
    const jToday = jalaali.toJalaali(today);
    const todayNumber = jToday.jy * 10000 + jToday.jm * 100 + jToday.jd;
    
    if (selectedNumber < todayNumber) {
        alert(`⚠️ امکان ثبت غذا برای روزهای گذشته وجود ندارد.`);
        return;
    }
    
    const foodSelectEl = document.getElementById("foodSelect");
    if (!foodSelectEl || foodSelectEl.value === "") {
        alert("⚠️ لطفاً یک غذا را از لیست انتخاب کنید.");
        return;
    }
    
    const csrfToken = getCSRFToken();
    const saveBtn = this;
    
    saveBtn.disabled = true;
    saveBtn.innerHTML = '<span class="spinner-border spinner-border-sm"></span> در حال ذخیره...';
    
    fetch('/menu/save-daily-food/', {
        method: 'POST',
        headers: {
            'X-CSRFToken': csrfToken,
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
            food_id: foodSelectEl.value,
            food_date: selectedKey,
        }),
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            alert(`✅ ${data.message}`);
            return fetchMenuData();
        } else {
            alert(`❌ ${data.message}`);
            throw new Error(data.message);
        }
    })
    .then(() => {
        calendar.render();
        
        const menu = menuData[selectedKey];
        if (menu && menu.foodId) {
            const food = foods.find(f => f.id === menu.foodId);
            if (food) {
                const foodSelectEl = document.getElementById("foodSelect");
                const foodImageEl = document.getElementById("foodImage");
                const foodTitleEl = document.getElementById("foodTitle");
                
                if (foodSelectEl) foodSelectEl.value = food.id;
                if (foodImageEl) foodImageEl.src = getImageUrl(food.image);
                if (foodTitleEl) foodTitleEl.textContent = food.name;
            }
        }
    })
    .catch(error => {
        console.error('❌ Error:', error);
        if (error.message !== 'خطا در دریافت داده‌ها') {
            alert(`❌ ${error.message}`);
        }
    })
    .finally(() => {
        saveBtn.disabled = false;
        saveBtn.innerHTML = 'ذخیره غذای روز';
    });
});

// ===========================
// رویداد: حذف غذای روز
// ===========================
document.getElementById("deleteFood").addEventListener("click", function () {
    if (!selectedKey) {
        alert("⚠️ ابتدا یک روز را در تقویم انتخاب کنید.");
        return;
    }
    
    if (!menuData[selectedKey] || !menuData[selectedKey].foodId) {
        alert("⚠️ برای این روز غذایی ثبت نشده است.");
        return;
    }
    
    const csrfToken = getCSRFToken();
    const deleteBtn = this;
    
    deleteBtn.disabled = true;
    deleteBtn.innerHTML = '<span class="spinner-border spinner-border-sm"></span> در حال حذف...';
    
    fetch('/menu/delete-daily-food/', {
        method: 'POST',
        headers: {
            'X-CSRFToken': csrfToken,
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
            food_date: selectedKey,
        }),
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {          
            return fetchMenuData();
        } else {
            throw new Error(data.message);
        }
    })
    .then(() => {
        calendar.render();

        const foodSelectEl = document.getElementById("foodSelect");
        const foodImageEl = document.getElementById("foodImage");
        const foodTitleEl = document.getElementById("foodTitle");
        
        if (foodSelectEl) foodSelectEl.value = '';
        if (foodImageEl) foodImageEl.src = '/static/images/no-food.png';
        if (foodTitleEl) foodTitleEl.textContent = 'هنوز غذایی انتخاب نشده است.';
    })
    .catch(error => {
        console.error('❌ Error:', error);
        if (error.message !== 'خطا در دریافت داده‌ها') {
            alert(`❌ ${error.message}`);
        }
    })
    .finally(() => {
        deleteBtn.disabled = false;
        deleteBtn.innerHTML = 'حذف غذای روز';
    });
});

// ===========================
// رویداد: ذخیره برنامه هفتگی
// ===========================
document.getElementById("saveWeekly").addEventListener("click", function () {
    saveWeeklyProgram();
});

// ===========================
// رویداد: بازنشانی پیام هنگام بسته شدن مودال
// ===========================
document.getElementById('foodModal').addEventListener('hidden.bs.modal', function () {
    const messageDiv = document.getElementById('foodMessage');
    if (messageDiv) {
        messageDiv.classList.add('d-none');
        messageDiv.textContent = '';
    }
    
    const saveBtn = document.getElementById('saveNewFood');
    if (saveBtn) {
        saveBtn.disabled = false;
        saveBtn.innerHTML = 'ثبت غذا';
    }
});

// ===========================
// بارگذاری اولیه
// ===========================
function initApp() {
    
    fetchFoods().then(() => {
        updateAllFoodSelects();
    });
    
    fetchMenuData().then(() => {
        calendar.render();
    });
}

initApp();