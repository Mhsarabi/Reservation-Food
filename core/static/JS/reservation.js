let currentMenu = null;
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

document.getElementById("reserveMonthBtn").addEventListener("click", function () {

    Object.entries(menuData).forEach(([key, menu]) => {

        const [year, month, day] = key.split("-").map(Number);

        // فقط ماه جاری
        if (
            year !== calendar.currentYear ||
            month !== calendar.currentMonth
        ) return;

        // گذشته نباشد
        const currentNumber =
            year * 10000 +
            month * 100 +
            day;

        const todayNumber =
            calendar.todayYear * 10000 +
            calendar.todayMonth * 100 +
            calendar.todayDay;

        if (currentNumber < todayNumber)
            return;

        // غذا داشته باشد
        if (!menu.foodId)
            return;

        menu.reserved = true;

    });

    calendar.render();
    updateReservedCount();

});

document.getElementById("cancelMonthBtn").addEventListener("click", function () {

    Object.entries(menuData).forEach(([key, menu]) => {

        const [year, month, day] = key.split("-").map(Number);

        if (
            year !== calendar.currentYear ||
            month !== calendar.currentMonth
        ) return;

        const currentNumber =
            year * 10000 +
            month * 100 +
            day;

        const todayNumber =
            calendar.todayYear * 10000 +
            calendar.todayMonth * 100 +
            calendar.todayDay;

        if (currentNumber < todayNumber)
            return;

        menu.reserved = false;

    });

    calendar.render();
    updateReservedCount();

});
