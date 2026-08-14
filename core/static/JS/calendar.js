class PersianCalendar {
    constructor(gridId, adminMode = false) {
        this.grid = document.getElementById(gridId);
        this.adminMode = adminMode;
        this.menuData = window.menuData || menuData || {};
        this.selectedDate = null;   
        this.monthTitle = document.getElementById("monthTitle");
        this.prevBtn = document.getElementById("prevMonth");
        this.nextBtn = document.getElementById("nextMonth");

        this.prevBtn.addEventListener("click", () => {
            this.previousMonth();
        });
        this.nextBtn.addEventListener("click", () => {
            this.nextMonth();
        });

        const today = new Date();
        const jToday = jalaali.toJalaali(today);

        this.currentYear = jToday.jy;
        this.currentMonth = jToday.jm;
        this.todayYear = jToday.jy;
        this.todayMonth = jToday.jm;
        this.todayDay = jToday.jd;

        this.months = [
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

        this.weekDays = [
            "شنبه",
            "یکشنبه",
            "دوشنبه",
            "سه شنبه",
            "چهارشنبه",
            "پنج شنبه",
            "جمعه"
        ];
    }

    renderHeader() {
        document.getElementById("monthYear").textContent =
            `${this.months[this.currentMonth - 1]} ${this.currentYear}`;
    }

    renderWeekDays() {
        const weekContainer = document.getElementById("weekdays");
        weekContainer.innerHTML = "";
        this.weekDays.forEach(day => {
            const div = document.createElement("div");
            div.textContent = day;
            weekContainer.appendChild(div);
        });
    }

    renderGrid() {
        this.grid.innerHTML = "";

        const firstDay = this.convertWeekDay(
            this.getFirstDayOfMonth()
        );

        const daysInMonth = this.getDaysInMonth();

        const todayNumber =
            this.todayYear * 10000 +
            this.todayMonth * 100 +
            this.todayDay;

        for (let i = 0; i < firstDay; i++) {
            this.grid.appendChild(
                this.createDayCard({ day: null })
            );
        }

        for (let day = 1; day <= daysInMonth; day++) {
            const g = jalaali.toGregorian(
                this.currentYear,
                this.currentMonth,
                day
            );

            const key =
            `${g.gy}-${String(g.gm).padStart(2, "0")}-${String(g.gd).padStart(2, "0")}`;

            const menu = this.menuData[key];

            const food = menu
                ? { name: menu.foodName }
                : null;

            const isToday =
                this.currentYear === this.todayYear &&
                this.currentMonth === this.todayMonth &&
                day === this.todayDay;

            const currentNumber =
                this.currentYear * 10000 +
                this.currentMonth * 100 +
                day;

            const isPast = currentNumber < todayNumber;

            this.grid.appendChild(
                this.createDayCard({
                    day,
                    food: food ? food.name : null,
                    today: isToday,
                    past: isPast,
                    reserved: menu?.reserved ?? false,
                    can_extra_reservation: menu?.can_extra_reservation ?? false,
                    has_extra_reservation: menu?.has_extra_reservation ?? false
                })
            );
        }

        const totalCells = firstDay + daysInMonth;
        const remaining = 42 - totalCells;

        for (let i = 0; i < remaining; i++) {
            this.grid.appendChild(
                this.createDayCard({ day: null })
            );
        }
    }

    getMonthStartGregorian() {
        return jalaali.toGregorian(
            this.currentYear,
            this.currentMonth,
            1
        );
    }

    getMonthEndGregorian() {
        const lastDay = jalaali.jalaaliMonthLength(
            this.currentYear,
            this.currentMonth
        );
        return jalaali.toGregorian(
            this.currentYear,
            this.currentMonth,
            lastDay
        );
    }

    createDayCard(data) {
        const day = document.createElement("div");
        day.className = "day";
        if (data.past) {
            day.classList.add("past-day");
        }

        // محتوای اصلی روز
        const content = document.createElement("div");
        content.className = "day-content";

        if (data.day !== null) {
            const number = document.createElement("div");
            number.className = "day-number";
            number.textContent = data.day;
            content.appendChild(number);
        }

        if (data.food) {
            const food = document.createElement("div");
            food.className = "day-food";
            food.textContent = data.food;
            content.appendChild(food);
            day.classList.add("has-food");
        }
        else if (data.day !== null) {
            day.classList.add("no-food");
        }

        if (data.today) {
            day.classList.add("today");
        }

        if (data.selected) {
            day.classList.add("selected-day");
        }

        // =============================================================
        // اگر رزرو اصلی وجود دارد
        // =============================================================
        if (data.reserved && !this.adminMode) {
            day.classList.add("reserved-day");

            const actions = document.createElement("div");
            actions.className = "day-actions";

            if (!data.past) {
                // =============================================================
                // دکمه حذف رزرو اضافه (x کوچک) - فقط اگر رزرو اضافه داشته باشد
                // =============================================================
                if (data.has_extra_reservation) {
                    const removeExtraBtn = document.createElement("span");
                    removeExtraBtn.className = "remove-extra-btn";
                    removeExtraBtn.innerHTML = '<i class="bi bi-x-circle"></i>';
                    removeExtraBtn.title = "حذف رزرو اضافه";
                    
                    removeExtraBtn.addEventListener("click", (e) => {
                        e.stopPropagation();
                        this.removeExtraReservation(data.day);
                    });
                    
                    actions.appendChild(removeExtraBtn);
                }

                // =============================================================
                // دکمه رزرو اضافه (+)
                // =============================================================
                if (data.can_extra_reservation && !data.past && !data.has_extra_reservation) {
                    const addBtn = document.createElement("span");
                    addBtn.className = "add-btn";
                    addBtn.innerHTML = '<i class="bi bi-plus-circle"></i>';
                    addBtn.title = "رزرو اضافه";
                    
                    addBtn.addEventListener("click", (e) => {
                        e.stopPropagation();
                        this.addExtraReservation(data.day);
                    });
                    
                    actions.appendChild(addBtn);
                }

                // =============================================================
                // دکمه حذف رزرو اصلی (سطل آشغال) - همیشه نمایش داده می‌شود
                // =============================================================
                const deleteBtn = document.createElement("span");
                deleteBtn.className = "delete-btn";
                deleteBtn.innerHTML = '<i class="bi bi-trash"></i>';
                deleteBtn.title = "لغو رزرو اصلی";
                
                deleteBtn.addEventListener("click", (e) => {
                    e.stopPropagation();
                    this.removeMainReservation(data.day);
                });
                
                actions.appendChild(deleteBtn);
            }

            day.appendChild(content);
            day.appendChild(actions);
        } else {
            day.appendChild(content);
        }
                
        if (data.day !== null) {
            day.addEventListener("click", () => {
                if (this.adminMode) {
                    this.selectAdminDay(data.day);
                    return;
                }

                if (!data.food) return;
                if (data.past && !data.reserved) {
                    return;
                }
                this.selectDay(data.day);
            });
        }

        return day;
    }

    getFirstDayOfMonth() {
        const gDate = jalaali.toGregorian(
            this.currentYear,
            this.currentMonth,
            1
        );
        const date = new Date(
            gDate.gy,
            gDate.gm - 1,
            gDate.gd
        );
        return date.getDay();
    }

    convertWeekDay(day) {
        return (day + 1) % 7;
    }

    getDaysInMonth() {
        return jalaali.jalaaliMonthLength(
            this.currentYear,
            this.currentMonth
        );
    }

    nextMonth() {
        if (this.currentMonth === 12) {
            this.currentMonth = 1;
            this.currentYear++;
        } else {
            this.currentMonth++;
        }
        this.render();
        if (typeof updateReservedCount === 'function') {
            updateReservedCount();
        }
    }

    previousMonth() {
        if (this.currentMonth === 1) {
            this.currentMonth = 12;
            this.currentYear--;
        } else {
            this.currentMonth--;
        }
        this.render();
        if (typeof updateReservedCount === 'function') {
            updateReservedCount();
        }
    }

    selectDay(day) {
        const g = jalaali.toGregorian(
            this.currentYear,
            this.currentMonth,
            day
        );

        const key =
        `${g.gy}-${String(g.gm).padStart(2, "0")}-${String(g.gd).padStart(2, "0")}`;

        const menu = this.menuData[key];

        if (!menu) return;

        if (menu.reserved) {
            document.dispatchEvent(
                new CustomEvent("daySelected", {
                    detail: {
                        year: this.currentYear,
                        month: this.currentMonth,
                        day: day
                    }
                })
            );
            return;
        }

        this.toggleReservation(day);

        document.dispatchEvent(
            new CustomEvent("daySelected", {
                detail: {
                    year: this.currentYear,
                    month: this.currentMonth,
                    day: day
                }
            })
        );
    }

    // =============================================================
    // حذف فقط رزرو اضافه (با دکمه x)
    // =============================================================
    async removeExtraReservation(day) {
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

        if (!menu.has_extra_reservation) {
            alert("رزرو اضافه‌ای برای حذف وجود ندارد.");
            return;
        }

        const csrfToken = document.getElementById("csrf-token")?.value || '';

        try {
            const response = await fetch("/reservations/delete-extra/", {
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
                // فقط رزرو اضافه حذف شد
                this.menuData[key].has_extra_reservation = false;
                // reserved را true نگه دار (رزرو اصلی هنوز وجود دارد)
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
            console.error('❌ Error in removeExtraReservation:', error);
            alert("خطا در ارتباط با سرور");
        }
    }

    // =============================================================
    // حذف رزرو اصلی (با سطل آشغال) - هر دو رزرو را حذف می‌کند
    // =============================================================
    async removeMainReservation(day) {
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
                // حذف رزرو اصلی - همه چیز پاک می‌شود
                this.menuData[key].reserved = false;
                this.menuData[key].has_extra_reservation = false;
                
                this.render();
                if (typeof updateReservedCount === 'function') {
                    updateReservedCount();
                }

                // پاک کردن اطلاعات نمایش داده شده
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
            console.error('❌ Error in removeMainReservation:', error);
            alert("خطا در ارتباط با سرور");
        }
    }

    // =============================================================
    // افزودن رزرو اضافه (با دکمه +)
    // =============================================================
    async addExtraReservation(day) {
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
    }

    selectAdminDay(day) {
        const currentNumber =
            this.currentYear * 10000 +
            this.currentMonth * 100 +
            day;

        const todayNumber =
            this.todayYear * 10000 +
            this.todayMonth * 100 +
            this.todayDay;

        if (currentNumber < todayNumber) {
            if (this.adminMode) {
                alert("امکان ثبت یا ویرایش غذا برای روزهای گذشته وجود ندارد.");
            }
            return;
        }

        document.dispatchEvent(
            new CustomEvent("daySelected", {
                detail: {
                    year: this.currentYear,
                    month: this.currentMonth,
                    day: day
                }
            })
        );
    }

    render() {
        this.renderHeader();
        this.renderWeekDays();
        this.renderGrid();
    }

    // =============================================================
    // رزرو معمولی (با کلیک روی روز)
    // =============================================================
    async toggleReservation(day) {
        const g = jalaali.toGregorian(
            this.currentYear,
            this.currentMonth,
            day
        );

        const key =
            `${g.gy}-${String(g.gm).padStart(2, "0")}-${String(g.gd).padStart(2, "0")}`;

        const csrfToken =
            document.getElementById("csrf-token")?.value || '';

        try {
            const response = await fetch("/reservations/toggle/", {
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
            console.error('❌ Error in toggleReservation:', error);
            alert("خطا در ارتباط با سرور");
        }
    }
}