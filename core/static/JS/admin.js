// ============================================================
// Admin JS 
// ============================================================

// ===========================
// global variable
// ===========================
let selectedKey = null;
let foods = [];
let adminCalendar = null;

// ============================================================
// Toast Notification
// ============================================================

function showToast(message, type = "info", duration = 4000) {

    let container = document.getElementById("toastContainer");

    if (!container) {
        container = document.createElement("div");
        container.id = "toastContainer";

        container.style.position = "fixed";
        container.style.top = "20px";
        container.style.left = "20px";
        container.style.zIndex = "9999";
        container.style.direction = "rtl";

        document.body.appendChild(container);
    }


    const icons = {
        success: "bi-check-circle-fill",
        danger: "bi-x-circle-fill",
        warning: "bi-exclamation-triangle-fill",
        info: "bi-info-circle-fill"
    };

    if (!icons[type]) {
        type = "info";
    }


    const titles = {
        success: "موفق",
        danger: "خطا",
        warning: "هشدار",
        info: "اطلاع"
    };


    const toast = document.createElement("div");

    toast.className = `
        toast-message alert alert-${type}
        shadow-lg border-0
        d-flex align-items-center
        mb-3
    `;


    toast.style.minWidth = "330px";
    toast.style.maxWidth = "450px";
    toast.style.animation = "slideIn .4s ease";


    toast.innerHTML = `
        <div class="me-2">
            <i class="bi ${icons[type]} fs-4"></i>
        </div>

        <div class="flex-grow-1">
            <strong>${titles[type]}</strong>
            <br>
            <span>${message}</span>
        </div>

        <button class="btn-close"></button>
    `;


    container.appendChild(toast);


    toast.querySelector(".btn-close")
        .addEventListener("click", () => {
            removeToast(toast);
        });


    setTimeout(() => {
        removeToast(toast);
    }, duration);
}



function removeToast(toast){

    toast.style.animation = "slideOut .4s ease";

    setTimeout(()=>{
        toast.remove();
    },400);
}
// ===========================
//CSRF Token
// ===========================
function getCSRFToken() {
    const cookieValue = document.cookie
        .split('; ')
        .find(row => row.startsWith('csrftoken='))
        ?.split('=')[1];
    return cookieValue || '';
}


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
// list of foods
// ===========================
function fetchFoods() {
    
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
// get menu data
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
        for (let key in menuData) {
            delete menuData[key];
        }
        Object.assign(menuData, data);
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
// update foods
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
// show detail food
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
// show status of day
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

function saveWeeklyProgram() {
    const fromDate = document.getElementById("fromDate");
    const toDate = document.getElementById("toDate");
    const foodSelect = document.getElementById("foodSelect");
    const weekChecks = document.querySelectorAll("#weekDays input[type='checkbox']:checked");
    
    if (!fromDate || !fromDate.value.trim()) {
        showToast("لطفاً تاریخ شروع را انتخاب کنید.","warning");
        return;
    }
    
    if (!toDate || !toDate.value.trim()) {
       showToast("لطفاً تاریخ پایان را انتخاب کنید.","warning");
        return;
    }
    
    if (!foodSelect || foodSelect.value === "") {
       showToast("لطفاً یک غذا را انتخاب کنید.","warning");
        return;
    }
    
    if (weekChecks.length === 0) {
        showToast(" لطفاً حداقل یک روز از هفته را انتخاب کنید.","warning");
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
        showToast(" امکان ثبت برنامه برای روزهای گذشته وجود ندارد.\nلطفاً تاریخ شروع را به روزهای آینده تغییر دهید.","warning");
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
            showToast(data.message,"success");
            return fetchMenuData();
        } else {
            showToast(data.message,"danger");
            throw new Error(data.message);
        }
    })
    .then(() => {
        if (adminCalendar) {
            adminCalendar.render();
        }
        const today = new Date();
        const jToday = jalaali.toJalaali(today);
        loadDayData(jToday.jy, jToday.jm, jToday.jd);
    })
    .catch(error => {
        console.error('❌ Error:', error);
        if (!error.message.includes('خطا در دریافت داده‌ها')) {
            showToast(error.message,"danger");
        }
    })
    .finally(() => {
        if (saveBtn) {
            saveBtn.disabled = false;
            saveBtn.innerHTML = '<i class="bi bi-calendar-week"></i> ثبت برنامه';
        }
    });
}


function onAdminDaySelected(event) {
    const { year, month, day } = event.detail;
    loadDayData(year, month, day);
}


function onFoodSelectChange() {
    const foodId = this.value;

    if (!foodId) {
        displayFoodInfo(null);
        return;
    }

    const food = foods.find(f => String(f.id) === String(foodId));


    if (food) {
        displayFoodInfo(foodId);

    } else {
        displayFoodInfo(null);
    }
}


function onSaveFood() {
    if (!selectedKey) {
        showToast("⚠️ ابتدا یک روز را در تقویم انتخاب کنید.","warning");
        return;
    }
    
    const [gy, gm, gd] = selectedKey.split("-").map(Number);
    const jSelected = jalaali.toJalaali(gy, gm, gd);
    const selectedNumber = jSelected.jy * 10000 + jSelected.jm * 100 + jSelected.jd;
    
    const today = new Date();
    const jToday = jalaali.toJalaali(today);
    const todayNumber = jToday.jy * 10000 + jToday.jm * 100 + jToday.jd;
    
    if (selectedNumber < todayNumber) {
        showToast(` امکان ثبت غذا برای روزهای گذشته وجود ندارد.`,"warning");
        return;
    }
    
    const foodSelectEl = document.getElementById("foodSelect");
    if (!foodSelectEl || foodSelectEl.value === "") {
        showToast(" لطفاً یک غذا را از لیست انتخاب کنید.","warning");
        return;
    }
    
    // if (!confirm(`آیا مطمئن هستید که می‌خواهید این غذا را برای روز ${jSelected.jy}/${jSelected.jm}/${jSelected.jd} ثبت کنید؟`)) {
    //     return;
    // }
    
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
            showToast(data.message,"success");
            return fetchMenuData();
        } else {
            showToast(data.message,"danger");
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
            showToast(error.message,"danger");
        }
    })
    .finally(() => {
        saveBtn.disabled = false;
        saveBtn.innerHTML = 'ذخیره غذای روز';
    });
}


function onDeleteFood() {
    if (!selectedKey) {
        showToast("⚠️ ابتدا یک روز را در تقویم انتخاب کنید.","warning");
        return;
    }
    
    if (!menuData[selectedKey] || !menuData[selectedKey].foodId) {
        showToast("⚠️ برای این روز غذایی ثبت نشده است.","warning");
        return;
    }
    
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
                showToast(response.message,"success");
                return fetchMenuData();
            } else {
                throw new Error(response.message);
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
            showToast(error.message,"danger");
        })
        .finally(() => {
            deleteBtn.disabled = false;
            deleteBtn.innerHTML = 'حذف غذای روز';
        });
    })
    .catch(error => {
        console.error('❌ خطا در بررسی رزرو:', error);
        showToast('❌ خطا در بررسی وضعیت رزرو',"danger");
    });
}

// ===========================
// setup
// ===========================
function initApp() {    
    adminCalendar = new PersianCalendar("calendarGrid", true);
    
    document.addEventListener("adminDaySelected", onAdminDaySelected);
    
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
    
    document.querySelectorAll('.reservation-btn, .reserve-btn, .btn-reserve, .reserve-food-btn').forEach(el => {
        el.style.display = 'none';
    });
    
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
    
    fetchFoods()
        .then(() => {
            updateAllFoodSelects();
        })
        .catch(error => {
            console.error('❌ خطا در بارگذاری غذاها:', error);
        });
    
    fetchMenuData()
        .then(() => {
            if (adminCalendar) {
                adminCalendar.render();
            }
            
            const today = new Date();
            const jToday = jalaali.toJalaali(today);
            loadDayData(jToday.jy, jToday.jm, jToday.jd);
        })
        
    
}


if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initApp);
} else {
    initApp();
}