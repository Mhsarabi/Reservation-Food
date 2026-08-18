// ============================================================
// User Management JS 
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
// show message
// ============================================================
function showMessage(message, type = "info") {
    const existingAlerts = document.querySelectorAll(".alert.position-fixed");
    existingAlerts.forEach(alert => alert.remove());

    const alertBox = document.createElement("div");
    alertBox.className =
        `alert alert-${type} position-fixed top-0 start-50 translate-middle-x mt-3 shadow`;
    alertBox.style.zIndex = "9999";
    alertBox.style.minWidth = "350px";
    alertBox.style.textAlign = "center";
    alertBox.style.maxWidth = "90%";
    alertBox.style.fontSize = "1rem";
    alertBox.innerHTML = message;

    document.body.appendChild(alertBox);

    setTimeout(() => {
        if (alertBox.parentNode) {
            alertBox.remove();
        }
    }, 4000);
}

// ============================================================
// DOMContentLoaded 
// ============================================================
document.addEventListener("DOMContentLoaded", function() {
    


    const addButton = document.querySelector(".new-user button");
    const addInputs = document.querySelectorAll(".new-user input");
    const addSiteSelect = document.querySelector(".new-user select[name='site']");
    const addDepartmentSelect = document.querySelector(".new-user select[name='department']");

    if (addButton) {
        addButton.addEventListener("click", function(e) {
            let hasError = false;

            addInputs.forEach(input => {
                if (input.value.trim() === "") {
                    hasError = true;
                    input.classList.add("is-invalid");
                } else {
                    input.classList.remove("is-invalid");
                }
            });

            if (addSiteSelect) {
                if (addSiteSelect.value.trim() === "") {
                    hasError = true;
                    addSiteSelect.classList.add("is-invalid");
                } else {
                    addSiteSelect.classList.remove("is-invalid");
                }
            }

            if (addDepartmentSelect) {
                if (addDepartmentSelect.value.trim() === "") {
                    hasError = true;
                    addDepartmentSelect.classList.add("is-invalid");
                } else {
                    addDepartmentSelect.classList.remove("is-invalid");
                }
            }

            if (hasError) {
                e.preventDefault();
                showMessage("❌ لطفاً تمام اطلاعات کاربر را وارد کنید.", "danger");
            }
        });
    }

    addInputs.forEach(input => {
        input.addEventListener("input", function() {
            if (this.value.trim() !== "") {
                this.classList.remove("is-invalid");
            }
        });
    });

    if (addSiteSelect) {
        addSiteSelect.addEventListener("change", function() {
            if (this.value.trim() !== "") {
                this.classList.remove("is-invalid");
            }
        });
    }

    if (addDepartmentSelect) {
        addDepartmentSelect.addEventListener("change", function() {
            if (this.value.trim() !== "") {
                this.classList.remove("is-invalid");
            }
        });
    }

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
                    <td colspan="11" class="text-center py-4">
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
                        <td colspan="11" class="text-center py-4 text-danger">
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
    }


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
                        showMessage(`✅ حساب کاربری با موفقیت ${action} شد.`, "success");
                        fetchUsers();
                    } else {
                        showMessage(`❌ ${data.message || 'خطا در تغییر وضعیت کاربر.'}`, "danger");
                    }
                })
                .catch(error => {
                    showMessage("❌ خطا در ارتباط با سرور.", "danger");
                });
            }
        );
    }


    function enableEditMode(userId) {
        const row = document.getElementById(`user-row-${userId}`);
        if (!row) return;
        
        row.querySelectorAll('.view-mode').forEach(el => el.style.display = 'none');
        row.querySelectorAll('.edit-mode').forEach(el => el.style.display = '');
        
        const saveBtn = row.querySelector('.save-edit-btn');
        const cancelBtn = row.querySelector('.cancel-edit-btn');
        const editBtn = row.querySelector('.edit-toggle-btn');
        
        if (saveBtn) saveBtn.style.display = '';
        if (cancelBtn) cancelBtn.style.display = '';
        if (editBtn) editBtn.style.display = 'none';
        
        row.classList.add('editing');
    }

    function cancelEditMode(userId) {
        const row = document.getElementById(`user-row-${userId}`);
        if (!row) return;
        
        row.querySelectorAll('.view-mode').forEach(el => el.style.display = '');
        row.querySelectorAll('.edit-mode').forEach(el => el.style.display = 'none');
        
        const saveBtn = row.querySelector('.save-edit-btn');
        const cancelBtn = row.querySelector('.cancel-edit-btn');
        const editBtn = row.querySelector('.edit-toggle-btn');
        
        if (saveBtn) saveBtn.style.display = 'none';
        if (cancelBtn) cancelBtn.style.display = 'none';
        if (editBtn) editBtn.style.display = '';
        
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
        const extraInput = row.querySelector('input[name="extra_reservation_limit"]');
        let extra_reservation_limit = 0;
        

        if (!first_name) {
            showMessage("❌ لطفاً نام را وارد کنید.", "danger");
            row.querySelector('input[name="first_name"]').focus();
            return;
        }
        

        if (!last_name) {
            showMessage("❌ لطفاً نام خانوادگی را وارد کنید.", "danger");
            row.querySelector('input[name="last_name"]').focus();
            return;
        }
        
        if (!national_code) {
            showMessage("❌ لطفاً کد ملی را وارد کنید.", "danger");
            row.querySelector('input[name="national_code"]').focus();
            return;
        }
        
        if (national_code.length !== 10 || !/^\d+$/.test(national_code)) {
            showMessage("❌ کد ملی باید 10 رقم باشد.", "danger");
            row.querySelector('input[name="national_code"]').focus();
            return;
        }
        

        if (!personnel_code) {
            showMessage("❌ لطفاً کد پرسنلی را وارد کنید.", "danger");
            row.querySelector('input[name="personnel_code"]').focus();
            return;
        }
        

        if (!username) {
            showMessage("❌ لطفاً نام کاربری را وارد کنید.", "danger");
            row.querySelector('input[name="username"]').focus();
            return;
        }
        

        if (!site) {
            showMessage("❌ لطفاً سایت را انتخاب کنید.", "danger");
            row.querySelector('select[name="site"]').focus();
            return;
        }
        

        if (!department) {
            showMessage("❌ لطفاً واحد را انتخاب کنید.", "danger");
            row.querySelector('select[name="department"]').focus();
            return;
        }
        

        if (extraInput) {
            const extraValue = extraInput.value.trim();
            
            if (extraValue === '') {
                showMessage("❌ لطفاً تعداد رزرو اضافه را وارد کنید.", "danger");
                extraInput.focus();
                extraInput.select();
                return;
            }
            
            const numValue = Number(extraValue);
            if (isNaN(numValue)) {
                showMessage("❌ تعداد رزرو اضافه باید یک عدد باشد.", "danger");
                extraInput.focus();
                extraInput.select();
                return;
            }
            
            if (numValue < 0) {
                showMessage("❌ تعداد رزرو اضافه نمی‌تواند کمتر از صفر باشد.", "danger");
                extraInput.focus();
                extraInput.select();
                return;
            }
            
            if (!Number.isInteger(numValue)) {
                showMessage("❌ تعداد رزرو اضافه باید یک عدد صحیح باشد.", "danger");
                extraInput.focus();
                extraInput.select();
                return;
            }
            
            extra_reservation_limit = numValue;
        }

        const saveBtn = row.querySelector('.save-edit-btn');
        const originalHtml = saveBtn.innerHTML;
        saveBtn.innerHTML = '<span class="spinner-border spinner-border-sm" role="status"></span>';
        saveBtn.disabled = true;
        
        const formData = new URLSearchParams();
        formData.append('user_id', userId);
        formData.append('first_name', first_name);
        formData.append('last_name', last_name);
        formData.append('national_code', national_code);
        formData.append('personnel_code', personnel_code);
        formData.append('username', username);
        formData.append('site', site);
        formData.append('department', department);
        formData.append('is_active', status === "active" ? "true" : "false");
        formData.append('extra_reservation_limit', extra_reservation_limit);
        
        fetch("/Alvan/edit/user", {
            method: "POST",
            headers: {
                "X-CSRFToken": getCSRFToken(),
                "Content-Type": "application/x-www-form-urlencoded",
            },
            body: formData
        })
        .then(response => response.json())
        .then(data => {
            saveBtn.innerHTML = originalHtml;
            saveBtn.disabled = false;
            
            if (data.success) {
                showMessage("✅ اطلاعات کاربر با موفقیت به‌روزرسانی شد.", "success");
                fetchUsers();
            } else {
                showMessage(`❌ ${data.message || 'خطا در به‌روزرسانی اطلاعات.'}`, "danger");
            }
        })
        .catch(error => {
            saveBtn.innerHTML = originalHtml;
            saveBtn.disabled = false;
            showMessage("❌ خطا در ارتباط با سرور.", "danger");
        });
    }

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
                <p class="text-muted small">⚠️ این عمل غیرقابل بازگشت است!</p>
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
                        showMessage("✅ کاربر با موفقیت حذف شد.", "success");
                        fetchUsers();
                    } else {
                        showMessage(`❌ ${data.message || 'خطا در حذف کاربر.'}`, "danger");
                    }
                })
                .catch(error => {
                    showMessage("❌ خطا در ارتباط با سرور.", "danger");
                });
            }
        );
    }


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


    const saveResetPassword = document.getElementById("saveResetPassword");

    if (saveResetPassword) {
        saveResetPassword.addEventListener("click", function() {
            const userId = document.getElementById("resetUserId").value;
            const newPassword = document.getElementById("newUserPassword").value;

            if (newPassword.trim() === "") {
                showMessage("❌ لطفاً رمز جدید را وارد کنید.", "danger");
                return;
            }

            if (newPassword.length < 8) {
                showMessage("❌ رمز عبور باید حداقل 8 کاراکتر باشد.", "danger");
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
                    showMessage("✅ رمز عبور با موفقیت تغییر کرد.", "success");
                    const modalElement = document.getElementById("resetPasswordModal");
                    if (modalElement) {
                        const modal = bootstrap.Modal.getInstance(modalElement);
                        if (modal) modal.hide();
                    }
                    document.getElementById("newUserPassword").value = "";
                } else {
                    showMessage(`❌ ${data.message || 'خطا در تغییر رمز عبور.'}`, "danger");
                }
            })
            .catch(error => {
                showMessage("❌ خطا در ارتباط با سرور.", "danger");
            });
        });
    }


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
                showMessage("❌ خطا در باز کردن مودال وارد کردن کاربران.", "danger");
            }
        });
    }

});