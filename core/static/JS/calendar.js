class PersianCalendar {
    constructor(gridId, adminMode = false) {
        this.grid = document.getElementById(gridId);
        this.adminMode = adminMode;
        this.menuData = window.menuData || {};
        this.selectedDate = null;
        this.monthTitle = document.getElementById("monthTitle");
        this.prevBtn = document.getElementById("prevMonth");
        this.nextBtn = document.getElementById("nextMonth");

        this.prevBtn.addEventListener("click", (e) => {
            e.preventDefault();
            e.stopPropagation();
            this.previousMonth();
        });
        
        this.nextBtn.addEventListener("click", (e) => {
            e.preventDefault();
            e.stopPropagation();
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
            "فروردین", "اردیبهشت", "خرداد", "تیر", "مرداد", "شهریور",
            "مهر", "آبان", "آذر", "دی", "بهمن", "اسفند"
        ];

        this.weekDays = [
            "شنبه", "یکشنبه", "دوشنبه", "سه شنبه", "چهارشنبه", "پنج شنبه", "جمعه"
        ];

        // Bind methods to this instance
        this.addExtraReservation = this.addExtraReservation.bind(this);
        this.removeExtraReservation = this.removeExtraReservation.bind(this);
        this.removeMainReservation = this.removeMainReservation.bind(this);
        this.toggleReservation = this.toggleReservation.bind(this);
        this.handleDayClick = this.handleDayClick.bind(this);
        this.handleAddExtraClick = this.handleAddExtraClick.bind(this);
        this.handleRemoveExtraClick = this.handleRemoveExtraClick.bind(this);
        this.handleDeleteMainClick = this.handleDeleteMainClick.bind(this);
    }

    // ============================================================
    // Render Methods
    // ============================================================

    render() {
        this.renderHeader();
        this.renderWeekDays();
        this.renderGrid();
    }

    renderHeader() {
        const monthYearEl = document.getElementById("monthYear");
        if (monthYearEl) {
            monthYearEl.textContent = `${this.months[this.currentMonth - 1]} ${this.currentYear}`;
        }
    }

    renderWeekDays() {
        const weekContainer = document.getElementById("weekdays");
        if (!weekContainer) return;
        weekContainer.innerHTML = "";
        this.weekDays.forEach(day => {
            const div = document.createElement("div");
            div.textContent = day;
            weekContainer.appendChild(div);
        });
    }

    renderGrid() {
        if (!this.grid) return;
        this.grid.innerHTML = "";

        const firstDay = this.convertWeekDay(this.getFirstDayOfMonth());
        const daysInMonth = this.getDaysInMonth();
        const todayNumber = this.todayYear * 10000 + this.todayMonth * 100 + this.todayDay;

        for (let i = 0; i < firstDay; i++) {
            this.grid.appendChild(this.createDayCard(null));
        }

        for (let day = 1; day <= daysInMonth; day++) {
            const key = this.getFoodDateKey(day);
            const menu = this.menuData[key];
            
            const isToday = this.currentYear === this.todayYear &&
                this.currentMonth === this.todayMonth &&
                day === this.todayDay;

            const currentNumber = this.currentYear * 10000 + this.currentMonth * 100 + day;
            const isPast = currentNumber < todayNumber;

            const data = {
                day: day,
                food: menu ? menu.foodName : null,
                foodId: menu ? menu.foodId : null,
                foodImage: menu ? menu.image : null,
                today: isToday,
                past: isPast,
                reserved: menu?.reserved ?? false,
                extra_reservation_limit: menu?.extra_reservation_limit ?? 0,
                extra_reservation_count: menu?.extra_reservation_count ?? 0,
                has_extra_reservation: menu?.has_extra_reservation ?? false,
                food_date: key
            };

            this.grid.appendChild(this.createDayCard(data));
        }

        // Empty days at end of month
        const totalCells = firstDay + daysInMonth;
        const remaining = 42 - totalCells;
        for (let i = 0; i < remaining; i++) {
            this.grid.appendChild(this.createDayCard(null));
        }
    }

    // ============================================================
    // Create Day Card
    // ============================================================

    createDayCard(data) {
    const day = document.createElement("div");
    day.className = "day";

    if (!data || data.day === null) {
        day.classList.add("empty-day");
        return day;
    }

    day.dataset.day = data.day;
    day.dataset.foodDate = data.food_date || '';


    if (data.past) day.classList.add("past-day");
    if (data.today) day.classList.add("today");
    if (data.reserved) day.classList.add("reserved-day");
    if (data.food) {
        day.classList.add("has-food");
    } else {
        day.classList.add("no-food");
    }


    const content = document.createElement("div");
    content.className = "day-content";

    const number = document.createElement("div");
    number.className = "day-number";
    number.textContent = data.day;
    content.appendChild(number);

    if (data.food) {
        const food = document.createElement("div");
        food.className = "day-food";
        food.textContent = data.food;
        content.appendChild(food);
    } 
    day.appendChild(content);


    if (this.adminMode === true) {

        day.onclick = (e) => {

            e.preventDefault();
            e.stopPropagation();

            this.handleAdminDayClick(data);
        };

        return day;
    }


    if (data.reserved && !data.past) {

        const limit = data.extra_reservation_limit || 0;
        const currentCount = data.extra_reservation_count || 0;

        if (limit > 0) {

            const extraControls = document.createElement("div");
            extraControls.className = "extra-controls";

            const maxLabel = document.createElement("span");
            maxLabel.className = "extra-max-label";
            extraControls.appendChild(maxLabel);

            const addBtn = document.createElement("span");
            addBtn.className = "extra-add-btn";
            addBtn.innerHTML = '<i class="bi bi-plus-circle"></i>';
            addBtn.title = "افزایش رزرو اضافه";

            if (currentCount >= limit) {

                addBtn.style.opacity = "0.3";
                addBtn.style.cursor = "not-allowed";
                addBtn.classList.add("disabled");

            } else {

                addBtn.addEventListener("click", (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    this.handleAddExtraClick(data.day);
                });
            }

            extraControls.appendChild(addBtn);

            const countBadge = document.createElement("span");
            countBadge.className = "extra-count";
            countBadge.textContent = currentCount;
            extraControls.appendChild(countBadge);

            const removeBtn = document.createElement("span");
            removeBtn.className = "extra-remove-btn";
            removeBtn.innerHTML = '<i class="bi bi-dash-circle"></i>';
            removeBtn.title = "کاهش رزرو اضافه";

            if (currentCount === 0) {

                removeBtn.style.opacity = "0.3";
                removeBtn.style.cursor = "not-allowed";
                removeBtn.classList.add("disabled");

            } else {

                removeBtn.addEventListener("click", (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    this.handleRemoveExtraClick(data.day);
                });
            }

            extraControls.appendChild(removeBtn);

            day.appendChild(extraControls);
        }

        const actions = document.createElement("div");
        actions.className = "day-actions";

        const deleteBtn = document.createElement("span");
        deleteBtn.className = "delete-btn";
        deleteBtn.innerHTML = '<i class="bi bi-trash"></i>';
        deleteBtn.title = "لغو رزرو اصلی";

        deleteBtn.addEventListener("click", (e) => {
            e.preventDefault();
            e.stopPropagation();
            this.handleDeleteMainClick(data.day);
        });

        actions.appendChild(deleteBtn);
        day.appendChild(actions);
    }

    day.addEventListener("click", (e) => {

        if (
            e.target.closest('.extra-add-btn') ||
            e.target.closest('.extra-remove-btn') ||
            e.target.closest('.delete-btn')
        ) {
            return;
        }

        this.handleDayClick(data);
    });

    return day;
}

    // ============================================================
    // Event Handlers
    // ============================================================

    handleDayClick(data) {
        if (this.adminMode) {
            return;
        }

        if (!data.food) {
            this.showToast('warning', 'برای این روز غذایی ثبت نشده است.');
            return;
        }

        if (data.past && !data.reserved) {
            this.showToast('warning', 'امکان رزرو روزهای گذشته وجود ندارد.');
            return;
        }

        this.selectDay(data.day);
    }

    handleAdminDayClick(data) {

    if (this.adminMode !== true) {
        console.warn("⚠️ adminMode فعال نیست");
        return;
    }

    const event = new CustomEvent("adminDaySelected", {
        detail: {
            year: this.currentYear,
            month: this.currentMonth,
            day: data.day,
            foodId: data.foodId || null,
            foodName: data.food || null,
            foodDate: data.food_date || null
        }
    });

    document.dispatchEvent(event);
}

    handleAddExtraClick(day) {
        if (this.adminMode) return;
        this.addExtraReservation(day);
    }

    handleRemoveExtraClick(day) {
        if (this.adminMode) return;
        this.removeExtraReservation(day);
    }

    handleDeleteMainClick(day) {
        if (this.adminMode) return;
        this.removeMainReservation(day);
    }

    // ============================================================
    // Utility Methods
    // ============================================================

    getFoodDateKey(day) {
        const g = jalaali.toGregorian(this.currentYear, this.currentMonth, day);
        return `${g.gy}-${String(g.gm).padStart(2, "0")}-${String(g.gd).padStart(2, "0")}`;
    }

    getCsrfToken() {
        return document.getElementById("csrf-token")?.value || 
               document.querySelector('[name=csrfmiddlewaretoken]')?.value || '';
    }

    getFirstDayOfMonth() {
        const gDate = jalaali.toGregorian(this.currentYear, this.currentMonth, 1);
        const date = new Date(gDate.gy, gDate.gm - 1, gDate.gd);
        return date.getDay();
    }

    convertWeekDay(day) {
        return (day + 1) % 7;
    }

    getDaysInMonth() {
        return jalaali.jalaaliMonthLength(this.currentYear, this.currentMonth);
    }

    getMonthStartGregorian() {
        return jalaali.toGregorian(this.currentYear, this.currentMonth, 1);
    }

    getMonthEndGregorian() {
        const lastDay = jalaali.jalaaliMonthLength(this.currentYear, this.currentMonth);
        return jalaali.toGregorian(this.currentYear, this.currentMonth, lastDay);
    }

    showToast(type, message) {
        if (typeof showToast === 'function') {
            showToast(type, message);
        } else {
            alert(message);
        }
    }

    // ============================================================
    // Navigation Methods
    // ============================================================

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

    // ============================================================
    // Day Selection (فقط برای کاربر عادی)
    // ============================================================

    selectDay(day) {
    if (this.adminMode) {
        return;
    }

    const key = this.getFoodDateKey(day);
    const menu = this.menuData[key];

    if (!menu) {
        this.showToast('warning', 'برای این روز غذایی ثبت نشده است.');
        return;
    }

    if (menu.reserved) {
        document.dispatchEvent(new CustomEvent("daySelected", {
            detail: {
                year: this.currentYear,
                month: this.currentMonth,
                day: day
            }
        }));
        return;
    }

    this.toggleReservation(day);
}
    // ============================================================
    // API Calls 
    // ============================================================

    async toggleReservation(day) {
    if (this.adminMode) return;

    const key = this.getFoodDateKey(day);
    const csrfToken = this.getCsrfToken();

    try {
        const response = await fetch("/reservations/toggle/", {
            method: "POST",
            headers: {
                "X-CSRFToken": csrfToken,
                "Content-Type": "application/x-www-form-urlencoded",
            },
            body: new URLSearchParams({
                food_date: key
            }),
        });

        const text = await response.text();

        let data;

        try {
            data = JSON.parse(text);
        } catch (jsonError) {
            console.error("❌ پاسخ سرور JSON نیست:", text);

            this.showToast(
                'error',
                `خطای سرور (${response.status})`
            );

            return;
        }

        if (data.success) {

            if (this.menuData[key]) {
                this.menuData[key].reserved = true;
            }

            this.render();

            if (typeof updateReservedCount === 'function') {
                updateReservedCount();
            }

            this.showToast(
                'success',
                data.message || 'رزرو با موفقیت انجام شد.'
            );

            document.dispatchEvent(
                new CustomEvent("daySelected", {
                    detail: {
                        year: this.currentYear,
                        month: this.currentMonth,
                        day: day
                    }
                })
            );

        } else {

            this.showToast(
                'error',
                data.message || 'خطا در رزرو غذا.'
            );
        }

    } catch (error) {

        console.error("❌ Fetch Error:", error);

        this.showToast(
            'error',
            'خطا در ارتباط با سرور.'
        );
    }
}

    async removeMainReservation(day) {
        if (this.adminMode) return;
        
        const key = this.getFoodDateKey(day);
        const menu = this.menuData[key];
        
        if (!menu) {
            this.showToast('error', 'برای این روز غذایی ثبت نشده است.');
            return;
        }

        const csrfToken = this.getCsrfToken();

        try {
            const response = await fetch("/reservations/delete/", {
                method: "POST",
                headers: {
                    "X-CSRFToken": csrfToken,
                    "Content-Type": "application/x-www-form-urlencoded",
                },
                body: new URLSearchParams({ food_date: key }),
            });

            const data = await response.json();

            if (data.success) {
                this.menuData[key].reserved = false;
                this.menuData[key].has_extra_reservation = false;
                this.menuData[key].extra_reservation_count = 0;
                
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
                
                this.showToast('success', data.message || 'رزرو با موفقیت لغو شد.');
            } else {
                this.showToast('error', data.message || 'خطا در لغو رزرو.');
            }
        } catch (error) {
            console.error('❌ Error in removeMainReservation:', error);
            this.showToast('error', 'خطا در ارتباط با سرور.');
        }
    }

    async addExtraReservation(day) {
        if (this.adminMode) return;
        
        const key = this.getFoodDateKey(day);
        const menu = this.menuData[key];
        
        if (!menu) {
            this.showToast('error', 'برای این روز غذایی ثبت نشده است.');
            return;
        }

        const csrfToken = this.getCsrfToken();

        try {
            const response = await fetch("/reservations/add-extra/", {
                method: "POST",
                headers: {
                    "X-CSRFToken": csrfToken,
                    "Content-Type": "application/x-www-form-urlencoded",
                },
                body: new URLSearchParams({ food_date: key }),
            });

            const data = await response.json();

            if (data.success) {
                this.menuData[key].has_extra_reservation = true;
                this.menuData[key].reserved = true;
                this.menuData[key].extra_reservation_count = data.extra_count || 1;
                
                this.render();
                if (typeof updateReservedCount === 'function') {
                    updateReservedCount();
                }
                this.showToast('success', data.message || 'رزرو اضافه با موفقیت انجام شد.');
            } else {
                this.showToast('error', data.message || 'خطا در افزودن رزرو اضافه.');
            }
        } catch (error) {
            console.error('❌ Error in addExtraReservation:', error);
            this.showToast('error', 'خطا در ارتباط با سرور.');
        }
    }

    async removeExtraReservation(day) {
        if (this.adminMode) return;
        
        const key = this.getFoodDateKey(day);
        const menu = this.menuData[key];
        
        if (!menu) {
            this.showToast('error', 'برای این روز غذایی ثبت نشده است.');
            return;
        }

        if (!menu.has_extra_reservation || menu.extra_reservation_count === 0) {
            this.showToast('warning', 'رزرو اضافه‌ای برای کاهش وجود ندارد.');
            return;
        }

        const csrfToken = this.getCsrfToken();

        try {
            const response = await fetch("/reservations/remove-extra/", {
                method: "POST",
                headers: {
                    "X-CSRFToken": csrfToken,
                    "Content-Type": "application/x-www-form-urlencoded",
                },
                body: new URLSearchParams({ food_date: key }),
            });

            const data = await response.json();

            if (data.success) {
                this.menuData[key].extra_reservation_count = data.extra_count || 0;
                this.menuData[key].has_extra_reservation = data.extra_count > 0;
                
                this.render();
                if (typeof updateReservedCount === 'function') {
                    updateReservedCount();
                }
                this.showToast('success', data.message || 'رزرو اضافه کاهش یافت.');
            } else {
                this.showToast('error', data.message || 'خطا در کاهش رزرو اضافه.');
            }
        } catch (error) {
            console.error('❌ Error in removeExtraReservation:', error);
            this.showToast('error', 'خطا در ارتباط با سرور.');
        }
    }
}