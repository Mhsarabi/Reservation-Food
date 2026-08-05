document.addEventListener("DOMContentLoaded", function() {
    // ============================================================
    // 1. اعتبارسنجی فرم افزودن کاربر جدید
    // ============================================================
    const addButton = document.querySelector(".new-user button");
    const inputs = document.querySelectorAll(".new-user input");
    const siteSelect = document.querySelector(".new-user select[name='site']");
    const departmentSelect = document.querySelector(".new-user select[name='department']");

    if (addButton) {
        addButton.addEventListener("click", function(e) {
            let empty = false;

            inputs.forEach(input => {
                if (input.value.trim() === "") {
                    empty = true;
                    input.classList.add("is-invalid");
                } else {
                    input.classList.remove("is-invalid");
                }
            });

            if (siteSelect) {
                if (siteSelect.value.trim() === "") {
                    empty = true;
                    siteSelect.classList.add("is-invalid");
                } else {
                    siteSelect.classList.remove("is-invalid");
                }
            }

            if (departmentSelect) {
                if (departmentSelect.value.trim() === "") {
                    empty = true;
                    departmentSelect.classList.add("is-invalid");
                } else {
                    departmentSelect.classList.remove("is-invalid");
                }
            }

            if (empty) {
                e.preventDefault();
                showMessage("لطفاً تمام اطلاعات کاربر را وارد کنید.", "danger");
            }
        });
    }

    inputs.forEach(input => {
        input.addEventListener("input", function() {
            if (this.value.trim() !== "") {
                this.classList.remove("is-invalid");
            }
        });
    });

    if (siteSelect) {
        siteSelect.addEventListener("change", function() {
            if (this.value.trim() !== "") {
                this.classList.remove("is-invalid");
            }
        });
    }

    if (departmentSelect) {
        departmentSelect.addEventListener("change", function() {
            if (this.value.trim() !== "") {
                this.classList.remove("is-invalid");
            }
        });
    }

    // ============================================================
    // 2. تغییر وضعیت کاربر (فعال/غیرفعال) با مودال تأیید
    // ============================================================
    const toggleStatusButtons = document.querySelectorAll(".toggle-status-btn");

    toggleStatusButtons.forEach(btn => {
        btn.addEventListener("click", function() {
            const userId = this.dataset.userId;
            const username = this.dataset.username;
            const currentStatus = this.dataset.status;
            const newStatus = currentStatus === "active" ? "inactive" : "active";
            const action = newStatus === "active" ? "فعال" : "غیرفعال";
            const icon = newStatus === "active" ? "bi-check-circle-fill text-success" : "bi-x-circle-fill text-danger";

            showConfirmModal(
                `تغییر وضعیت حساب کاربری`,
                `
                <div class="text-center">
                    <i class="bi ${icon}" style="font-size: 4rem;"></i>
                    <p class="mt-3">آیا از <strong>${action}</strong> کردن حساب کاربری</p>
                    <p class="fw-bold text-primary fs-5">"${username}"</p>
                    <p class="text-muted small">اطمینان دارید؟</p>
                </div>
                `,
                function() {
                    fetch("/Alvan/toggle-status/user", {
                        method: "POST",
                        headers: {
                            "X-CSRFToken": getCSRFToken(),
                            "Content-Type": "application/x-www-form-urlencoded",
                        },
                        body: new URLSearchParams({
                            user_id: userId,
                            status: newStatus
                        })
                    })
                    .then(response => response.json())
                    .then(data => {
                        if (data.success) {
                            showMessage(`حساب کاربری با موفقیت ${action} شد.`, "success");
                            setTimeout(() => {
                                location.reload();
                            }, 1500);
                        } else {
                            showMessage(data.message || `خطا در ${action} کردن حساب کاربری.`, "danger");
                        }
                    })
                    .catch(error => {
                        showMessage("خطا در ارتباط با سرور.", "danger");
                    });
                }
            );
        });
    });

    // ============================================================
    // 3. ویرایش کاربر
    // ============================================================
    const editButtons = document.querySelectorAll(".edit-user-btn");

    editButtons.forEach(btn => {
        btn.addEventListener("click", function() {
            const userId = this.dataset.userId;
            const firstName = this.dataset.firstName;
            const lastName = this.dataset.lastName;
            const nationalCode = this.dataset.nationalCode;
            const personnelCode = this.dataset.personnelCode;
            const username = this.dataset.username;
            const site = this.dataset.site;
            const department = this.dataset.department;
            const status = this.dataset.status;

            document.getElementById("editUserId").value = userId;
            document.getElementById("editFirstName").value = firstName;
            document.getElementById("editLastName").value = lastName;
            document.getElementById("editNationalCode").value = nationalCode;
            document.getElementById("editPersonnelCode").value = personnelCode;
            document.getElementById("editUsername").value = username;
            document.getElementById("editSite").value = site;
            document.getElementById("editDepartment").value = department;
            document.getElementById("editStatus").value = status;

            const modal = new bootstrap.Modal(
                document.getElementById("editUserModal")
            );
            modal.show();
        });
    });

    // ============================================================
    // 4. ذخیره تغییرات ویرایش کاربر
    // ============================================================
    const saveUserChanges = document.getElementById("saveUserChanges");

    if (saveUserChanges) {
        saveUserChanges.addEventListener("click", function() {
            const userId = document.getElementById("editUserId").value;
            const firstName = document.getElementById("editFirstName").value;
            const lastName = document.getElementById("editLastName").value;
            const nationalCode = document.getElementById("editNationalCode").value;
            const personnelCode = document.getElementById("editPersonnelCode").value;
            const username = document.getElementById("editUsername").value;
            const site = document.getElementById("editSite").value;
            const department = document.getElementById("editDepartment").value;
            const status = document.getElementById("editStatus").value;

            if (!firstName.trim() || !lastName.trim() || !nationalCode.trim() || 
                !personnelCode.trim() || !username.trim() || !site || !department) {
                showMessage("لطفاً تمام فیلدها را پر کنید.", "danger");
                return;
            }

            fetch("/Alvan/edit/user", {
                method: "POST",
                headers: {
                    "X-CSRFToken": getCSRFToken(),
                    "Content-Type": "application/x-www-form-urlencoded",
                },
                body: new URLSearchParams({
                    user_id: userId,
                    first_name: firstName,
                    last_name: lastName,
                    national_code: nationalCode,
                    personnel_code: personnelCode,
                    username: username,
                    site: site,
                    department: department,
                    is_active: status === "active" ? "true" : "false"
                })
            })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    showMessage("اطلاعات کاربر با موفقیت به‌روزرسانی شد.", "success");
                    const modalElement = document.getElementById("editUserModal");
                    const modal = bootstrap.Modal.getInstance(modalElement);
                    modal.hide();
                    setTimeout(() => {
                        location.reload();
                    }, 1500);
                } else {
                    showMessage(data.message || "خطا در به‌روزرسانی اطلاعات.", "danger");
                }
            })
            .catch(error => {
                showMessage("خطا در ارتباط با سرور.", "danger");
            });
        });
    }

    // ============================================================
    // 5. حذف کاربر با مودال تأیید
    // ============================================================
    const deleteButtons = document.querySelectorAll(".delete-user-btn");

    deleteButtons.forEach(btn => {
        btn.addEventListener("click", function() {
            const userId = this.dataset.userId;
            const username = this.dataset.username;

            showConfirmModal(
                `حذف کاربر`,
                `
                <div class="text-center">
                    <i class="bi bi-exclamation-triangle-fill text-danger" style="font-size: 4rem;"></i>
                    <p class="mt-3">آیا از حذف کاربر</p>
                    <p class="fw-bold text-danger fs-5">"${username}"</p>
                    <p class="mt-3">مطمئن هستید؟</p>
                    <p class="text-muted small">این عمل غیرقابل بازگشت است!</p>
                </div>
                `,
                function() {
                    fetch("/Alvan/delete/user", {
                        method: "POST",
                        headers: {
                            "X-CSRFToken": getCSRFToken(),
                            "Content-Type": "application/x-www-form-urlencoded",
                        },
                        body: new URLSearchParams({
                            user_id: userId
                        })
                    })
                    .then(response => response.json())
                    .then(data => {
                        if (data.success) {
                            showMessage("کاربر با موفقیت حذف شد.", "success");
                            setTimeout(() => {
                                location.reload();
                            }, 1500);
                        } else {
                            showMessage(data.message || "خطا در حذف کاربر.", "danger");
                        }
                    })
                    .catch(error => {
                        showMessage("خطا در ارتباط با سرور.", "danger");
                    });
                }
            );
        });
    });

    // ============================================================
    // 6. ریست رمز عبور کاربر
    // ============================================================
    const resetButtons = document.querySelectorAll(".reset-password-btn");

    resetButtons.forEach(btn => {
        btn.addEventListener("click", function() {
            const username = this.dataset.username;
            const userId = this.dataset.userId;

            document.getElementById("resetUsername").innerText = username;
            document.getElementById("resetUserId").value = userId;

            const modal = new bootstrap.Modal(
                document.getElementById("resetPasswordModal")
            );
            modal.show();
        });
    });

    // ============================================================
    // 7. ذخیره رمز جدید برای کاربر
    // ============================================================
    const saveResetPassword = document.getElementById("saveResetPassword");

    if (saveResetPassword) {
        saveResetPassword.addEventListener("click", function() {
            const userId = document.getElementById("resetUserId").value;
            const newPassword = document.getElementById("newUserPassword").value;

            if (newPassword.trim() === "") {
                showMessage("لطفاً رمز جدید را وارد کنید.", "danger");
                return;
            }

            if (newPassword.length < 8) {
                showMessage("رمز عبور باید حداقل 8 کاراکتر باشد.", "danger");
                return;
            }

            fetch("/Alvan/reset-password/user", {
                method: "POST",
                headers: {
                    "X-CSRFToken": getCSRFToken(),
                    "Content-Type": "application/x-www-form-urlencoded",
                },
                body: new URLSearchParams({
                    user_id: userId,
                    password: newPassword
                })
            })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    showMessage("رمز عبور با موفقیت تغییر کرد.", "success");
                    const modalElement = document.getElementById("resetPasswordModal");
                    const modal = bootstrap.Modal.getInstance(modalElement);
                    modal.hide();
                    document.getElementById("newUserPassword").value = "";
                } else {
                    showMessage(data.message || "خطا در تغییر رمز عبور.", "danger");
                }
            })
            .catch(error => {
                showMessage("خطا در ارتباط با سرور.", "danger");
            });
        });
    }

    // ============================================================
    // 8. نمایش تاریخ امروز
    // ============================================================
    const today = new Date();
    const todayDateElement = document.getElementById("todayDate");
    if (todayDateElement) {
        todayDateElement.textContent = today.toLocaleDateString("fa-IR");
    }

    // ============================================================
    // 9. مدیریت دکمه‌های منو برای نمایش مودال‌ها
    // ============================================================
    const menuButtons = {
        "changePassword": "passwordModal",
        "manageFoods": "foodModal",
        "editFoods": "editFoodModal",
        "monthlyReport": "reportModal"
    };

    Object.keys(menuButtons).forEach(btnId => {
        const btn = document.getElementById(btnId);
        if (btn) {
            btn.addEventListener("click", function(e) {
                e.preventDefault();
                const modalId = menuButtons[btnId];
                const modal = new bootstrap.Modal(
                    document.getElementById(modalId)
                );
                modal.show();
            });
        }
    });
});

// ============================================================
// تابع برای نمایش مودال تأیید سفارشی
// ============================================================
function showConfirmModal(title, bodyHTML, onConfirm) {
    const existingModal = document.getElementById("customConfirmModal");
    if (existingModal) {
        existingModal.remove();
    }

    // ساخت مودال جدید
    const modalHTML = `
        <div class="modal fade" id="customConfirmModal" tabindex="-1" aria-hidden="true">
            <div class="modal-dialog modal-dialog-centered">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">${title}</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">
                        ${bodyHTML}
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">انصراف</button>
                        <button type="button" class="btn btn-primary" id="confirmAction">تأیید</button>
                    </div>
                </div>
            </div>
        </div>
    `;

    // اضافه کردن مودال به صفحه
    document.body.insertAdjacentHTML('beforeend', modalHTML);

    // نمایش مودال
    const modalElement = document.getElementById("customConfirmModal");
    const modal = new bootstrap.Modal(modalElement);
    modal.show();

    // رویداد برای دکمه تأیید
    document.getElementById("confirmAction").addEventListener("click", function() {
        modal.hide();
        // حذف مودال بعد از بسته شدن
        modalElement.addEventListener('hidden.bs.modal', function() {
            modalElement.remove();
        });
        // اجرای تابع تأیید
        if (typeof onConfirm === 'function') {
            onConfirm();
        }
    });

    // حذف مودال هنگام بسته شدن با دکمه close یا کلیک خارج
    modalElement.addEventListener('hidden.bs.modal', function() {
        setTimeout(() => {
            if (document.getElementById("customConfirmModal")) {
                modalElement.remove();
            }
        }, 300);
    });
}

// ============================================================
// تابع کمکی برای نمایش پیام‌ها
// ============================================================
function showMessage(message, type = "info") {
    const existingAlerts = document.querySelectorAll(".alert.position-fixed");
    existingAlerts.forEach(alert => alert.remove());

    const alertBox = document.createElement("div");
    alertBox.className =
        `alert alert-${type} position-fixed top-0 start-50 translate-middle-x mt-3 shadow`;
    alertBox.style.zIndex = "9999";
    alertBox.style.minWidth = "300px";
    alertBox.style.textAlign = "center";
    alertBox.style.maxWidth = "90%";
    alertBox.innerHTML = message;

    document.body.appendChild(alertBox);

    setTimeout(() => {
        if (alertBox.parentNode) {
            alertBox.remove();
        }
    }, 3000);
}

// ============================================================
// تابع کمکی برای دریافت توکن CSRF
// ============================================================
function getCSRFToken() {
    const tokenElement = document.getElementById("csrf-token");
    return tokenElement ? tokenElement.value : null;
}