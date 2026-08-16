// ============================================================
// Toast Notification System
// ============================================================

function showToast(type, message) {
    let container = document.getElementById('toastContainer');
    if (!container) {
        container = document.createElement('div');
        container.id = 'toastContainer';
        container.className = 'toast-container position-fixed bottom-0 end-0 p-3';
        document.body.appendChild(container);
    }
    
    const toastEl = document.createElement('div');
    const bgColor = type === 'success' ? 'bg-success' : 
                    type === 'warning' ? 'bg-warning' : 
                    'bg-danger';
    
    toastEl.className = `toast align-items-center text-white ${bgColor} border-0`;
    toastEl.setAttribute('role', 'alert');
    toastEl.setAttribute('aria-live', 'assertive');
    toastEl.setAttribute('aria-atomic', 'true');
    
    toastEl.innerHTML = `
        <div class="d-flex">
            <div class="toast-body">
                <i class="bi ${type === 'success' ? 'bi-check-circle' : type === 'warning' ? 'bi-exclamation-triangle' : 'bi-x-circle'} me-2"></i>
                ${message}
            </div>
            <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>
        </div>
    `;
    
    container.appendChild(toastEl);
    const toast = new bootstrap.Toast(toastEl, { delay: 3000 });
    toast.show();
    
    toastEl.addEventListener('hidden.bs.toast', function() {
        this.remove();
    });
}

// ============================================================
// CSRF Token Helper
// ============================================================

function getCsrfToken() {
    return document.getElementById("csrf-token")?.value || 
           document.querySelector('[name=csrfmiddlewaretoken]')?.value || '';
}

// ============================================================
// Fetch Menu Data from Server
// ============================================================

function fetchMenuData() {
    
    return fetch('/menu/daily-menus/', {
        method: 'GET',
        headers: {
            'X-Requested-With': 'XMLHttpRequest',
        },
    })
    .then(response => {
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
    })
    .then(data => {
        if (!window.menuData) {
            window.menuData = {};
        }
        
        // Clear existing data
        for (let key in window.menuData) {
            delete window.menuData[key];
        }
        Object.assign(window.menuData, data);
        
        const count = Object.keys(window.menuData).length;
        return window.menuData;
    })
    .catch(error => {
        console.error('❌ Error fetching menu data:', error);
        if (!window.menuData) {
            window.menuData = {};
        }
        return window.menuData;
    });
}

// ============================================================
// Today Date Display
// ============================================================

const today = new Date();
const todayDateEl = document.getElementById("todayDate");
if (todayDateEl) {
    todayDateEl.textContent = today.toLocaleDateString("fa-IR", {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
}

// ============================================================
// Month Name Helper
// ============================================================

function getMonthName(month) {
    const months = [
        "فروردین", "اردیبهشت", "خرداد", "تیر", "مرداد", "شهریور",
        "مهر", "آبان", "آذر", "دی", "بهمن", "اسفند"
    ];
    return months[month - 1] || month;
}

// ============================================================
// Day Selected Event Handler
// ============================================================

document.addEventListener("daySelected", function (event) {
    const selectedDate = document.getElementById("selectedDate");
    const foodImage = document.getElementById("foodImage");
    const foodName = document.getElementById("foodName");

    const { year, month, day } = event.detail;
    const g = jalaali.toGregorian(year, month, day);
    const key = `${g.gy}-${String(g.gm).padStart(2, "0")}-${String(g.gd).padStart(2, "0")}`;
    
    const menu = window.menuData ? window.menuData[key] : null;

    if (selectedDate) {
        selectedDate.textContent = `${day} ${getMonthName(month)} ${year}`;
    }

    if (menu && menu.foodName) {
        if (foodImage) foodImage.src = menu.image || "/static/images/no-food.png";
        if (foodName) foodName.textContent = menu.foodName;
    } else {
        if (foodImage) foodImage.src = "/static/images/no-food.png";
        if (foodName) foodName.textContent = "غذایی ثبت نشده است.";
    }
});

// ============================================================
// Update Reserved Count
// ============================================================

function updateReservedCount() {
    if (!window.menuData || !window.calendar) {
        const countEl = document.getElementById("reservedCount");
        if (countEl) countEl.textContent = "تعداد غذاهای رزرو شده این ماه: 0";
        return;
    }

    let mainCount = 0;
    let extraCount = 0;

    Object.entries(window.menuData).forEach(([key, menu]) => {
        const [gy, gm, gd] = key.split("-").map(Number);
        const j = jalaali.toJalaali(gy, gm, gd);

        if (j.jy === window.calendar.currentYear && 
            j.jm === window.calendar.currentMonth) {
            if (menu.reserved) {
                mainCount++;
                if (menu.has_extra_reservation) {
                    extraCount += menu.extra_reservation_count || 0;
                }
            }
        }
    });

    const reservedCountEl = document.getElementById("reservedCount");
    if (reservedCountEl) {
        let text = `تعداد غذاهای رزرو شده این ماه: ${mainCount}`;
        if (extraCount > 0) {
            text += ` (${extraCount} رزرو اضافه)`;
        }
        reservedCountEl.textContent = text;
    }
}

// ============================================================
// Reserve Month Button
// ============================================================

document.getElementById("reserveMonthBtn")?.addEventListener("click", async function(e) {
    e.preventDefault();
    e.stopPropagation();
    
    if (!window.calendar) {
        showToast('error', 'تقویم آماده نیست.');
        return;
    }

    const start = window.calendar.getMonthStartGregorian();
    const end = window.calendar.getMonthEndGregorian();

    const startKey = `${start.gy}-${String(start.gm).padStart(2, "0")}-${String(start.gd).padStart(2, "0")}`;
    const endKey = `${end.gy}-${String(end.gm).padStart(2, "0")}-${String(end.gd).padStart(2, "0")}`;

    const csrfToken = getCsrfToken();

    try {
        const response = await fetch("/reservations/reserve-month/", {
            method: "POST",
            headers: {
                "X-CSRFToken": csrfToken,
                "Content-Type": "application/x-www-form-urlencoded",
            },
            body: new URLSearchParams({
                start_date: startKey,
                end_date: endKey,
            }),
        });

        const data = await response.json();

        if (data.success) {
            await fetchMenuData();
            window.calendar.render();
            updateReservedCount();
            showToast('success', data.message || 'رزروهای ماه با موفقیت انجام شد.');
        } else {
            showToast('error', data.message || 'خطا در رزرو ماه.');
        }
    } catch (error) {
        console.error('❌ Error:', error);
        showToast('error', 'خطا در ارتباط با سرور');
    }
});

// ============================================================
// Cancel Month Button
// ============================================================

document.getElementById("cancelMonthBtn")?.addEventListener("click", async function(e) {
    e.preventDefault();
    e.stopPropagation();
    
    if (!window.calendar) {
        showToast('error', 'تقویم آماده نیست.');
        return;
    }

    const start = window.calendar.getMonthStartGregorian();
    const end = window.calendar.getMonthEndGregorian();

    const startKey = `${start.gy}-${String(start.gm).padStart(2, "0")}-${String(start.gd).padStart(2, "0")}`;
    const endKey = `${end.gy}-${String(end.gm).padStart(2, "0")}-${String(end.gd).padStart(2, "0")}`;

    const csrfToken = getCsrfToken();

    try {
        const response = await fetch("/reservations/cancel-month/", {
            method: "POST",
            headers: {
                "X-CSRFToken": csrfToken,
                "Content-Type": "application/x-www-form-urlencoded",
            },
            body: new URLSearchParams({
                start_date: startKey,
                end_date: endKey,
            }),
        });

        const data = await response.json();

        if (data.success) {
            await fetchMenuData();
            window.calendar.render();
            updateReservedCount();
            showToast('success', data.message || 'رزروهای ماه لغو شد.');
        } else {
            showToast('error', data.message || 'خطا در لغو رزروهای ماه.');
        }
    } catch (error) {
        console.error('❌ Error:', error);
        showToast('error', 'خطا در ارتباط با سرور');
    }
});

// ============================================================
// Change Password
// ============================================================

const passwordModal = new bootstrap.Modal(document.getElementById("passwordModal"));
const passwordMessage = document.getElementById("passwordMessage");

function showPasswordMessage(text, type) {
    if (!passwordMessage) return;
    passwordMessage.classList.remove("d-none", "alert-success", "alert-danger", "alert-warning");
    passwordMessage.classList.add(`alert-${type}`);
    passwordMessage.textContent = text;
}

document.getElementById("changePassword")?.addEventListener("click", function(e) {
    e.preventDefault();
    e.stopPropagation();
    
    if (passwordMessage) {
        passwordMessage.className = "alert d-none";
    }
    document.getElementById("oldPassword").value = "";
    document.getElementById("newPassword").value = "";
    document.getElementById("repeatPassword").value = "";
    passwordModal.show();
});

document.getElementById("savePassword")?.addEventListener("click", async function(e) {
    e.preventDefault();
    e.stopPropagation();
    
    const oldPassword = document.getElementById("oldPassword").value.trim();
    const newPassword = document.getElementById("newPassword").value.trim();
    const repeatPassword = document.getElementById("repeatPassword").value.trim();

    // Validation
    if (!oldPassword) {
        showPasswordMessage("رمز فعلی را وارد کنید.", "danger");
        return;
    }
    if (!newPassword) {
        showPasswordMessage("رمز جدید را وارد کنید.", "danger");
        return;
    }
    if (!repeatPassword) {
        showPasswordMessage("تکرار رمز جدید را وارد کنید.", "danger");
        return;
    }
    if (newPassword.length < 8) {
        showPasswordMessage("رمز جدید باید حداقل ۸ کاراکتر باشد.", "danger");
        return;
    }
    if (newPassword !== repeatPassword) {
        showPasswordMessage("تکرار رمز عبور صحیح نیست.", "danger");
        return;
    }
    if (oldPassword === newPassword) {
        showPasswordMessage("رمز جدید نباید با رمز فعلی یکسان باشد.", "danger");
        return;
    }

    const csrfToken = getCsrfToken();

    try {
        const response = await fetch("/change-password/", {
            method: "POST",
            headers: {
                "X-CSRFToken": csrfToken,
                "Content-Type": "application/x-www-form-urlencoded",
            },
            body: new URLSearchParams({
                old_password: oldPassword,
                new_password: newPassword,
                repeat_password: repeatPassword,
            }),
        });

        const data = await response.json();

        if (data.success) {
            showPasswordMessage(data.message, "success");
            document.getElementById("oldPassword").value = "";
            document.getElementById("newPassword").value = "";
            document.getElementById("repeatPassword").value = "";
            setTimeout(() => passwordModal.hide(), 1500);
        } else {
            showPasswordMessage(data.message || "خطا در تغییر رمز عبور.", "danger");
        }
    } catch (error) {
        showPasswordMessage("خطا در ارتباط با سرور.", "danger");
        console.error(error);
    }
});

// ============================================================
// Initialize Application
// ============================================================

async function initApp() {
    try {
        // Load menu data
        await fetchMenuData();
        
        // Create calendar instance
        window.calendar = new PersianCalendar("calendarGrid", false);
        window.calendar.render();
        
        // Update counts
        updateReservedCount();
        
    } catch (error) {
        console.error('❌ Error initializing app:', error);
        showToast('error', 'خطا در راه‌اندازی برنامه.');
    }
}

// Run after page load
if (document.readyState === 'complete') {
    initApp();
} else {
    document.addEventListener('DOMContentLoaded', initApp);
}