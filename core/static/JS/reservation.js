// ===========================
// دریافت CSRF Token
// ===========================
const csrfToken = document.getElementById("csrf-token")?.value || '';

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
        console.log('📡 وضعیت پاسخ:', response.status);
        if (!response.ok) {
            throw new Error(`خطا در دریافت داده‌ها: ${response.status}`);
        }
        return response.json();
    })
    .then(data => {
        console.log('📡 داده‌های دریافتی:', data);
        
        // ✅ استفاده از window.menuData
        if (typeof window.menuData === 'undefined') {
            window.menuData = {};
        }
        
        // پاک کردن menuData قبلی
        for (let key in window.menuData) {
            delete window.menuData[key];
        }
        // اضافه کردن داده‌های جدید
        Object.assign(window.menuData, data);
        
        const count = Object.keys(window.menuData).length;
        console.log(`✅ ${count} روز با غذا دریافت شد.`);
        console.log('📅 window.menuData:', window.menuData);
        
        return window.menuData;
    })
    .catch(error => {
        console.error('❌ خطا در دریافت داده‌های تقویم:', error);
        if (typeof window.menuData === 'undefined') {
            window.menuData = {};
        }
        window.menuData = {};
        return window.menuData;
    });
}

// ===========================
// Today
// ===========================
const today = new Date();
const foodImage = document.getElementById("foodImage");
const reserveBtn = document.getElementById("reserveBtn");

const todayDateEl = document.getElementById("todayDate");
if (todayDateEl) {
    todayDateEl.textContent = today.toLocaleDateString("fa-IR");
}

// ===========================
// Calendar
// ===========================
console.log('📅 ایجاد تقویم...');
const calendar = new PersianCalendar("calendarGrid", false);
console.log('📅 تقویم ایجاد شد.');

// ===========================
// Update Reserve Button
// ===========================
function updateReserveButton(status) {
    if (!reserveBtn) return;
    
    reserveBtn.classList.remove(
        "btn-success",
        "btn-danger",
        "btn-secondary"
    );

    switch (status) {
        case "available":
            reserveBtn.disabled = false;
            reserveBtn.classList.add("btn-success");
            reserveBtn.textContent = "رزرو غذا";
            break;

        case "reserved":
            reserveBtn.disabled = false;
            reserveBtn.classList.add("btn-danger");
            reserveBtn.textContent = "لغو رزرو";
            break;

        case "closed":
            reserveBtn.disabled = true;
            reserveBtn.classList.add("btn-secondary");
            reserveBtn.textContent = "مهلت رزرو به پایان رسیده";
            break;
    }
}

// ===========================
// Update Reserved Count
// ===========================
function updateReservedCount() {
    let count = 0;

    console.log('📊 محاسبه تعداد رزروها...');
    console.log('📊 window.menuData:', window.menuData);

    if (window.menuData) {
        Object.entries(window.menuData).forEach(([key, menu]) => {
            const [gy, gm, gd] = key.split("-").map(Number);
            const j = jalaali.toJalaali(gy, gm, gd);

            if (
                j.jy === calendar.currentYear &&
                j.jm === calendar.currentMonth &&
                menu.reserved
            ) {
                count++;
            }
        });
    }

    console.log(`📊 تعداد رزروهای این ماه: ${count}`);

    const reservedCountEl = document.getElementById("reservedCount");
    if (reservedCountEl) {
        reservedCountEl.textContent = `تعداد غذاهای رزرو شده این ماه: ${count}`;
    }
}

// ===========================
// بارگذاری اولیه
// ===========================
function initApp() {
    console.log('🚀 شروع بارگذاری برنامه...');
    
    fetchMenuData()
        .then(() => {
            console.log('✅ menuData پر شد، رندر تقویم...');
            calendar.render();
            updateReservedCount();
            console.log('✅ تقویم بارگذاری شد.');
        })
        .catch(error => {
            console.error('❌ خطا در بارگذاری:', error);
        });
}

// اجرای برنامه
initApp();

// ===========================
// Reserve Month
// ===========================
document.getElementById("reserveMonthBtn")?.addEventListener("click", async () => {
    const start = calendar.getMonthStartGregorian();
    const end = calendar.getMonthEndGregorian();

    const startKey = `${start.gy}-${String(start.gm).padStart(2, "0")}-${String(start.gd).padStart(2, "0")}`;
    const endKey = `${end.gy}-${String(end.gm).padStart(2, "0")}-${String(end.gd).padStart(2, "0")}`;

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

        if (!data.success) {
            alert(data.message);
            return;
        }

        await fetchMenuData();
        calendar.render();
        updateReservedCount();
        alert(data.message);

    } catch (error) {
        console.error('❌ Error:', error);
        alert("خطا در ارتباط با سرور");
    }
});

// ===========================
// Cancel Month
// ===========================
document.getElementById("cancelMonthBtn")?.addEventListener("click", async () => {
    const start = calendar.getMonthStartGregorian();
    const end = calendar.getMonthEndGregorian();

    const startKey = `${start.gy}-${String(start.gm).padStart(2, "0")}-${String(start.gd).padStart(2, "0")}`;
    const endKey = `${end.gy}-${String(end.gm).padStart(2, "0")}-${String(end.gd).padStart(2, "0")}`;

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

        if (!data.success) {
            alert(data.message);
            return;
        }

        await fetchMenuData();
        calendar.render();
        updateReservedCount();
        alert(data.message);

    } catch (error) {
        console.error('❌ Error:', error);
        alert("خطا در ارتباط با سرور");
    }
});

// ===========================
// دریافت مجدد داده‌ها بعد از تغییر ماه
// ===========================
const originalNextMonth = calendar.nextMonth;
const originalPreviousMonth = calendar.previousMonth;

calendar.nextMonth = function() {
    console.log('📅 رفتن به ماه بعد...');
    originalNextMonth.call(this);
    fetchMenuData().then(() => {
        this.render();
        updateReservedCount();
    });
};

calendar.previousMonth = function() {
    console.log('📅 رفتن به ماه قبل...');
    originalPreviousMonth.call(this);
    fetchMenuData().then(() => {
        this.render();
        updateReservedCount();
    });
};