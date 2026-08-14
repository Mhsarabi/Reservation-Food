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
        if (!response.ok) {
            throw new Error(`خطا در دریافت داده‌ها: ${response.status}`);
        }
        return response.json();
    })
    .then(data => {
        
        if (typeof window.menuData === 'undefined') {
            window.menuData = {};
        }
        
        for (let key in window.menuData) {
            delete window.menuData[key];
        }
        Object.assign(window.menuData, data);
        
        const count = Object.keys(window.menuData).length;
        console.log(`✅ ${count} روز با غذا دریافت شد.`);
        
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
const calendar = new PersianCalendar("calendarGrid", false);

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
// Update Reserved Count (با پشتیبانی از رزرو اضافه)
// ===========================
function updateReservedCount() {
    let count = 0;
    let extraCount = 0;


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
                if (menu.has_extra_reservation) {
                    extraCount++;
                }
            }
        });
    }

    const reservedCountEl = document.getElementById("reservedCount");
    if (reservedCountEl) {
        let text = `تعداد غذاهای رزرو شده این ماه: ${count}`;
        if (extraCount > 0) {
            text += ` (${extraCount} رزرو اضافه)`;
        }
        reservedCountEl.textContent = text;
    }
}

// ===========================
// بارگذاری اولیه
// ===========================
function initApp() {
    
    fetchMenuData()
        .then(() => {
            calendar.render();
            updateReservedCount();
        })
        .catch(error => {
            console.error('❌ خطا در بارگذاری:', error);
        });
}

// اجرای برنامه
initApp();

// ===========================
// Reserve Month (رزرو همه روزهای ماه)
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
// Cancel Month (لغو همه روزهای ماه)
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
    originalNextMonth.call(this);
    fetchMenuData().then(() => {
        this.render();
        updateReservedCount();
    });
};

calendar.previousMonth = function() {
    originalPreviousMonth.call(this);
    fetchMenuData().then(() => {
        this.render();
        updateReservedCount();
    });
};

// ===========================
// اضافه کردن رزرو اضافه (دکمه +)
// ===========================
calendar.addExtraReservation = async function(day) {
    const g = jalaali.toGregorian(
        this.currentYear,
        this.currentMonth,
        day
    );

    const key =
        `${g.gy}-${String(g.gm).padStart(2, "0")}-${String(g.gd).padStart(2, "0")}`;

    const menu = this.menuData[key];
    if (!menu) {
        alert("غذایی برای این روز ثبت نشده است.");
        return;
    }

    const csrfToken = document.getElementById("csrf-token")?.value || '';

    try {
        const response = await fetch("/reservations/add-extra/", {
            method: "POST",
            headers: {
                "X-CSRFToken": csrfToken,
                "Content-Type": "application/x-www-form-urlencoded",
            },
            body: new URLSearchParams({
                food_date: key,
            }),
        });

        const data = await response.json();

        if (data.success) {
            this.menuData[key].has_extra_reservation = true;
            this.menuData[key].reserved = true;
            this.render();
            if (typeof updateReservedCount === 'function') {
                updateReservedCount();
            }
            alert(data.message);
        } else {
            alert(data.message);
        }
    } catch (error) {
        console.error('❌ Error in addExtraReservation:', error);
        alert("خطا در ارتباط با سرور");
    }
};

// ===========================
// حذف رزرو (با پشتیبانی از حذف رزرو اضافه)
// ===========================
calendar.removeReservation = async function(day) {
    const g = jalaali.toGregorian(
        this.currentYear,
        this.currentMonth,
        day
    );

    const key =
        `${g.gy}-${String(g.gm).padStart(2, "0")}-${String(g.gd).padStart(2, "0")}`;

    const menu = this.menuData[key];
    if (!menu) return;

    const csrfToken = document.getElementById("csrf-token")?.value || '';

    try {
        const response = await fetch("/reservations/delete/", {
            method: "POST",
            headers: {
                "X-CSRFToken": csrfToken,
                "Content-Type": "application/x-www-form-urlencoded",
            },
            body: new URLSearchParams({
                food_date: key,
            }),
        });

        const data = await response.json();

        if (data.success) {
            this.menuData[key].reserved = false;
            this.menuData[key].has_extra_reservation = false;
            this.render();
            if (typeof updateReservedCount === 'function') {
                updateReservedCount();
            }

            const foodImage = document.getElementById("foodImage");
            const foodName = document.getElementById("foodName");
            const selectedDate = document.getElementById("selectedDate");

            if (foodImage) foodImage.src = "/static/images/no-food.png";
            if (foodName) foodName.textContent = "-";
            if (selectedDate) selectedDate.textContent = "تاریخی انتخاب نشده است.";
            
            alert(data.message);
        } else {
            alert(data.message);
        }
    } catch (error) {
        console.error('❌ Error in removeReservation:', error);
        alert("خطا در ارتباط با سرور");
    }
};