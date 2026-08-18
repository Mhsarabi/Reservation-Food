// ============================================================
// RESERVATION SYSTEM
// ============================================================


// ============================================================
// Global Calendar
// ============================================================

let calendar = null;


// ============================================================
// Fetch Menu Data
// ============================================================

function fetchMenuData() {

    return fetch(
        "/menu/daily-menus/",
        {
            method: "GET",

            headers: {
                "X-Requested-With": "XMLHttpRequest"
            }
        }
    )


    .then(response => {

        if (!response.ok) {

            throw new Error(
                `خطا در دریافت داده‌ها: ${response.status}`
            );

        }

        return response.json();

    })


    .then(data => {

        if (!window.menuData) {
            window.menuData = {};
        }


        // پاک کردن اطلاعات قبلی

        Object.keys(window.menuData).forEach(key => {

            delete window.menuData[key];

        });


        // قرار دادن اطلاعات جدید

        Object.assign(
            window.menuData,
            data
        );


        return window.menuData;

    })


    .catch(error => {

        console.error(
            "❌ خطا در دریافت داده‌های تقویم:",
            error
        );


        if (!window.menuData) {
            window.menuData = {};
        }


        return window.menuData;

    });

}


// ============================================================
// Get Menu By Day
// ============================================================

function getMenuByDay(day) {

    if (!calendar) {
        return null;
    }


    const g =
        jalaali.toGregorian(
            calendar.currentYear,
            calendar.currentMonth,
            day
        );


    const key =
        `${g.gy}-${String(g.gm).padStart(2, "0")}-${String(g.gd).padStart(2, "0")}`;


    return window.menuData?.[key] || null;

}


// ============================================================
// Get Gregorian Key
// ============================================================

function getDateKey(year, month, day) {

    const g =
        jalaali.toGregorian(
            year,
            month,
            day
        );


    return (
        `${g.gy}-${String(g.gm).padStart(2, "0")}-${String(g.gd).padStart(2, "0")}`
    );

}


// ============================================================
// Update Reserved Count
// ============================================================

function updateReservedCount() {

    if (!calendar) {
        return;
    }


    let count = 0;

    let extraCount = 0;


    if (window.menuData) {

        Object.entries(
            window.menuData
        ).forEach(([key, menu]) => {

            const [
                gy,
                gm,
                gd
            ] = key
                .split("-")
                .map(Number);


            const j =
                jalaali.toJalaali(
                    gy,
                    gm,
                    gd
                );


            if (

                j.jy === calendar.currentYear &&

                j.jm === calendar.currentMonth &&

                menu.reserved

            ) {

                count++;


                if (menu.has_extra_reservation) {

                    extraCount +=
                        menu.extra_reservation_count || 1;

                }

            }

        });

    }


    const reservedCountEl =
        document.getElementById(
            "reservedCount"
        );


    if (!reservedCountEl) {
        return;
    }


    let text =
        `تعداد غذاهای رزرو شده این ماه: ${count}`;


    if (extraCount > 0) {

        text +=
            ` (${extraCount} رزرو اضافه)`;

    }


    reservedCountEl.textContent =
        text;

}


// ============================================================
// Day Selected
// ============================================================

document.addEventListener(
    "daySelected",
    function (event) {

        const selectedDate =
            document.getElementById(
                "selectedDate"
            );


        const foodImage =
            document.getElementById(
                "foodImage"
            );


        const foodName =
            document.getElementById(
                "foodName"
            );


        const {
            year,
            month,
            day
        } = event.detail;


        const key =
            getDateKey(
                year,
                month,
                day
            );


        const menu =
            window.menuData?.[key];


        // ----------------------------------------------------
        // تاریخ
        // ----------------------------------------------------

        if (selectedDate) {

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


            selectedDate.textContent =
                `${day} ${months[month - 1]} ${year}`;

        }


        // ----------------------------------------------------
        // اطلاعات غذا
        // ----------------------------------------------------

        if (menu && menu.foodName) {

            if (foodImage) {

                foodImage.src =
                    menu.image ||
                    "/static/images/no-food.png";

            }


            if (foodName) {

                foodName.textContent =
                    menu.foodName;

            }

        }

        else {

            if (foodImage) {

                foodImage.src =
                    "/static/images/no-food.png";

            }


            if (foodName) {

                foodName.textContent =
                    "غذایی ثبت نشده است.";

            }

        }

    }
);


// ============================================================
// Reserve Month
// ============================================================

async function reserveMonth() {

    if (!calendar) {

        showToast(
            "error",
            "تقویم آماده نیست."
        );

        return;
    }


    const start =
        calendar.getMonthStartGregorian();


    const end =
        calendar.getMonthEndGregorian();


    const startKey =
        `${start.gy}-${String(start.gm).padStart(2, "0")}-${String(start.gd).padStart(2, "0")}`;


    const endKey =
        `${end.gy}-${String(end.gm).padStart(2, "0")}-${String(end.gd).padStart(2, "0")}`;


    const csrfToken =
        getCsrfToken();


    try {

        const response =
            await fetch(
                "/reservations/reserve-month/",
                {

                    method: "POST",

                    headers: {

                        "X-CSRFToken":
                            csrfToken,

                        "Content-Type":
                            "application/x-www-form-urlencoded"

                    },

                    body:
                        new URLSearchParams({

                            start_date:
                                startKey,

                            end_date:
                                endKey

                        })

                }
            );


        const data =
            await response.json();


        if (data.success) {

            await fetchMenuData();


            calendar.render();


            updateReservedCount();


            showToast(
                "success",
                data.message ||
                "رزروهای ماه با موفقیت انجام شد."
            );

        }

        else {

            showToast(
                "error",
                data.message ||
                "خطا در رزرو ماه."
            );

        }

    }


    catch (error) {

        console.error(
            "❌ Reserve month error:",
            error
        );


        showToast(
            "error",
            "خطا در ارتباط با سرور."
        );

    }

}


// ============================================================
// Cancel Month
// ============================================================

async function cancelMonth() {

    if (!calendar) {

        showToast(
            "error",
            "تقویم آماده نیست."
        );

        return;
    }


    const start =
        calendar.getMonthStartGregorian();


    const end =
        calendar.getMonthEndGregorian();


    const startKey =
        `${start.gy}-${String(start.gm).padStart(2, "0")}-${String(start.gd).padStart(2, "0")}`;


    const endKey =
        `${end.gy}-${String(end.gm).padStart(2, "0")}-${String(end.gd).padStart(2, "0")}`;


    const csrfToken =
        getCsrfToken();


    try {

        const response =
            await fetch(
                "/reservations/cancel-month/",
                {

                    method: "POST",

                    headers: {

                        "X-CSRFToken":
                            csrfToken,

                        "Content-Type":
                            "application/x-www-form-urlencoded"

                    },

                    body:
                        new URLSearchParams({

                            start_date:
                                startKey,

                            end_date:
                                endKey

                        })

                }
            );


        const data =
            await response.json();


        if (data.success) {

            await fetchMenuData();


            calendar.render();


            updateReservedCount();


            showToast(
                "success",
                data.message ||
                "رزروهای ماه لغو شد."
            );

        }

        else {

            showToast(
                "error",
                data.message ||
                "خطا در لغو رزروهای ماه."
            );

        }

    }


    catch (error) {

        console.error(
            "❌ Cancel month error:",
            error
        );


        showToast(
            "error",
            "خطا در ارتباط با سرور."
        );

    }

}


// ============================================================
// Add Extra Reservation
// ============================================================

async function addExtraReservation(day) {

    if (!calendar) {
        return;
    }


    const key =
        getDateKey(
            calendar.currentYear,
            calendar.currentMonth,
            day
        );


    const menu =
        window.menuData?.[key];


    if (!menu) {

        showToast(
            "warning",
            "غذایی برای این روز ثبت نشده است."
        );

        return;
    }


    const csrfToken =
        getCsrfToken();


    try {

        const response =
            await fetch(
                "/reservations/add-extra/",
                {

                    method: "POST",

                    headers: {

                        "X-CSRFToken":
                            csrfToken,

                        "Content-Type":
                            "application/x-www-form-urlencoded"

                    },

                    body:
                        new URLSearchParams({

                            food_date:
                                key

                        })

                }
            );


        const data =
            await response.json();


        if (data.success) {

            window.menuData[key]
                .has_extra_reservation = true;


            window.menuData[key]
                .reserved = true;


            window.menuData[key]
                .extra_reservation_count =
                    data.extra_reservation_count ??
                    (
                        window.menuData[key]
                            .extra_reservation_count || 0
                    ) + 1;


            calendar.render();


            updateReservedCount();


            showToast(
                "success",
                data.message ||
                "رزرو اضافه با موفقیت انجام شد."
            );

        }

        else {

            showToast(
                "error",
                data.message ||
                "خطا در رزرو اضافه."
            );

        }

    }


    catch (error) {

        console.error(
            "❌ Add extra reservation error:",
            error
        );


        showToast(
            "error",
            "خطا در ارتباط با سرور."
        );

    }

}


// ============================================================
// Remove Reservation
// ============================================================

async function removeReservation(day) {

    if (!calendar) {
        return;
    }


    const key =
        getDateKey(
            calendar.currentYear,
            calendar.currentMonth,
            day
        );


    const menu =
        window.menuData?.[key];


    if (!menu) {
        return;
    }


    const csrfToken =
        getCsrfToken();


    try {

        const response =
            await fetch(
                "/reservations/delete/",
                {

                    method: "POST",

                    headers: {

                        "X-CSRFToken":
                            csrfToken,

                        "Content-Type":
                            "application/x-www-form-urlencoded"

                    },

                    body:
                        new URLSearchParams({

                            food_date:
                                key

                        })

                }
            );


        const data =
            await response.json();


        if (data.success) {

            window.menuData[key]
                .reserved = false;


            window.menuData[key]
                .has_extra_reservation = false;


            window.menuData[key]
                .extra_reservation_count = 0;


            calendar.render();


            updateReservedCount();


            // ------------------------------------------------
            // پاک کردن اطلاعات غذای انتخاب شده
            // ------------------------------------------------

            const foodImage =
                document.getElementById(
                    "foodImage"
                );


            const foodName =
                document.getElementById(
                    "foodName"
                );


            const selectedDate =
                document.getElementById(
                    "selectedDate"
                );


            if (foodImage) {

                foodImage.src =
                    "/static/images/no-food.png";

            }


            if (foodName) {

                foodName.textContent = "-";

            }


            if (selectedDate) {

                selectedDate.textContent =
                    "تاریخی انتخاب نشده است.";

            }


            showToast(
                "success",
                data.message ||
                "رزرو با موفقیت لغو شد."
            );

        }

        else {

            showToast(
                "error",
                data.message ||
                "خطا در لغو رزرو."
            );

        }

    }


    catch (error) {

        console.error(
            "❌ Remove reservation error:",
            error
        );


        showToast(
            "error",
            "خطا در ارتباط با سرور."
        );

    }

}


// ============================================================
// Override Calendar Month Navigation
// ============================================================

function setupMonthNavigation() {

    if (!calendar) {
        return;
    }


    const originalNextMonth =
        calendar.nextMonth;


    const originalPreviousMonth =
        calendar.previousMonth;


    calendar.nextMonth =
        function () {

            originalNextMonth.call(this);


            fetchMenuData()
                .then(() => {

                    this.render();

                    updateReservedCount();

                });

        };


    calendar.previousMonth =
        function () {

            originalPreviousMonth.call(this);


            fetchMenuData()
                .then(() => {

                    this.render();

                    updateReservedCount();

                });

        };

}


// ============================================================
// Connect Reservation Functions To Calendar
// ============================================================

function setupCalendarReservationHandlers() {

    if (!calendar) {
        return;
    }


    calendar.addExtraReservation =
        addExtraReservation;


    calendar.removeReservation =
        removeReservation;

}


// ============================================================
// Initialize Reservation System
// ============================================================

async function initReservationApp() {

    try {

        // ----------------------------------------------------
        // اطمینان از وجود menuData
        // ----------------------------------------------------

        if (!window.menuData) {
            window.menuData = {};
        }


        // ----------------------------------------------------
        // ساخت تقویم
        // ----------------------------------------------------

        calendar =
            new PersianCalendar(
                "calendarGrid",
                false
            );


        // برای دسترسی سایر فایل‌ها
        window.calendar =
            calendar;


        // ----------------------------------------------------
        // دریافت اطلاعات منو
        // ----------------------------------------------------

        await fetchMenuData();


        // ----------------------------------------------------
        // تنظیم Handlerها
        // ----------------------------------------------------

        setupCalendarReservationHandlers();


        setupMonthNavigation();


        // ----------------------------------------------------
        // نمایش تقویم
        // ----------------------------------------------------

        calendar.render();


        // ----------------------------------------------------
        // شمارش رزروها
        // ----------------------------------------------------

        updateReservedCount();

    }


    catch (error) {

        console.error(
            "❌ Error initializing reservation app:",
            error
        );


        showToast(
            "error",
            "خطا در راه‌اندازی سیستم رزرو."
        );

    }

}


// ============================================================
// Event Listeners
// ============================================================

document.addEventListener(
    "DOMContentLoaded",
    function () {

        // ----------------------------------------------------
        // Reserve Month
        // ----------------------------------------------------

        document
            .getElementById(
                "reserveMonthBtn"
            )
            ?.addEventListener(
                "click",
                function (event) {

                    event.preventDefault();

                    event.stopPropagation();


                    reserveMonth();

                }
            );


        // ----------------------------------------------------
        // Cancel Month
        // ----------------------------------------------------

        document
            .getElementById(
                "cancelMonthBtn"
            )
            ?.addEventListener(
                "click",
                function (event) {

                    event.preventDefault();

                    event.stopPropagation();


                    cancelMonth();

                }
            );


        // ----------------------------------------------------
        // Initialize
        // ----------------------------------------------------

        initReservationApp();

    }
);