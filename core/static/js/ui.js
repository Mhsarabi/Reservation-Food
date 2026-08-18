// ============================================================
// UI - User Panel
// ============================================================


// ============================================================
// Toast Notification System
// ============================================================

function showToast(type, message) {

    const container = document.getElementById("toastContainer");

    if (!container) {
        console.error("toastContainer پیدا نشد.");
        return;
    }

    // error → danger
    if (type === "error") {
        type = "danger";
    }

    const toastConfig = {

        success: {
            title: "موفق",
            icon: "bi-check-circle-fill"
        },

        danger: {
            title: "خطا",
            icon: "bi-x-circle-fill"
        },

        warning: {
            title: "هشدار",
            icon: "bi-exclamation-triangle-fill"
        },

        info: {
            title: "اطلاع",
            icon: "bi-info-circle-fill"
        }
    };

    const config =
        toastConfig[type] || toastConfig.info;


    const toastEl = document.createElement("div");

    toastEl.className =
        `user-toast user-toast-${type}`;


    toastEl.innerHTML = `

        <div class="user-toast-icon">

            <i class="bi ${config.icon}"></i>

        </div>


        <div class="user-toast-content">

            <strong>
                ${config.title}
            </strong>

            <span>
                ${message}
            </span>

        </div>


        <button
            type="button"
            class="user-toast-close">

            <i class="bi bi-x"></i>

        </button>

    `;


    container.appendChild(toastEl);


    // نمایش انیمیشن
    requestAnimationFrame(() => {

        toastEl.classList.add("show");

    });


    // دکمه بستن
    const closeButton =
        toastEl.querySelector(".user-toast-close");


    if (closeButton) {

        closeButton.addEventListener("click", () => {

            removeToast(toastEl);

        });

    }


    // بستن خودکار
    setTimeout(() => {

        removeToast(toastEl);

    }, 3500);
}


// ============================================================
// Remove Toast
// ============================================================

function removeToast(toastEl) {

    if (!toastEl || !toastEl.isConnected) {
        return;
    }


    toastEl.classList.remove("show");

    toastEl.classList.add("hide");


    setTimeout(() => {

        if (toastEl.isConnected) {
            toastEl.remove();
        }

    }, 350);
}


// ============================================================
// CSRF Token Helper
// ============================================================

function getCsrfToken() {

    return (
        document.getElementById("csrf-token")?.value ||
        document.querySelector(
            "[name=csrfmiddlewaretoken]"
        )?.value ||
        ""
    );
}


// ============================================================
// Today Date
// ============================================================

function initTodayDate() {

    const todayDateEl =
        document.getElementById("todayDate");


    if (!todayDateEl) {
        return;
    }


    const today = new Date();


    todayDateEl.textContent =
        today.toLocaleDateString("fa-IR", {

            year: "numeric",

            month: "long",

            day: "numeric"

        });
}


// ============================================================
// Change Password
// ============================================================

function initChangePassword() {

    const passwordModalElement =
        document.getElementById("passwordModal");


    const changePasswordButton =
        document.getElementById("changePassword");


    const savePasswordButton =
        document.getElementById("savePassword");


    const passwordMessage =
        document.getElementById("passwordMessage");


    if (
        !passwordModalElement ||
        !changePasswordButton ||
        !savePasswordButton
    ) {
        return;
    }


    const passwordModal =
        new bootstrap.Modal(
            passwordModalElement
        );


    // --------------------------------------------------------
    // نمایش پیام
    // --------------------------------------------------------

    function showPasswordMessage(text, type) {

        if (!passwordMessage) {
            return;
        }


        passwordMessage.classList.remove(
            "d-none",
            "alert-success",
            "alert-danger",
            "alert-warning"
        );


        passwordMessage.classList.add(
            `alert-${type}`
        );


        passwordMessage.textContent = text;
    }


    // --------------------------------------------------------
    // باز کردن Modal
    // --------------------------------------------------------

    changePasswordButton.addEventListener(
        "click",
        function (event) {

            event.preventDefault();

            event.stopPropagation();


            if (passwordMessage) {

                passwordMessage.className =
                    "alert d-none";

            }


            const oldPassword =
                document.getElementById("oldPassword");


            const newPassword =
                document.getElementById("newPassword");


            const repeatPassword =
                document.getElementById("repeatPassword");


            if (oldPassword) {
                oldPassword.value = "";
            }


            if (newPassword) {
                newPassword.value = "";
            }


            if (repeatPassword) {
                repeatPassword.value = "";
            }


            passwordModal.show();

        }
    );


    // --------------------------------------------------------
    // ذخیره رمز عبور
    // --------------------------------------------------------

    savePasswordButton.addEventListener(
        "click",
        async function (event) {

            event.preventDefault();

            event.stopPropagation();


            const oldPassword =
                document.getElementById(
                    "oldPassword"
                )?.value.trim() || "";


            const newPassword =
                document.getElementById(
                    "newPassword"
                )?.value.trim() || "";


            const repeatPassword =
                document.getElementById(
                    "repeatPassword"
                )?.value.trim() || "";


            // ------------------------------------------------
            // Validation
            // ------------------------------------------------

            if (!oldPassword) {

                showPasswordMessage(
                    "رمز فعلی را وارد کنید.",
                    "danger"
                );

                return;
            }


            if (!newPassword) {

                showPasswordMessage(
                    "رمز جدید را وارد کنید.",
                    "danger"
                );

                return;
            }


            if (!repeatPassword) {

                showPasswordMessage(
                    "تکرار رمز جدید را وارد کنید.",
                    "danger"
                );

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


            // ------------------------------------------------
            // CSRF
            // ------------------------------------------------

            const csrfToken =
                getCsrfToken();


            try {

                const response =
                    await fetch(
                        "/change-password/",
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

                                    old_password:
                                        oldPassword,

                                    new_password:
                                        newPassword,

                                    repeat_password:
                                        repeatPassword

                                })

                        }
                    );


                const data =
                    await response.json();


                // ------------------------------------------------
                // Success
                // ------------------------------------------------

                if (data.success) {

                    showPasswordMessage(
                        data.message ||
                        "رمز عبور با موفقیت تغییر کرد.",
                        "success"
                    );


                    document.getElementById(
                        "oldPassword"
                    ).value = "";


                    document.getElementById(
                        "newPassword"
                    ).value = "";


                    document.getElementById(
                        "repeatPassword"
                    ).value = "";


                    setTimeout(() => {

                        passwordModal.hide();

                    }, 1500);


                    return;
                }


                // ------------------------------------------------
                // Server Error
                // ------------------------------------------------

                showPasswordMessage(
                    data.message ||
                    "خطا در تغییر رمز عبور.",
                    "danger"
                );

            }


            catch (error) {

                console.error(
                    "❌ Change password error:",
                    error
                );


                showPasswordMessage(
                    "خطا در ارتباط با سرور.",
                    "danger"
                );

            }

        }
    );

}


// ============================================================
// Initialize UI
// ============================================================

function initUserUI() {

    initTodayDate();

    initChangePassword();

}


// ============================================================
// DOM Ready
// ============================================================

if (document.readyState === "loading") {

    document.addEventListener(
        "DOMContentLoaded",
        initUserUI
    );

} else {

    initUserUI();

}