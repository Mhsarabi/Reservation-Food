// ============================================================
// Admin JS - مدیریت داشبورد ادمین (فقط مدیریت)
// ============================================================

// ===========================
// متغیرهای سراسری
// ===========================
let selectedKey = null;
let foods = [];
let adminCalendar = null;

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
        console.error('❌ خطا در دریافت غذاها:', error);
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
        if (adminCalendar) {
            adminCalendar.menuData = menuData;
        }
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
        select.innerHTML = '<option value="">انتخاب غذا...</option>';
        
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
// نمایش اطلاعات غذای روز انتخاب شده
// ===========================
function displayFoodInfo(foodId) {
    const foodImageEl = document.getElementById('foodImage');
    const foodTitleEl = document.getElementById('foodTitle');
    const foodSelectEl = document.getElementById('foodSelect');

    if (!foodId) {
        if (foodSelectEl) {
            foodSelectEl.value = '';
        }

        if (foodImageEl) {
            foodImageEl.src = '/static/images/no-food.png';
        }

        if (foodTitleEl) {
            foodTitleEl.textContent = 'هنوز غذایی انتخاب نشده است.';
        }

        return;
    }

    const food = foods.find(
        f => String(f.id) === String(foodId)
    );

    if (food) {

        if (foodSelectEl) {
            foodSelectEl.value = String(food.id);
        }

        if (foodImageEl) {
            foodImageEl.src = getImageUrl(food.image);
        }

        if (foodTitleEl) {
            foodTitleEl.textContent = food.name;
        }

        console.log(`🍽️ نمایش غذا: ${food.name}`);
        console.log(`🎯 مقدار Select: ${foodSelectEl?.value}`);

    } else {

        if (foodSelectEl) {
            foodSelectEl.value = '';
        }

        if (foodImageEl) {
            foodImageEl.src = '/static/images/no-food.png';
        }

        if (foodTitleEl) {
            foodTitleEl.textContent = `غذای با ID: ${foodId} (حذف شده)`;
        }

        console.warn(`⚠️ غذا با ID ${foodId} در لیست موجود نیست`);
    }
}

// ===========================
// نمایش وضعیت رزروهای روز
// ===========================
function displayReservationStatus(dateKey) {
    const statusContainer = document.getElementById('reservationStatus');
    if (!statusContainer) return;
    
    // اگر کلید تاریخی وجود نداشت
    if (!dateKey) {
        statusContainer.innerHTML = `
            <div class="alert alert-secondary mt-3">
                <i class="bi bi-info-circle"></i> 
                برای مشاهده وضعیت رزروها، یک روز را انتخاب کنید.
            </div>
        `;
        return;
    }
    
    // دریافت اطلاعات رزرو از سرور
    fetch(`/menu/reservation-status/?date=${dateKey}`, {
        method: 'GET',
        headers: {
            'X-Requested-With': 'XMLHttpRequest',
        },
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            const count = data.reservation_count || 0;
            const users = data.users || [];
            
            let usersHtml = '';
            if (users.length > 0) {
                usersHtml = `
                    <div class="mt-2">
                        <small>کاربران رزرو کرده:</small>
                        <ul class="list-unstyled mb-0">
                            ${users.map(user => `<li><i class="bi bi-person"></i> ${user}</li>`).join('')}
                        </ul>
                    </div>
                `;
            }
            
            statusContainer.innerHTML = `
                <div class="alert ${count > 0 ? 'alert-warning' : 'alert-success'} mt-3">
                    <div class="d-flex justify-content-between align-items-center">
                        <div>
                            <i class="bi bi-people"></i> 
                            تعداد رزروها: <strong>${count} نفر</strong>
                            ${count > 0 ? '<span class="badge bg-danger ms-2">⚠️ قبل از حذف غذا توجه کنید</span>' : ''}
                        </div>
                        ${count > 0 ? `<span class="badge bg-info">${count} رزرو</span>` : ''}
                    </div>
                    ${usersHtml}
                </div>
            `;
        } else {
            statusContainer.innerHTML = `
                <div class="alert alert-secondary mt-3">
                    <i class="bi bi-info-circle"></i> 
                    هیچ رزروی برای این روز ثبت نشده است
                </div>
            `;
        }
    })
    .catch(error => {
        console.error('❌ خطا در دریافت وضعیت رزرو:', error);
        statusContainer.innerHTML = `
            <div class="alert alert-danger mt-3">
                <i class="bi bi-exclamation-triangle"></i> 
                خطا در دریافت اطلاعات رزرو
            </div>
        `;
    });
}

// ===========================
// بارگذاری اطلاعات روز (برای ادمین)
// ===========================
function loadDayData(year, month, day) {
    console.log(`📅 بارگذاری روز: ${year}/${month}/${day}`);
    
    // تبدیل به میلادی
    const g = jalaali.toGregorian(year, month, day);
    selectedKey = `${g.gy}-${String(g.gm).padStart(2, "0")}-${String(g.gd).padStart(2, "0")}`;
    
    console.log(`🔑 کلید انتخاب شده: ${selectedKey}`);
    
    // نمایش تاریخ شمسی
    const months = [
        "فروردین", "اردیبهشت", "خرداد", "تیر", "مرداد", 
        "شهریور", "مهر", "آبان", "آذر", "دی", "بهمن", "اسفند"
    ];
    
    const selectedDateEl = document.getElementById("selectedDate");
    if (selectedDateEl) {
        selectedDateEl.textContent = `${day} ${months[month - 1]} ${year}`;
    }
    
    // دریافت اطلاعات غذا برای این روز
    const menu = menuData[selectedKey];
    
    if (menu && menu.foodId) {
        console.log(`🍽️ غذا برای این روز: ID=${menu.foodId}`);
        displayFoodInfo(menu.foodId);
        // نمایش وضعیت رزرو
        displayReservationStatus(selectedKey);
    } else {
        console.log(`❌ هیچ غذایی برای این روز ثبت نشده است`);
        displayFoodInfo(null);
        displayReservationStatus(null);
    }
}

// ===========================
// ذخیره برنامه هفتگی (فقط ادمین)
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
    
    // تبدیل تاریخ‌ها
    const fromDateValue = toEnglishDigits(fromDate.value.trim());
    const toDateValue = toEnglishDigits(toDate.value.trim());
    const foodId = foodSelect.value;
    
    const fromParts = fromDateValue.split('/').map(Number);
    const toParts = toDateValue.split('/').map(Number);
    
    if (fromParts.some(isNaN) || toParts.some(isNaN)) {
        alert("⚠️ تاریخ وارد شده نامعتبر است.");
        return;
    }
    
    // تبدیل به میلادی
    const fromGreg = jalaali.toGregorian(fromParts[0], fromParts[1], fromParts[2]);
    const toGreg = jalaali.toGregorian(toParts[0], toParts[1], toParts[2]);
    
    const fromDateGreg = `${fromGreg.gy}-${String(fromGreg.gm).padStart(2, "0")}-${String(fromGreg.gd).padStart(2, "0")}`;
    const toDateGreg = `${toGreg.gy}-${String(toGreg.gm).padStart(2, "0")}-${String(toGreg.gd).padStart(2, "0")}`;
    
    // بررسی تاریخ شروع (نباید از امروز کمتر باشد)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const fromDateObj = new Date(fromGreg.gy, fromGreg.gm - 1, fromGreg.gd);
    fromDateObj.setHours(0, 0, 0, 0);
    
    if (fromDateObj < today) {
        alert("⚠️ امکان ثبت برنامه برای روزهای گذشته وجود ندارد.\nلطفاً تاریخ شروع را به روزهای آینده تغییر دهید.");
        return;
    }
    
    // دریافت روزهای انتخاب شده
    const weekdays = [];
    weekChecks.forEach(checkbox => {
        weekdays.push(checkbox.value);
    });
    
    // ارسال به سرور
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
            return fetchMenuData();
        } else {
            alert(`❌ ${data.message}`);
            throw new Error(data.message);
        }
    })
    .then(() => {
        // رندر مجدد تقویم
        if (adminCalendar) {
            adminCalendar.render();
        }
        // بارگذاری مجدد روز جاری
        const today = new Date();
        const jToday = jalaali.toJalaali(today);
        loadDayData(jToday.jy, jToday.jm, jToday.jd);
    })
    .catch(error => {
        console.error('❌ Error:', error);
        if (!error.message.includes('خطا در دریافت داده‌ها')) {
            alert(`❌ ${error.message}`);
        }
    })
    .finally(() => {
        if (saveBtn) {
            saveBtn.disabled = false;
            saveBtn.innerHTML = '<i class="bi bi-calendar-week"></i> ثبت برنامه';
        }
    });
}

// ===========================
// رویداد: انتخاب روز توسط ادمین
// ===========================
function onAdminDaySelected(event) {
    const { year, month, day } = event.detail;
    loadDayData(year, month, day);
}

// ===========================
// رویداد: تغییر غذا در سلکت
// ===========================
function onFoodSelectChange() {
    const foodId = this.value;

    console.log("🍽️ انتخاب غذا:", foodId);
    console.log("📋 گزینه‌های موجود:", [...this.options].map(o => ({
        value: o.value,
        text: o.text
    })));

    if (!foodId) {
        displayFoodInfo(null);
        return;
    }

    const food = foods.find(f => String(f.id) === String(foodId));

    console.log("🔎 غذای پیدا شده:", food);

    if (food) {
        displayFoodInfo(foodId);

        console.log("✅ بعد از displayFoodInfo:", this.value);
    } else {
        console.warn("⚠️ غذا پیدا نشد:", foodId);
        displayFoodInfo(null);
    }
}

// ===========================
// رویداد: ذخیره غذای روز (مدیریت - فقط ادمین)
// ===========================
function onSaveFood() {
    if (!selectedKey) {
        alert("⚠️ ابتدا یک روز را در تقویم انتخاب کنید.");
        return;
    }
    
    // بررسی اینکه تاریخ آینده باشد
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
    
    // تایید نهایی
    if (!confirm(`آیا مطمئن هستید که می‌خواهید این غذا را برای روز ${jSelected.jy}/${jSelected.jm}/${jSelected.jd} ثبت کنید؟`)) {
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
        // رندر مجدد تقویم
        if (adminCalendar) {
            adminCalendar.render();
        }
        // بارگذاری مجدد اطلاعات روز
        loadDayData(jSelected.jy, jSelected.jm, jSelected.jd);
    })
    .catch(error => {
        console.error('❌ Error:', error);
        if (!error.message.includes('خطا در دریافت داده‌ها')) {
            alert(`❌ ${error.message}`);
        }
    })
    .finally(() => {
        saveBtn.disabled = false;
        saveBtn.innerHTML = 'ذخیره غذای روز';
    });
}

// ===========================
// رویداد: حذف غذای روز (فقط ادمین)
// ===========================
function onDeleteFood() {
    if (!selectedKey) {
        alert("⚠️ ابتدا یک روز را در تقویم انتخاب کنید.");
        return;
    }
    
    if (!menuData[selectedKey] || !menuData[selectedKey].foodId) {
        alert("⚠️ برای این روز غذایی ثبت نشده است.");
        return;
    }
    
    // دریافت اطلاعات رزرو قبل از حذف
    fetch(`/menu/reservation-status/?date=${selectedKey}`, {
        method: 'GET',
        headers: {
            'X-Requested-With': 'XMLHttpRequest',
        },
    })
    .then(response => response.json())
    .then(data => {
        const hasReservation = data.success && data.reservation_count > 0;
        const count = data.reservation_count || 0;
        
        let confirmMessage = `آیا مطمئن هستید که می‌خواهید این غذا را حذف کنید؟`;
        if (hasReservation) {
            confirmMessage = `⚠️ هشدار: ${count} نفر برای این روز رزرو ثبت کرده‌اند.\n\n${confirmMessage}`;
        }
        
        if (!confirm(confirmMessage)) {
            return;
        }
        
        // ادامه عملیات حذف
        const csrfToken = getCSRFToken();
        const deleteBtn = document.getElementById("deleteFood");
        
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
        .then(response => {
            if (response.success) {
                alert(`✅ ${response.message}`);
                return fetchMenuData();
            } else {
                throw new Error(response.message);
            }
        })
        .then(() => {
            // رندر مجدد تقویم
            if (adminCalendar) {
                adminCalendar.render();
            }
            // بارگذاری مجدد اطلاعات روز
            const [gy, gm, gd] = selectedKey.split("-").map(Number);
            const jSelected = jalaali.toJalaali(gy, gm, gd);
            loadDayData(jSelected.jy, jSelected.jm, jSelected.jd);
        })
        .catch(error => {
            console.error('❌ Error:', error);
            alert(`❌ ${error.message}`);
        })
        .finally(() => {
            deleteBtn.disabled = false;
            deleteBtn.innerHTML = 'حذف غذای روز';
        });
    })
    .catch(error => {
        console.error('❌ خطا در بررسی رزرو:', error);
        alert('❌ خطا در بررسی وضعیت رزرو');
    });
}

// ===========================
// راه‌اندازی اولیه
// ===========================
function initApp() {
    console.log('🚀 شروع بارگذاری پنل مدیریت...');
    
    // ایجاد تقویم با حالت ادمین
    adminCalendar = new PersianCalendar("calendarGrid", true);
    
    // ثبت رویدادهای ادمین
    document.addEventListener("adminDaySelected", onAdminDaySelected);
    
    // ثبت رویدادهای UI
    const foodSelectEl = document.getElementById("foodSelect");
    if (foodSelectEl) {
        foodSelectEl.addEventListener("change", onFoodSelectChange);
    }
    
    const saveBtn = document.getElementById("saveFood");
    if (saveBtn) {
        saveBtn.addEventListener("click", onSaveFood);
    }
    
    const deleteBtn = document.getElementById("deleteFood");
    if (deleteBtn) {
        deleteBtn.addEventListener("click", onDeleteFood);
    }
    
    const saveWeeklyBtn = document.getElementById("saveWeekly");
    if (saveWeeklyBtn) {
        saveWeeklyBtn.addEventListener("click", saveWeeklyProgram);
    }
    
    // مخفی کردن دکمه‌های رزرو
    document.querySelectorAll('.reservation-btn, .reserve-btn, .btn-reserve, .reserve-food-btn').forEach(el => {
        el.style.display = 'none';
    });
    
    // نمایش پیام وضعیت ادمین
    const adminStatus = document.getElementById('adminStatus');
    if (adminStatus) {
        adminStatus.innerHTML = `
            <div class="alert alert-info mb-3">
                <i class="bi bi-shield-lock"></i> 
                <strong>شما در پنل مدیریت هستید.</strong> 
                امکان رزرو وجود ندارد.
                <br>
                <small>برای مدیریت غذاها از گزینه‌های زیر استفاده کنید.</small>
            </div>
        `;
    }
    
    // دریافت لیست غذاها
    fetchFoods()
        .then(() => {
            console.log('✅ لیست غذاها بارگذاری شد');
            updateAllFoodSelects();
        })
        .catch(error => {
            console.error('❌ خطا در بارگذاری غذاها:', error);
        });
    
    // دریافت داده‌های تقویم
    fetchMenuData()
        .then(() => {
            console.log('✅ داده‌های تقویم بارگذاری شد');
            // رندر تقویم
            if (adminCalendar) {
                adminCalendar.render();
            }
            
            // انتخاب و نمایش روز جاری به طور خودکار
            const today = new Date();
            const jToday = jalaali.toJalaali(today);
            console.log(`📅 روز جاری: ${jToday.jy}/${jToday.jm}/${jToday.jd}`);
            loadDayData(jToday.jy, jToday.jm, jToday.jd);
        })
        .catch(error => {
            console.error('❌ خطا در بارگذاری داده‌های تقویم:', error);
        });
    
    console.log('✅ پنل مدیریت بارگذاری شد');
}

// ===========================
// اجرای برنامه
// ===========================
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initApp);
} else {
    initApp();
}