    document.addEventListener("daySelected", function (event) {
        const selectedDate = document.getElementById("selectedDate");
        const foodImage = document.getElementById("foodImage");
        const foodName = document.getElementById("foodName");
        // const reserveBtn = document.getElementById("reserveBtn");
        // const foodDate = document.getElementById("foodDate");



        const { year, month, day } = event.detail;

        const key =
            `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;

        const menu = menuData[key];
        

        if (menu) {

        selectedDate.textContent =
            `${day} ${getMonthName(month)} ${year}`;

        const menu = menuData[key];

        if (menu) {

            const food = foods.find(f => f.id === menu.foodId);

            selectedDate.textContent =
                `${day} ${getMonthName(month)} ${year}`;

            if (food) {

                foodImage.src = food.image;

                foodName.textContent = food.name;

            } else {

                foodImage.src = "../static/images/no-food.png";

                foodName.textContent = "غذایی ثبت نشده است.";

            }


            currentMenu = menu;

        }
        else {

            selectedDate.textContent =
                `${day} ${getMonthName(month)} ${year}`;

            foodImage.src = "../static/images/no-food.png";

            foodName.textContent = "غذایی ثبت نشده است.";

        }

        if (menu.reserved) {

        // updateReserveButton("reserved");

        }
        else {

            // updateReserveButton("available");

        }

        }
        else {

            selectedDate.textContent =
                `${day} ${getMonthName(month)} ${year}`;

            foodImage.src = "../static/images/no-food.png";

            foodName.textContent = "غذایی ثبت نشده است.";

            time.textContent = "-";

            // updateReserveButton("closed");

        }

    });

    function getMonthName(month) {

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

        return months[month - 1];

    }

    function updateReservedCount() {

        let count = 0;

        Object.entries(menuData).forEach(([key, menu]) => {

            const [year, month] = key.split("-");

            if (
                Number(year) === calendar.currentYear &&
                Number(month) === calendar.currentMonth &&
                menu.reserved
            ) {
                count++;
            }

        });

        document.getElementById("reservedCount").textContent =
            `تعداد غذاهای رزرو شده این ماه: ${count}`;

    }


    /* ==========================
        Change Password
    ========================== */

    const passwordModal =
        new bootstrap.Modal(
            document.getElementById("passwordModal")
        );

    document
        .getElementById("changePassword")
        .addEventListener("click", function () {

            document.getElementById("passwordMessage")
                .className = "alert d-none";

            document.getElementById("oldPassword").value = "";
            document.getElementById("newPassword").value = "";
            document.getElementById("repeatPassword").value = "";

            passwordModal.show();

        });

    document
        .getElementById("savePassword")
        .addEventListener("click", function () {

            const oldPass =
                document.getElementById("oldPassword").value.trim();

            const newPass =
                document.getElementById("newPassword").value.trim();

            const repeatPass =
                document.getElementById("repeatPassword").value.trim();

            const message =
                document.getElementById("passwordMessage");

            function showMessage(text, type){

                message.className =
                    `alert alert-${type}`;

                message.textContent = text;

            }

            if(oldPass === ""){

                showMessage("رمز فعلی را وارد کنید.","danger");
                return;

            }

            if(newPass === ""){

                showMessage("رمز جدید را وارد کنید.","danger");
                return;

            }

            if(repeatPass === ""){

                showMessage("تکرار رمز جدید را وارد کنید.","danger");
                return;

            }

            if(newPass.length < 8){

                showMessage("رمز جدید باید حداقل ۸ کاراکتر باشد.","danger");
                return;

            }

            if(newPass !== repeatPass){

                showMessage("تکرار رمز با رمز جدید یکسان نیست.","danger");
                return;

            }

            if(oldPass === newPass){

                showMessage("رمز جدید نباید با رمز فعلی یکسان باشد.","danger");
                return;

            }

            showMessage(
                "اعتبارسنجی با موفقیت انجام شد.",
                "success"
            );

        });