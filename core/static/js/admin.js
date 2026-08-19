// ============================================================
// Admin JS 
// ============================================================

// ===========================
// Global variables
// ===========================
let selectedKey = null;
window.foods = [];
let menuData = {};
let adminCalendar = null;

// ============================================================
// Toast Notification System
// ============================================================

function showToast(message, type = "info", duration = 4000) {

    let container = document.getElementById("toastContainer");

    if (!container) {
        container = document.createElement("div");
        container.id = "toastContainer";
        document.body.appendChild(container);
    }

    const icons = {
        success: "bi-check-circle-fill",
        danger: "bi-x-circle-fill",
        warning: "bi-exclamation-triangle-fill",
        info: "bi-info-circle-fill"
    };

    const titles = {
        success: "موفق",
        danger: "خطا",
        warning: "هشدار",
        info: "اطلاع"
    };

    const toast = document.createElement("div");

    toast.className = `custom-toast toast-${type}`;

    toast.innerHTML = `
        <div class="toast-icon">
            <i class="bi ${icons[type] || icons.info}"></i>
        </div>

        <div class="toast-content">
            <strong class="toast-title">
                ${titles[type] || titles.info}
            </strong>

            <span class="toast-text">
                ${message}
            </span>
        </div>

        <button type="button" class="toast-close">
            <i class="bi bi-x"></i>
        </button>
    `;

    container.appendChild(toast);

    const closeBtn = toast.querySelector(".toast-close");

    closeBtn.addEventListener("click", () => {
        removeToast(toast);
    });

    setTimeout(() => {
        removeToast(toast);
    }, duration);
}

function removeToast(toast) {

    if (!toast || toast.dataset.removing === "true") {
        return;
    }

    toast.dataset.removing = "true";

    toast.style.animation = "slideOut .4s ease";

    setTimeout(() => {
        toast.remove();
    }, 400);
}

// ===========================
// Fetch menu data from server (همه داده‌ها)
// ===========================
function fetchMenuData() {
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
        // Clear existing data
        for (let key in menuData) {
            delete menuData[key];
        }
        Object.assign(menuData, data);
        
        // Update calendar
        if (adminCalendar) {
            adminCalendar.menuData = menuData;
        }
        
        return menuData;
    })
    .catch(error => {
        console.error('❌ خطا در دریافت داده‌های تقویم:', error);
        menuData = {};
        return menuData;
    });
}

// ===========================
// Convert Persian digits to English
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
// Display food info
// ===========================
function displayFoodInfo(foodId) {
    const foodImageEl = document.getElementById('foodImage');
    const foodTitleEl = document.getElementById('foodTitle');
    const foodSelectEl = document.getElementById('foodSelect');

    if (!foodId) {
        if (foodSelectEl) foodSelectEl.value = '';
        if (foodImageEl) foodImageEl.src = '/static/images/no-food.png';
        if (foodTitleEl) foodTitleEl.textContent = 'هنوز غذایی انتخاب نشده است.';
        return;
    }

    const food = window.foods.find(f => String(f.id) === String(foodId));

    if (food) {
        if (foodSelectEl) foodSelectEl.value = String(food.id);
        if (foodImageEl) foodImageEl.src = getImageUrl(food.image);
        if (foodTitleEl) foodTitleEl.textContent = food.name;
    } else {
        if (foodSelectEl) foodSelectEl.value = '';
        if (foodImageEl) foodImageEl.src = '/static/images/no-food.png';
        if (foodTitleEl) foodTitleEl.textContent = `غذای با ID: ${foodId} (حذف شده)`;
        console.warn(`⚠️ غذا با ID ${foodId} در لیست موجود نیست`);
    }
}

// ===========================
// Display reservation status
// ===========================
function displayReservationStatus(dateKey) {
    const statusContainer = document.getElementById('reservationStatus');
    if (!statusContainer) return;
    
    if (!dateKey) {
        statusContainer.innerHTML = `
            <div class="alert alert-secondary mt-3">
                <i class="bi bi-info-circle"></i> 
                برای مشاهده وضعیت رزروها، یک روز را انتخاب کنید.
            </div>
        `;
        return;
    }
    
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
// Load day data
// ===========================
function loadDayData(year, month, day) {
    const g = jalaali.toGregorian(year, month, day);
    selectedKey = `${g.gy}-${String(g.gm).padStart(2, "0")}-${String(g.gd).padStart(2, "0")}`;
    
    const months = [
        "فروردین", "اردیبهشت", "خرداد", "تیر", "مرداد", 
        "شهریور", "مهر", "آبان", "آذر", "دی", "بهمن", "اسفند"
    ];
    
    const selectedDateEl = document.getElementById("selectedDate");
    if (selectedDateEl) {
        selectedDateEl.textContent = `${day} ${months[month - 1]} ${year}`;
    }
    
    const menu = menuData[selectedKey];
    
    if (menu && menu.foodId) {
        displayFoodInfo(menu.foodId);
        displayReservationStatus(selectedKey);
    } else {
        displayFoodInfo(null);
        displayReservationStatus(null);
    }
}

// ===========================
// Save weekly program
// ===========================
function saveWeeklyProgram() {
    const fromDate = document.getElementById("fromDate");
    const toDate = document.getElementById("toDate");
    const foodSelect = document.getElementById("foodSelect");
    const weekChecks = document.querySelectorAll("#weekDays input[type='checkbox']:checked");
    
    if (!fromDate || !fromDate.value.trim()) {
        showToast("لطفاً تاریخ شروع را انتخاب کنید.", "warning");
        return;
    }
    if (!toDate || !toDate.value.trim()) {
        showToast("لطفاً تاریخ پایان را انتخاب کنید.", "warning");
        return;
    }
    if (!foodSelect || foodSelect.value === "") {
        showToast("لطفاً یک غذا را انتخاب کنید.", "warning");
        return;
    }
    if (weekChecks.length === 0) {
        showToast("لطفاً حداقل یک روز از هفته را انتخاب کنید.", "warning");
        return;
    }
    
    const fromDateValue = toEnglishDigits(fromDate.value.trim());
    const toDateValue = toEnglishDigits(toDate.value.trim());
    const foodId = foodSelect.value;
    
    const fromParts = fromDateValue.split('/').map(Number);
    const toParts = toDateValue.split('/').map(Number);
    
    if (fromParts.some(isNaN) || toParts.some(isNaN)) {
        showToast("تاریخ وارد شده نامعتبر است.", "warning");
        return;
    }
    
    const fromGreg = jalaali.toGregorian(fromParts[0], fromParts[1], fromParts[2]);
    const toGreg = jalaali.toGregorian(toParts[0], toParts[1], toParts[2]);
    
    const fromDateGreg = `${fromGreg.gy}-${String(fromGreg.gm).padStart(2, "0")}-${String(fromGreg.gd).padStart(2, "0")}`;
    const toDateGreg = `${toGreg.gy}-${String(toGreg.gm).padStart(2, "0")}-${String(toGreg.gd).padStart(2, "0")}`;
    
    const admin_today = new Date();
    admin_today.setHours(0, 0, 0, 0);
    const fromDateObj = new Date(fromGreg.gy, fromGreg.gm - 1, fromGreg.gd);
    fromDateObj.setHours(0, 0, 0, 0);
    
    if (fromDateObj < admin_today) {
        showToast("امکان ثبت برنامه برای روزهای گذشته وجود ندارد.", "warning");
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
            showToast(data.message, "success");
            return fetchMenuData();
        } else {
            showToast(data.message, "danger");
            throw new Error(data.message);
        }
    })
    .then(() => {
        if (adminCalendar) {
            adminCalendar.render();
        }
        const admin_today = new Date();
        const jToday = jalaali.toJalaali(admin_today);
        loadDayData(jToday.jy, jToday.jm, jToday.jd);
    })
    .catch(error => {
        console.error('❌ Error:', error);
        if (!error.message.includes('خطا در دریافت داده‌ها')) {
            showToast(error.message, "danger");
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
// Admin day selected handler
// ===========================
function onAdminDaySelected(event) {

    const { year, month, day } = event.detail;

    loadDayData(year, month, day);
}

// ===========================
// Food select change handler
// ===========================
function onFoodSelectChange() {
    const foodId = this.value;
    if (!foodId) {
        displayFoodInfo(null);
        return;
    }
    const food = window.foods.find(f => String(f.id) === String(foodId));
    if (food) {
        displayFoodInfo(foodId);
    } else {
        displayFoodInfo(null);
    }
}

// ===========================
// Save daily food handler
// ===========================
function onSaveFood() {
    if (!selectedKey) {
        showToast("ابتدا یک روز را در تقویم انتخاب کنید.", "warning");
        return;
    }
    
    const [gy, gm, gd] = selectedKey.split("-").map(Number);
    const jSelected = jalaali.toJalaali(gy, gm, gd);
    const selectedNumber = jSelected.jy * 10000 + jSelected.jm * 100 + jSelected.jd;
    
    const admin_today = new Date();
    const jToday = jalaali.toJalaali(admin_today);
    const todayNumber = jToday.jy * 10000 + jToday.jm * 100 + jToday.jd;
    
    if (selectedNumber < todayNumber) {
        showToast("امکان ثبت غذا برای روزهای گذشته وجود ندارد.", "warning");
        return;
    }
    
    const foodSelectEl = document.getElementById("foodSelect");
    if (!foodSelectEl || foodSelectEl.value === "") {
        showToast("لطفاً یک غذا را از لیست انتخاب کنید.", "warning");
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
            showToast(data.message, "success");
            return fetchMenuData();
        } else {
            showToast(data.message, "danger");
            throw new Error(data.message);
        }
    })
    .then(() => {
        if (adminCalendar) {
            adminCalendar.render();
        }
        loadDayData(jSelected.jy, jSelected.jm, jSelected.jd);
    })
    .catch(error => {
        console.error('❌ Error:', error);
        if (!error.message.includes('خطا در دریافت داده‌ها')) {
            showToast(error.message, "danger");
        }
    })
    .finally(() => {
        saveBtn.disabled = false;
        saveBtn.innerHTML = 'ذخیره غذای روز';
    });
}

// ===========================
// Delete daily food handler
// ===========================
function onDeleteFood() {
    if (!selectedKey) {
        showToast("ابتدا یک روز را در تقویم انتخاب کنید.", "warning");
        return;
    }
    if (!menuData[selectedKey] || !menuData[selectedKey].foodId) {
        showToast("برای این روز غذایی ثبت نشده است.", "warning");
        return;
    }
    
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
            showToast(response.message || 'غذای روز با موفقیت حذف شد.', "success");
            return fetchMenuData();
        } else {
            throw new Error(response.message || 'خطا در حذف غذا');
        }
    })
    .then(() => {
        if (adminCalendar) {
            adminCalendar.render();
        }
        const [gy, gm, gd] = selectedKey.split("-").map(Number);
        const jSelected = jalaali.toJalaali(gy, gm, gd);
        loadDayData(jSelected.jy, jSelected.jm, jSelected.jd);
    })
    .catch(error => {
        console.error('❌ Error:', error);
        showToast(error.message, "danger");
    })
    .finally(() => {
        deleteBtn.disabled = false;
        deleteBtn.innerHTML = 'حذف غذای روز';
    });
}

// ===========================
// Initialize app
// ===========================
async function initApp() {
    try {


        await fetchFoods();

        updateAllFoodSelects();

        await fetchMenuData();

        window.menuData = menuData;

        adminCalendar = new PersianCalendar(
            "calendarGrid",
            true
        );

        adminCalendar.menuData = menuData;

        adminCalendar.render();
        initAdminEventListeners();

        const admin_today = new Date();
        const jToday = jalaali.toJalaali(admin_today);

        loadDayData(
            jToday.jy,
            jToday.jm,
            jToday.jd
        );

    } catch (error) {
        console.error(
            "❌ خطا در راه‌اندازی پنل مدیریت:",
            error
        );

        showToast(
            "خطا در راه‌اندازی پنل مدیریت.",
            "danger"
        );
    }
}

// ===========================
// Register event listeners
// ===========================
function initAdminEventListeners() {

    const saveFoodBtn = document.getElementById("saveFood");
    const deleteFoodBtn = document.getElementById("deleteFood");
    const saveWeeklyBtn = document.getElementById("saveWeekly");
    const foodSelect = document.getElementById("foodSelect");


    if (saveFoodBtn) {
        saveFoodBtn.addEventListener("click", onSaveFood);
    }

    if (deleteFoodBtn) {
        deleteFoodBtn.addEventListener("click", onDeleteFood);
    }

    if (saveWeeklyBtn) {
        saveWeeklyBtn.addEventListener("click", saveWeeklyProgram);
    }

    if (foodSelect) {
        foodSelect.addEventListener("change", onFoodSelectChange);
    }

    document.addEventListener("adminDaySelected", onAdminDaySelected);

}

// ===========================
// DOM ready check
// ===========================
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initApp);
} else {
    initApp();
}