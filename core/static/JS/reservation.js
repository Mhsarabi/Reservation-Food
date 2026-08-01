let currentMenu = null;
const csrfToken = document.getElementById("csrf-token").value;
/* ============================================
   Today
============================================ */

const today = new Date();
const foodImage = document.getElementById("foodImage");
const reserveBtn = document.getElementById("reserveBtn");

document.getElementById("todayDate").textContent =
    today.toLocaleDateString("fa-IR");


/* ============================================
   Calendar
============================================ */

const calendar = new PersianCalendar("calendarGrid", false);

calendar.render();
updateReservedCount();


function updateReserveButton(status) {

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


document.getElementById("reserveMonthBtn").addEventListener("click", async () => {

    const start = calendar.getMonthStartGregorian();
    const end = calendar.getMonthEndGregorian();

    const response = await fetch("/reservations/reserve-month/", {
        method: "POST",
        headers: {
            "X-CSRFToken": csrfToken,
            "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
            start_date: `${start.gy}-${String(start.gm).padStart(2,"0")}-${String(start.gd).padStart(2,"0")}`,
            end_date: `${end.gy}-${String(end.gm).padStart(2,"0")}-${String(end.gd).padStart(2,"0")}`,
        }),
    });

    const data = await response.json();

    if (!data.success) {
        alert(data.message);
        return;
    }

    Object.entries(menuData).forEach(([key, menu]) => {

    const [gy, gm, gd] = key.split("-").map(Number);

    // فقط اگر روز گذشته نباشد
    const menuDate = new Date(gy, gm - 1, gd);

    const today = new Date();
    today.setHours(0,0,0,0);

    if (menuDate < today)
        return;

    const j = jalaali.toJalaali(gy, gm, gd);

    if (
        j.jy === calendar.currentYear &&
        j.jm === calendar.currentMonth
    ) {
        menu.reserved = true;
    }

    });

    calendar.render();
    updateReservedCount();

});

document.getElementById("cancelMonthBtn").addEventListener("click", async () => {

    const start = calendar.getMonthStartGregorian();
    const end = calendar.getMonthEndGregorian();

    const response = await fetch("/reservations/cancel-month/", {
        method: "POST",
        headers: {
            "X-CSRFToken": csrfToken,
            "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
            start_date: `${start.gy}-${String(start.gm).padStart(2,"0")}-${String(start.gd).padStart(2,"0")}`,
            end_date: `${end.gy}-${String(end.gm).padStart(2,"0")}-${String(end.gd).padStart(2,"0")}`,
        }),
    });

    const data = await response.json();

    if (!data.success) {
        alert(data.message);
        return;
    }

    Object.entries(menuData).forEach(([key, menu]) => {

        const [gy, gm, gd] = key.split("-").map(Number);

        const menuDate = new Date(gy, gm - 1, gd);

        const today = new Date();
        today.setHours(0,0,0,0);

        if (menuDate < today)
            return;

        const j = jalaali.toJalaali(gy, gm, gd);

        if (
            j.jy === calendar.currentYear &&
            j.jm === calendar.currentMonth
        ) {
            menu.reserved = false;
        }

    });

        calendar.render();
        updateReservedCount();

    });

