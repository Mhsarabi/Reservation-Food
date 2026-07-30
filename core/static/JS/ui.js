document.addEventListener("daySelected", function (event) {
    const selectedDate = document.getElementById("selectedDate");
    const foodImage = document.getElementById("foodImage");
    const foodName = document.getElementById("foodName");
    // const reserveBtn = document.getElementById("reserveBtn");
    // const foodDate = document.getElementById("foodDate");



    const { year, month, day } = event.detail;

    const g = jalaali.toGregorian(year, month, day);

    const key =
    `${g.gy}-${String(g.gm).padStart(2, "0")}-${String(g.gd).padStart(2, "0")}`;

    const menu = menuData[key];
    

    if (menu) {

    selectedDate.textContent =
    `${day} ${getMonthName(month)} ${year}`;

    foodImage.src = menu.image;
    foodName.textContent = menu.foodName;

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

    document.getElementById("reservedCount").textContent =
        `تعداد غذاهای رزرو شده این ماه: ${count}`;

}


/* ==========================
    Change Password
========================== */

const passwordModal = new bootstrap.Modal(
    document.getElementById("passwordModal")
);

const passwordMessage = document.getElementById("passwordMessage");

function showPasswordMessage(text, type) {

    passwordMessage.classList.remove(
        "d-none",
        "alert-success",
        "alert-danger"
    );

    passwordMessage.classList.add(`alert-${type}`);

    passwordMessage.textContent = text;
}

document
    .getElementById("changePassword")
    .addEventListener("click", function () {

        passwordMessage.className = "alert d-none";

        document.getElementById("oldPassword").value = "";
        document.getElementById("newPassword").value = "";
        document.getElementById("repeatPassword").value = "";

        passwordModal.show();
    });


document
    .getElementById("savePassword")
    .addEventListener("click", async function () {

        const oldPassword =
            document.getElementById("oldPassword").value.trim();

        const newPassword =
            document.getElementById("newPassword").value.trim();

        const repeatPassword =
            document.getElementById("repeatPassword").value.trim();

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
            showPasswordMessage(
                "رمز جدید باید حداقل ۸ کاراکتر باشد.",
                "danger"
            );
            return;
        }

        if (newPassword !== repeatPassword) {
            showPasswordMessage(
                "تکرار رمز عبور صحیح نیست.",
                "danger"
            );
            return;
        }

        if (oldPassword === newPassword) {
            showPasswordMessage(
                "رمز جدید نباید با رمز فعلی یکسان باشد.",
                "danger"
            );
            return;
        }

        const csrfToken =
            document.getElementById("csrf-token").value;

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

                showPasswordMessage(
                    data.message,
                    "success"
                );

                document.getElementById("oldPassword").value = "";
                document.getElementById("newPassword").value = "";
                document.getElementById("repeatPassword").value = "";

            } else {

                showPasswordMessage(
                    data.message,
                    "danger"
                );

            }

        } catch (error) {

            showPasswordMessage(
                "خطا در ارتباط با سرور.",
                "danger"
            );

            console.error(error);

        }

    });