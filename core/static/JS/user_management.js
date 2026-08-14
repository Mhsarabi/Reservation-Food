// ============================================================
// User Management JS - مدیریت جدول کاربران
// ============================================================

// ============================================================
// تابع برای نمایش مودال تأیید سفارشی (خارج از DOMContentLoaded)
// ============================================================
function showConfirmModal(title, bodyHTML, onConfirm) {
    const existingModal = document.getElementById("customConfirmModal");
    if (existingModal) {
        existingModal.remove();
    }

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

    document.body.insertAdjacentHTML('beforeend', modalHTML);

    const modalElement = document.getElementById("customConfirmModal");
    const modal = new bootstrap.Modal(modalElement);
    modal.show();

    document.getElementById("confirmAction").addEventListener("click", function() {
        modal.hide();
        modalElement.addEventListener('hidden.bs.modal', function() {
            modalElement.remove();
        });
        if (typeof onConfirm === 'function') {
            onConfirm();
        }
    });

    modalElement.addEventListener('hidden.bs.modal', function() {
        setTimeout(() => {
            if (document.getElementById("customConfirmModal")) {
                modalElement.remove();
            }
        }, 300);
    });
}

// ============================================================
// تابع کمکی برای دریافت توکن CSRF (خارج از DOMContentLoaded)
// ============================================================
function getCSRFToken() {
    const tokenElement = document.getElementById("csrf-token");
    if (tokenElement) {
        return tokenElement.value;
    }
    const cookieValue = document.cookie
        .split('; ')
        .find(row => row.startsWith('csrftoken='))
        ?.split('=')[1];
    return cookieValue || '';
}

// ============================================================
// تابع نمایش پیام (خارج از DOMContentLoaded)
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
// DOMContentLoaded - اجرای کدهای اصلی
// ============================================================
document.addEventListener("DOMContentLoaded", function() {
    
    console.log("✅ User Management initialized!");

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
    // 2. فیلترهای AJAX بدون رفرش صفحه
    // ============================================================
    const filterInputs = document.querySelectorAll(".filter-input");
    const filterSelects = document.querySelectorAll(".filter-select");
    const userTableBody = document.getElementById("userTableBody");
    
    let timeoutId = null;

    function fetchUsers() {
        const params = new URLSearchParams();
        
        filterInputs.forEach(input => {
            const value = input.value.trim();
            if (value) params.append(input.name, value);
        });
        
        filterSelects.forEach(select => {
            const value = select.value.trim();
            if (value) params.append(select.name, value);
        });
        
        if (userTableBody) {
            userTableBody.innerHTML = `
                <tr>
                    <td colspan="10" class="text-center py-4">
                        <div class="spinner-border text-success" role="status">
                            <span class="visually-hidden">در حال بارگذاری...</span>
                        </div>
                        <p class="text-muted mt-2">در حال جستجو...</p>
                    </td>
                </tr>
            `;
        }

        fetch(`/Alvan/users?${params.toString()}`, {
            headers: {
                'X-Requested-With': 'XMLHttpRequest'
            }
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                if (userTableBody) {
                    userTableBody.innerHTML = data.html;
                }
            }
        })
        .catch(error => {
            console.error('Error:', error);
            if (userTableBody) {
                userTableBody.innerHTML = `
                    <tr>
                        <td colspan="10" class="text-center py-4 text-danger">
                            <i class="bi bi-exclamation-triangle display-4"></i>
                            <p class="mt-2">خطا در ارتباط با سرور</p>
                        </td>
                    </tr>
                `;
            }
        });
    }

    filterInputs.forEach(input => {
        input.addEventListener("input", function() {
            clearTimeout(timeoutId);
            timeoutId = setTimeout(fetchUsers, 400);
        });
    });

    filterSelects.forEach(select => {
        select.addEventListener("change", function() {
            fetchUsers();
        });
    });

    // ============================================================
    // 3. Event Delegation برای دکمه‌های عملیات
    // ============================================================
    const userTable = document.getElementById("userTable");
    
    if (userTable) {
        userTable.addEventListener("click", function(e) {
            const target = e.target.closest(".toggle-status-btn");
            if (target) {
                handleToggleStatus(e, target);
            }
        });
        
        userTable.addEventListener("click", function(e) {
            const target = e.target.closest(".edit-toggle-btn");
            if (target) {
                const userId = target.dataset.userId;
                enableEditMode(userId);
            }
        });
        
        userTable.addEventListener("click", function(e) {
            const target = e.target.closest(".save-edit-btn");
            if (target) {
                const userId = target.dataset.userId;
                saveEditUser(userId);
            }
        });
        
        userTable.addEventListener("click", function(e) {
            const target = e.target.closest(".cancel-edit-btn");
            if (target) {
                const userId = target.dataset.userId;
                cancelEditMode(userId);
            }
        });
        
        userTable.addEventListener("click", function(e) {
            const target = e.target.closest(".delete-user-btn");
            if (target) {
                handleDeleteUser(e, target);
            }
        });
        
        userTable.addEventListener("click", function(e) {
            const target = e.target.closest(".reset-password-btn");
            if (target) {
                handleResetPassword(e, target);
            }
        });
        
        // ============================================================
        // ✅ دکمه مجوز رزرو اضافه (جدید)
        // ============================================================
        userTable.addEventListener("click", function(e) {
            const target = e.target.closest(".extra-reservation-btn");
            if (target) {
                handleExtraReservation(e, target);
            }
        });
    }

    // ============================================================
    // 4. هندلرهای دکمه‌های عملیات
    // ============================================================
    function handleToggleStatus(e, btn) {
        const userId = btn.dataset.userId;
        const username = btn.dataset.username;
        const currentStatus = btn.dataset.status;
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
                        fetchUsers();
                    } else {
                        showMessage(data.message || `خطا در ${action} کردن حساب کاربری.`, "danger");
                    }
                })
                .catch(error => {
                    showMessage("خطا در ارتباط با سرور.", "danger");
                });
            }
        );
    }

    // ============================================================
    // 5. توابع Inline Edit
    // ============================================================
    function enableEditMode(userId) {
        const row = document.getElementById(`user-row-${userId}`);
        if (!row) return;
        row.classList.add('editing');
    }

    function cancelEditMode(userId) {
        const row = document.getElementById(`user-row-${userId}`);
        if (!row) return;
        row.classList.remove('editing');
    }

    function saveEditUser(userId) {
        const row = document.getElementById(`user-row-${userId}`);
        if (!row) return;
        
        const first_name = row.querySelector('input[name="first_name"]').value.trim();
        const last_name = row.querySelector('input[name="last_name"]').value.trim();
        const national_code = row.querySelector('input[name="national_code"]').value.trim();
        const personnel_code = row.querySelector('input[name="personnel_code"]').value.trim();
        const username = row.querySelector('input[name="username"]').value.trim();
        const site = row.querySelector('select[name="site"]').value;
        const department = row.querySelector('select[name="department"]').value;
        const status = row.querySelector('select[name="status"]').value;
        
        if (!first_name || !last_name || !national_code || !personnel_code || !username) {
            showMessage("لطفاً تمام فیلدهای ضروری را پر کنید.", "danger");
            return;
        }
        
        if (!site) {
            showMessage("لطفاً سایت را انتخاب کنید.", "danger");
            return;
        }
        
        if (!department) {
            showMessage("لطفاً واحد را انتخاب کنید.", "danger");
            return;
        }
        
        const saveBtn = row.querySelector('.save-edit-btn');
        const originalHtml = saveBtn.innerHTML;
        saveBtn.innerHTML = '<span class="spinner-border spinner-border-sm" role="status"></span>';
        saveBtn.disabled = true;
        
        fetch("/Alvan/edit/user", {
            method: "POST",
            headers: {
                "X-CSRFToken": getCSRFToken(),
                "Content-Type": "application/x-www-form-urlencoded",
            },
            body: new URLSearchParams({
                user_id: userId,
                first_name: first_name,
                last_name: last_name,
                national_code: national_code,
                personnel_code: personnel_code,
                username: username,
                site: site,
                department: department,
                is_active: status === "active" ? "true" : "false"
            })
        })
        .then(response => response.json())
        .then(data => {
            saveBtn.innerHTML = originalHtml;
            saveBtn.disabled = false;
            
            if (data.success) {
                showMessage("اطلاعات کاربر با موفقیت به‌روزرسانی شد.", "success");
                fetchUsers();
            } else {
                showMessage(data.message || "خطا در به‌روزرسانی اطلاعات.", "danger");
            }
        })
        .catch(error => {
            saveBtn.innerHTML = originalHtml;
            saveBtn.disabled = false;
            showMessage("خطا در ارتباط با سرور.", "danger");
        });
    }

    // ============================================================
    // 6. حذف کاربر
    // ============================================================
    function handleDeleteUser(e, btn) {
        const userId = btn.dataset.userId;
        const username = btn.dataset.username;

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
                        fetchUsers();
                    } else {
                        showMessage(data.message || "خطا در حذف کاربر.", "danger");
                    }
                })
                .catch(error => {
                    showMessage("خطا در ارتباط با سرور.", "danger");
                });
            }
        );
    }

    // ============================================================
    // 7. ریست رمز عبور کاربر
    // ============================================================
    function handleResetPassword(e, btn) {
        const username = btn.dataset.username;
        const userId = btn.dataset.userId;

        const resetUsernameEl = document.getElementById("resetUsername");
        const resetUserIdEl = document.getElementById("resetUserId");
        
        if (resetUsernameEl) resetUsernameEl.innerText = username;
        if (resetUserIdEl) resetUserIdEl.value = userId;

        const modalElement = document.getElementById("resetPasswordModal");
        if (modalElement) {
            const modal = new bootstrap.Modal(modalElement);
            modal.show();
        }
    }

    // ============================================================
    // 8. ذخیره رمز جدید برای کاربر
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
                    if (modalElement) {
                        const modal = bootstrap.Modal.getInstance(modalElement);
                        if (modal) modal.hide();
                    }
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
    // 9. دکمه ورودی اکسل - فقط باز کردن مودال
    // ============================================================
    const importUsersBtn = document.getElementById('importUsersBtn');
    if (importUsersBtn) {
        importUsersBtn.addEventListener('click', function(e) {
            e.preventDefault();
            const modalElement = document.getElementById('importUsersModal');
            if (modalElement) {
                const modal = new bootstrap.Modal(modalElement);
                modal.show();
            } else {
                console.error('❌ مودال importUsersModal پیدا نشد!');
            }
        });
    }

    // ============================================================
    // 10. ✅ هندلر مجوز رزرو اضافه (جدید)
    // ============================================================
    function handleExtraReservation(e, btn) {
        const userId = btn.dataset.userId;
        const username = btn.dataset.username;
        const currentStatus = btn.dataset.canExtra === 'true';
        const newStatus = !currentStatus;
        const action = newStatus ? "فعال" : "غیرفعال";
        const icon = newStatus ? "bi-plus-circle-fill text-success" : "bi-plus-circle";

        showConfirmModal(
            `تغییر مجوز رزرو اضافه`,
            `
            <div class="text-center">
                <i class="bi ${icon}" style="font-size: 4rem;"></i>
                <p class="mt-3">آیا از <strong>${action}</strong> کردن مجوز رزرو اضافه</p>
                <p class="fw-bold text-primary fs-5">"${username}"</p>
                <p class="text-muted small">اطمینان دارید؟</p>
                <p class="text-muted small">
                    کاربر با مجوز رزرو اضافه می‌تواند برای هر روز <strong>یک رزرو اضافه</strong> ثبت کند.
                </p>
            </div>
            `,
            function() {
                fetch("/Alvan/toggle-extra-reservation", {
                    method: "POST",
                    headers: {
                        "X-CSRFToken": getCSRFToken(),
                        "Content-Type": "application/x-www-form-urlencoded",
                    },
                    body: new URLSearchParams({
                        user_id: userId,
                        can_extra: newStatus ? "true" : "false"
                    })
                })
                .then(response => response.json())
                .then(data => {
                    if (data.success) {
                        showMessage(`مجوز رزرو اضافه برای کاربر ${username} با موفقیت ${action} شد.`, "success");
                        fetchUsers();
                    } else {
                        showMessage(data.message || `خطا در ${action} کردن مجوز.`, "danger");
                    }
                })
                .catch(error => {
                    showMessage("خطا در ارتباط با سرور.", "danger");
                });
            }
        );
    }

});