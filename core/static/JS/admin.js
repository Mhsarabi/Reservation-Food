// ===========================
// متغیرهای سراسری
// ===========================
let foods = [];
let selectedKey = null;

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
        // پاک کردن menuData قبلی
        for (let key in menuData) {
            delete menuData[key];
        }
        // اضافه کردن داده‌های جدید
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
// نمایش پیام در مودال
// ===========================
function showFoodMessage(message, type = 'success') {
    const messageDiv = document.getElementById('foodMessage');
    if (!messageDiv) return;
    
    messageDiv.textContent = message;
    messageDiv.className = `alert alert-${type}`;
    messageDiv.classList.remove('d-none');
    
    clearTimeout(window.foodMessageTimeout);
    window.foodMessageTimeout = setTimeout(() => {
        messageDiv.classList.add('d-none');
    }, 5000);
}

// ===========================
// بروزرسانی لیست غذاها در همه Select ها
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

    // به‌روزرسانی تاریخ انتخاب شده
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
// بارگذاری غذا برای ویرایش
// ===========================
function loadSelectedFood() {
    const id = Number(document.getElementById("editFoodSelect").value);
    const food = foods.find(f => f.id === id);
    
    if (!food) {
        document.getElementById("editFoodName").value = "";
        document.getElementById("editFoodPreview").src = "/static/images/no-food.png";
        return;
    }
    
    document.getElementById("editFoodName").value = food.name;
    document.getElementById("editFoodPreview").src = getImageUrl(food.image);
}

// ===========================
// راه‌اندازی اولیه تقویم
// ===========================
const calendar = new PersianCalendar("calendarGrid", true);

// ===========================
// عناصر DOM
// ===========================
const fromDate = document.getElementById("fromDate");
const toDate = document.getElementById("toDate");
const weekChecks = document.querySelectorAll("#weekDays input[type='checkbox']");

// ===========================
// مقداردهی اولیه Datepicker ها
// ===========================
$("#fromDate").persianDatepicker({
    format: "YYYY/MM/DD",
    initialValue: false,
    persianDigit: false,
    autoClose: true
});

$("#toDate").persianDatepicker({
    format: "YYYY/MM/DD",
    initialValue: false,
    persianDigit: false,
    autoClose: true
});

$("#reportFromDate").persianDatepicker({
    format: "YYYY/MM/DD",
    initialValue: false,
    persianDigit: false,
    autoClose: true
});

$("#reportToDate").persianDatepicker({
    format: "YYYY/MM/DD",
    initialValue: false,
    persianDigit: false,
    autoClose: true
});

// ===========================
// بررسی حالت هفتگی
// ===========================
function isWeeklyMode() {
    return fromDate.value.trim() !== "" && toDate.value.trim() !== "";
}

// ===========================
// نمایش تاریخ امروز
// ===========================
const today = new Date();
document.getElementById("todayDate").textContent = today.toLocaleDateString("fa-IR");

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
// رویداد: ذخیره غذای روز (ارسال به سرور)
// ===========================
document.getElementById("saveFood").addEventListener("click", function () {
    if (!selectedKey) {
        alert("⚠️ ابتدا یک روز را در تقویم انتخاب کنید.");
        return;
    }

    // بررسی تاریخ
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
        console.log('✅ تقویم به‌روزرسانی شد.');
        
        // به‌روزرسانی اطلاعات نمایش داده شده
        const foodSelectEl = document.getElementById("foodSelect");
        const foodImageEl = document.getElementById("foodImage");
        const foodTitleEl = document.getElementById("foodTitle");
        
        const menu = menuData[selectedKey];
        if (menu && menu.foodId) {
            const food = foods.find(f => f.id === menu.foodId);
            if (food) {
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
// رویداد: حذف غذای روز (ارسال به سرور)
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

        // پاک کردن اطلاعات نمایش داده شده
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
// رویداد: تغییر رمز عبور
// ===========================
document.getElementById("changePassword").addEventListener("click", function (e) {
    e.preventDefault();
    const modal = new bootstrap.Modal(document.getElementById("changePasswordModal"));
    modal.show();
});

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
// ذخیره برنامه هفتگی
// ===========================
function saveWeeklyProgram() {
    const fromDate = document.getElementById("fromDate");
    const toDate = document.getElementById("toDate");
    const foodSelect = document.getElementById("foodSelect");
    const weekChecks = document.querySelectorAll("#weekDays input[type='checkbox']:checked");
    
    // اعتبارسنجی
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
    
    // دریافت مقادیر
    const fromDateValue = toEnglishDigits(fromDate.value.trim());
    const toDateValue = toEnglishDigits(toDate.value.trim());
    const foodId = foodSelect.value;
    
    console.log('📅 fromDate:', fromDateValue);
    console.log('📅 toDate:', toDateValue);
    
    // تبدیل تاریخ شمسی به میلادی
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
    
    // ✅ دریافت روزهای انتخاب شده
    const weekdays = [];
    weekChecks.forEach(checkbox => {
        weekdays.push(checkbox.value);
    });
    
    console.log('📆 weekdays (انتخاب شده):', weekdays);
    
    const csrfToken = getCSRFToken();
    const saveBtn = document.getElementById("saveWeekly");
    
    if (saveBtn) {
        saveBtn.disabled = true;
        saveBtn.innerHTML = '<span class="spinner-border spinner-border-sm"></span> در حال ثبت...';
    }
    
    // ✅ روش درست برای ارسال آرایه
    const formData = new URLSearchParams();
    formData.append('from_date', fromDateGreg);
    formData.append('to_date', toDateGreg);
    formData.append('food_id', foodId);
    
    // ✅ هر روز را با کلید یکسان اضافه کن
    weekdays.forEach(day => {
        formData.append('weekdays', day);
    });
    
    console.log('📤 داده‌های ارسالی:', formData.toString());
    
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
// رویداد: ذخیره برنامه هفتگی
// ===========================
document.getElementById("saveWeekly").addEventListener("click", function () {
    saveWeeklyProgram();
});

// ===========================
// رویداد: باز کردن مودال تعریف غذا
// ===========================
document.getElementById("manageFoods").addEventListener("click", function (e) {
    e.preventDefault();
    fetchFoods().then(() => {
        updateAllFoodSelects();
        const modal = new bootstrap.Modal(document.getElementById("foodModal"));
        modal.show();
    });
});

// ===========================
// رویداد: پیش‌نمایش تصویر غذا
// ===========================
document.getElementById("foodImageInput").addEventListener("change", function () {
    const preview = document.getElementById("foodPreview");
    
    if (!this.files.length) {
        preview.src = "/static/images/no-food.png";
        return;
    }
    
    const file = this.files[0];
    
    if (file.size > 2 * 1024 * 1024) {
        showFoodMessage('❌ حجم تصویر نباید بیشتر از 2 مگابایت باشد.', 'danger');
        this.value = '';
        preview.src = "/static/images/no-food.png";
        return;
    }
    
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
        showFoodMessage('❌ فقط فرمت‌های JPEG, PNG, GIF و WEBP مجاز هستند.', 'danger');
        this.value = '';
        preview.src = "/static/images/no-food.png";
        return;
    }
    
    const reader = new FileReader();
    reader.onload = function(e) {
        preview.src = e.target.result;
    };
    reader.onerror = function() {
        showFoodMessage('❌ خطا در خواندن فایل.', 'danger');
    };
    reader.readAsDataURL(file);
});

// ===========================
// رویداد: ذخیره غذای جدید (ارسال به سرور)
// ===========================
document.getElementById("saveNewFood").addEventListener("click", function () {
    const nameInput = document.getElementById("foodNameInput");
    const imageInput = document.getElementById("foodImageInput");
    const previewImg = document.getElementById("foodPreview");
    
    const name = nameInput.value.trim();
    const imageFile = imageInput.files[0];
    
    if (name === "") {
        showFoodMessage('❌ لطفاً نام غذا را وارد کنید.', 'danger');
        nameInput.focus();
        return;
    }
    
    const formData = new FormData();
    formData.append('food_name', name);
    
    if (imageFile) {
        if (imageFile.size > 2 * 1024 * 1024) {
            showFoodMessage('❌ حجم تصویر نباید بیشتر از 2 مگابایت باشد.', 'danger');
            imageInput.value = '';
            previewImg.src = "/static/images/no-food.png";
            return;
        }
        
        const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
        if (!allowedTypes.includes(imageFile.type)) {
            showFoodMessage('❌ فقط فرمت‌های JPEG, PNG, GIF و WEBP مجاز هستند.', 'danger');
            imageInput.value = '';
            previewImg.src = "/static/images/no-food.png";
            return;
        }
        
        formData.append('food_image', imageFile);
    }
    
    const saveBtn = this;
    saveBtn.disabled = true;
    saveBtn.innerHTML = '<span class="spinner-border spinner-border-sm"></span> در حال ثبت...';
    
    fetch('/menu/foods/create/', {
        method: 'POST',
        body: formData,
        headers: {
            'X-CSRFToken': getCSRFToken(),
        },
    })
    .then(response => {
        if (!response.ok) {
            if (response.status === 403) {
                throw new Error('شما دسترسی لازم برای این عملیات را ندارید.');
            }
            if (response.status === 400) {
                throw new Error('اطلاعات ارسالی معتبر نیست.');
            }
            throw new Error(`خطای سرور: ${response.status}`);
        }
        return response.json();
    })
    .then(data => {
        if (data.success) {
            showFoodMessage(`✅ ${data.message}`, 'success');
            
            const newFood = {
                id: data.food.id,
                name: data.food.name,
                image: getImageUrl(data.food.image)
            };
            foods.push(newFood);
            
            updateAllFoodSelects();
            document.getElementById('foodSelect').value = data.food.id;
            
            const foodImageEl = document.getElementById("foodImage");
            const foodTitleEl = document.getElementById("foodTitle");
            if (foodImageEl && foodTitleEl) {
                foodImageEl.src = newFood.image;
                foodTitleEl.textContent = newFood.name;
            }
            
            nameInput.value = '';
            imageInput.value = '';
            previewImg.src = "/static/images/no-food.png";
            
            setTimeout(() => {
                const modal = bootstrap.Modal.getInstance(document.getElementById('foodModal'));
                if (modal) {
                    modal.hide();
                }
                saveBtn.disabled = false;
                saveBtn.innerHTML = 'ثبت غذا';
            }, 1500);
            
        } else {
            showFoodMessage(`❌ ${data.message}`, 'danger');
            saveBtn.disabled = false;
            saveBtn.innerHTML = 'ثبت غذا';
        }
    })
    .catch(error => {
        console.error('Error:', error);
        showFoodMessage(`❌ ${error.message}`, 'danger');
        saveBtn.disabled = false;
        saveBtn.innerHTML = 'ثبت غذا';
    });
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
// گزارش ماهانه
// ===========================
document.getElementById("generateMonthlyReport").addEventListener("click", function() {
    const year = document.getElementById("reportYear").value;
    const month = document.getElementById("reportMonth").value;
    
    if (!year || !month) {
        alert("⚠️ لطفاً سال و ماه را انتخاب کنید.");
        return;
    }
    
    const btn = this;
    btn.disabled = true;
    btn.innerHTML = '<span class="spinner-border spinner-border-sm"></span> در حال ایجاد گزارش...';
    
    const csrfToken = getCSRFToken();
    
    fetch('/reservations/report-monthly/', {
        method: 'POST',
        headers: {
            'X-CSRFToken': csrfToken,
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
            year: year,
            month: month,
        }),
    })
    .then(response => {
        if (!response.ok) {
            throw new Error(`خطا: ${response.status}`);
        }
        return response.blob();
    })
    .then(blob => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `monthly_report_${year}_${month}.xlsx`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
    })
    .catch(error => {
        console.error('❌ Error:', error);
        alert(`❌ خطا در دریافت گزارش: ${error.message}`);
    })
    .finally(() => {
        btn.disabled = false;
        btn.innerHTML = 'دریافت گزارش ماهانه';
    });
});
// ===========================
// رویداد: باز کردن مودال گزارش گیری
// ===========================
document.getElementById("monthlyReport").addEventListener("click", function (e) {
    e.preventDefault();
    const modal = new bootstrap.Modal(document.getElementById("reportModal"));
    modal.show();
});
// ===========================
// گزارش بازه زمانی
// ===========================
document.getElementById("generateRangeReport").addEventListener("click", function() {
    const fromDate = document.getElementById("reportFromDate").value;
    const toDate = document.getElementById("reportToDate").value;
    
    if (!fromDate || !toDate) {
        alert("⚠️ لطفاً بازه زمانی را مشخص کنید.");
        return;
    }
    
    const btn = this;
    btn.disabled = true;
    btn.innerHTML = '<span class="spinner-border spinner-border-sm"></span> در حال ایجاد گزارش...';
    
    const csrfToken = getCSRFToken();
    
    // ✅ مسیر جدید
    fetch('/reservations/report-range/', {
        method: 'POST',
        headers: {
            'X-CSRFToken': csrfToken,
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
            from_date: fromDate,
            to_date: toDate,
        }),
    })
    .then(response => {
        if (!response.ok) {
            throw new Error(`خطا: ${response.status}`);
        }
        return response.blob();
    })
    .then(blob => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        const cleanFrom = fromDate.replace(/\//g, '-');
        const cleanTo = toDate.replace(/\//g, '-');
        a.download = `range_report_${cleanFrom}_to_${cleanTo}.xlsx`;
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
    })
    .catch(error => {
        console.error('❌ Error:', error);
        alert(`❌ خطا در دریافت گزارش: ${error.message}`);
    })
    .finally(() => {
        btn.disabled = false;
        btn.innerHTML = 'دریافت گزارش بازه زمانی';
    });
});

// ===========================
// رویداد: ویرایش غذاها
// ===========================
document.getElementById("editFoods").addEventListener("click", function(e) {
    e.preventDefault();
    
    fetchFoods().then(() => {
        const select = document.getElementById("editFoodSelect");
        select.innerHTML = "";
        
        foods.forEach(food => {
            const option = document.createElement("option");
            option.value = food.id;
            option.textContent = food.name;
            select.appendChild(option);
        });
        
        select.selectedIndex = -1;
        document.getElementById("editFoodName").value = "";
        document.getElementById("editFoodPreview").src = "/static/images/no-food.png";
        
        const modal = new bootstrap.Modal(document.getElementById("editFoodModal"));
        modal.show();
    });
});

// ===========================
// رویداد: انتخاب غذا برای ویرایش
// ===========================
document.getElementById("editFoodSelect").addEventListener("change", loadSelectedFood);

// ===========================
// رویداد: پیش‌نمایش تصویر در ویرایش
// ===========================
document.getElementById("editFoodImage").addEventListener("change", function() {
    if (!this.files.length) return;
    
    const reader = new FileReader();
    reader.onload = function(e) {
        document.getElementById("editFoodPreview").src = e.target.result;
    };
    reader.readAsDataURL(this.files[0]);
});

// ===========================
// رویداد: ذخیره تغییرات ویرایش 
// ===========================
document.getElementById("saveFoodChanges").addEventListener("click", function () {
    const select = document.getElementById("editFoodSelect");
    const nameInput = document.getElementById("editFoodName");
    const imageInput = document.getElementById("editFoodImage");
    const previewImg = document.getElementById("editFoodPreview");
    
    const id = Number(select.value);
    const newName = nameInput.value.trim();
    const imageFile = imageInput.files[0];
    
    if (!id) {
        alert("❌ لطفاً یک غذا را انتخاب کنید.");
        return;
    }
    
    if (newName === "") {
        alert("❌ نام غذا نمی‌تواند خالی باشد.");
        nameInput.focus();
        return;
    }
    
    const existingFood = foods.find(f => f.id === id);
    if (!existingFood) {
        alert("❌ غذا در لیست محلی یافت نشد.");
        return;
    }
    
    const formData = new FormData();
    formData.append('food_id', id);
    formData.append('food_name', newName);
    
    if (imageFile) {
        if (imageFile.size > 2 * 1024 * 1024) {
            alert('❌ حجم تصویر نباید بیشتر از 2 مگابایت باشد.');
            imageInput.value = '';
            previewImg.src = existingFood.image;
            return;
        }
        
        const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
        if (!allowedTypes.includes(imageFile.type)) {
            alert('❌ فقط فرمت‌های JPEG, PNG, GIF و WEBP مجاز هستند.');
            imageInput.value = '';
            previewImg.src = existingFood.image;
            return;
        }
        
        formData.append('food_image', imageFile);
    }
    
    const saveBtn = this;
    saveBtn.disabled = true;
    saveBtn.innerHTML = '<span class="spinner-border spinner-border-sm"></span> در حال ویرایش...';
    
    fetch('/menu/foods/update/', {
        method: 'POST',
        body: formData,
        headers: {
            'X-CSRFToken': getCSRFToken(),
        },
    })
    .then(response => {
        if (!response.ok) {
            if (response.status === 403) {
                throw new Error('شما دسترسی لازم برای این عملیات را ندارید.');
            }
            if (response.status === 404) {
                throw new Error('آدرس سرور پیدا نشد.');
            }
            throw new Error(`خطای سرور: ${response.status}`);
        }
        return response.json();
    })
    .then(data => {
        if (data.success) {            
            const foodIndex = foods.findIndex(f => f.id === data.food.id);
            if (foodIndex !== -1) {
                foods[foodIndex] = {
                    id: data.food.id,
                    name: data.food.name,
                    image: getImageUrl(data.food.image)
                };
            }
            
            updateAllFoodSelects();
            
            const foodSelectEl = document.getElementById("foodSelect");
            const foodImageEl = document.getElementById("foodImage");
            const foodTitleEl = document.getElementById("foodTitle");
            
            if (foodSelectEl && foodSelectEl.value == data.food.id) {
                if (foodImageEl) foodImageEl.src = getImageUrl(data.food.image);
                if (foodTitleEl) foodTitleEl.textContent = data.food.name;
            }
            
            nameInput.value = '';
            imageInput.value = '';
            previewImg.src = "/static/images/no-food.png";
            select.value = '';
            
            alert(`✅ ${data.message}`);
            
            const modal = bootstrap.Modal.getInstance(document.getElementById('editFoodModal'));
            if (modal) {
                modal.hide();
            }
            
            saveBtn.disabled = false;
            saveBtn.innerHTML = 'ذخیره تغییرات';
            
        } else {
            console.error('❌ خطای سرور:', data.message);
            alert(`❌ ${data.message}`);
            saveBtn.disabled = false;
            saveBtn.innerHTML = 'ذخیره تغییرات';
        }
    })
    .catch(error => {
        console.error('❌ خطا:', error);
        alert(`❌ ${error.message}`);
        saveBtn.disabled = false;
        saveBtn.innerHTML = 'ذخیره تغییرات';
    });
});

// ===========================
// رویداد: گزارش گیری - دریافت گزارش ماهانه
// ===========================
document.getElementById("generateMonthlyReport").addEventListener("click", function() {
    const year = document.getElementById("reportYear").value;
    const month = document.getElementById("reportMonth").value;
    
    if (!year || !month) {
        alert("لطفاً سال و ماه را انتخاب کنید.");
        return;
    }
    
    alert(`دریافت گزارش ماهانه ${year}/${month}`);
});

// ===========================
// بارگذاری اولیه
// ===========================
function initApp() {
    console.log('🚀 شروع بارگذاری پنل ادمین...');
    
    // 1. دریافت لیست غذاها
    fetchFoods().then(() => {
        updateAllFoodSelects();
    });
    
    // 2. دریافت داده‌های تقویم از سرور
    fetchMenuData().then(() => {
        // 3. رندر تقویم
        calendar.render();
        console.log('✅ تقویم بارگذاری شد.');
    });
}

// اجرای برنامه
initApp();