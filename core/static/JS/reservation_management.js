// ============================================================
// Reservation Management JS - مدیریت جدول رزروها
// ============================================================

document.addEventListener("DOMContentLoaded", function() {
    console.log("✅ Reservation Management JS loaded!");
    
    // ============================================================
    // فعال‌سازی Persian Datepicker برای فیلدهای تاریخ
    // ============================================================
    if (typeof $ !== 'undefined' && $.fn.persianDatepicker) {
        $('.datepicker').persianDatepicker({
            format: 'YYYY/MM/DD',
            autoClose: true,
            initialValue: false,
            observer: true,
            persianDigit: false
        });
    }
    
    // ============================================================
    // ✅ فعال‌سازی Select2 برای انتخاب کاربر
    // ============================================================
    if (typeof $ !== 'undefined' && $.fn.select2) {
        $('.user-select').select2({
            placeholder: 'جستجوی کاربر...',
            allowClear: true,
            width: '100%',
            dir: 'rtl',
            language: {
                noResults: function() {
                    return 'کاربری یافت نشد';
                },
                searching: function() {
                    return 'در حال جستجو...';
                }
            }
        });
    }
    
    // ============================================================
    // اعتبارسنجی فرم افزودن رزرو
    // ============================================================
    const addReservationForm = document.getElementById("addReservationForm");
    const userIdSelect = document.querySelector('select[name="user_id"]');
    const menuIdSelect = document.querySelector('select[name="menu_id"]');

    if (addReservationForm) {
        addReservationForm.addEventListener("submit", function(e) {
            let empty = false;

            if (!userIdSelect || userIdSelect.value === "") {
                empty = true;
                if (userIdSelect) {
                    $(userIdSelect).next('.select2-container').addClass('is-invalid');
                }
            } else {
                if (userIdSelect) {
                    $(userIdSelect).next('.select2-container').removeClass('is-invalid');
                }
            }

            if (!menuIdSelect || menuIdSelect.value === "") {
                empty = true;
                if (menuIdSelect) {
                    menuIdSelect.classList.add("is-invalid");
                }
            } else {
                if (menuIdSelect) {
                    menuIdSelect.classList.remove("is-invalid");
                }
            }

            if (empty) {
                e.preventDefault();
                showMessage("لطفاً تمام فیلدها را پر کنید.", "danger");
            }
        });
    }

    if (userIdSelect) {
        $(userIdSelect).on('change', function() {
            if (this.value !== "") {
                $(this).next('.select2-container').removeClass('is-invalid');
            }
        });
    }

    if (menuIdSelect) {
        menuIdSelect.addEventListener("change", function() {
            if (this.value !== "") {
                this.classList.remove("is-invalid");
            }
        });
    }

    // ============================================================
    // فیلترهای AJAX
    // ============================================================
    const filterInputs = document.querySelectorAll(".filter-input");
    const reservationTableBody = document.getElementById("reservationTableBody");
    const dateFilterForm = document.getElementById("dateFilterForm");
    
    let timeoutId = null;

    function fetchReservations() {
        const params = new URLSearchParams();
        
        filterInputs.forEach(input => {
            const value = input.value.trim();
            if (value) params.append(input.name, value);
        });
        
        const fromDate = document.getElementById("filterFromDate");
        const toDate = document.getElementById("filterToDate");
        
        if (fromDate && fromDate.value.trim()) {
            params.append('from_date', fromDate.value.trim());
        }
        if (toDate && toDate.value.trim()) {
            params.append('to_date', toDate.value.trim());
        }
        
        const filterYear = document.getElementById("filterYear");
        const filterMonth = document.getElementById("filterMonth");
        
        if (filterYear && filterYear.value) {
            params.append('year', filterYear.value);
        }
        if (filterMonth && filterMonth.value) {
            params.append('month', filterMonth.value);
        }
        
        if (reservationTableBody) {
            reservationTableBody.innerHTML = `
                <tr>
                    <td colspan="7" class="text-center py-4">
                        <div class="spinner-border text-success" role="status">
                            <span class="visually-hidden">در حال بارگذاری...</span>
                        </div>
                        <p class="text-muted mt-2">در حال جستجو...</p>
                    </td>
                </tr>
            `;
        }

        fetch(`/reservations/Alvan/manage/?${params.toString()}`, {
            headers: {
                'X-Requested-With': 'XMLHttpRequest'
            }
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                if (reservationTableBody) {
                    reservationTableBody.innerHTML = data.html;
                }
            }
        })
        .catch(error => {
            console.error('Error:', error);
            if (reservationTableBody) {
                reservationTableBody.innerHTML = `
                    <tr>
                        <td colspan="7" class="text-center py-4 text-danger">
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
            console.log(`🔍 Input changed: ${this.name} = "${this.value}"`);
            clearTimeout(timeoutId);
            timeoutId = setTimeout(fetchReservations, 400);
        });
    });

    if (dateFilterForm) {
        dateFilterForm.addEventListener("submit", function(e) {
            e.preventDefault();
            fetchReservations();
        });
    }

    // ============================================================
    // دکمه خروجی اکسل - جمع‌آوری تمام فیلترها
    // ============================================================
    document.getElementById("exportExcelBtn").addEventListener("click", function(e) {
        e.preventDefault();
        
        const params = new URLSearchParams();
        
        // 1. جمع‌آوری فیلترهای داخل جدول (first_name, last_name, national_code, food_name)
        document.querySelectorAll('.filter-input').forEach(input => {
            const value = input.value.trim();
            if (value) {
                params.append(input.name, value);
            }
        });
        
        // 2. جمع‌آوری فیلترهای فرم (سال، ماه، از تاریخ، تا تاریخ)
        const form = document.getElementById("dateFilterForm");
        if (form) {
            const formData = new FormData(form);
            for (let [key, value] of formData.entries()) {
                if (value.trim() !== "") {
                    params.append(key, value.trim());
                }
            }
        }
        
        // 3. اضافه کردن پارامتر export
        params.append('export', 'excel');
        
        // 4. هدایت به آدرس با پارامترها
        window.location.href = `/reservations/Alvan/manage/?${params.toString()}`;
    });
    // ============================================================
    // دکمه حذف
    // ============================================================
    const reservationTable = document.getElementById("reservationTable");
    
    if (reservationTable) {
        reservationTable.addEventListener("click", function(e) {
            const target = e.target.closest(".delete-reservation-btn");
            if (target) {
                const reservationId = target.dataset.reservationId;
                const reservationInfo = target.dataset.reservationInfo;
                handleDeleteReservation(reservationId, reservationInfo);
            }
        });
    }

    function handleDeleteReservation(reservationId, reservationInfo) {
        showConfirmModal(
            `حذف رزرو`,
            `
            <div class="text-center">
                <i class="bi bi-exclamation-triangle-fill text-danger" style="font-size: 4rem;"></i>
                <p class="mt-3">آیا از حذف رزرو</p>
                <p class="fw-bold text-danger fs-5">"${reservationInfo}"</p>
                <p class="mt-3">مطمئن هستید؟</p>
                <p class="text-muted small">این عمل غیرقابل بازگشت است!</p>
            </div>
            `,
            function() {
                fetch("/reservations/Alvan/delete/", {
                    method: "POST",
                    headers: {
                        "X-CSRFToken": getCSRFToken(),
                        "Content-Type": "application/x-www-form-urlencoded",
                    },
                    body: new URLSearchParams({
                        reservation_id: reservationId
                    })
                })
                .then(response => response.json())
                .then(data => {
                    if (data.success) {
                        showMessage("رزرو با موفقیت حذف شد.", "success");
                        fetchReservations();
                    } else {
                        showMessage(data.message || "خطا در حذف رزرو.", "danger");
                    }
                })
                .catch(error => {
                    showMessage("خطا در ارتباط با سرور.", "danger");
                });
            }
        );
    }

    console.log("✅ Reservation Management initialized!");
});

// ============================================================
// توابع کمکی
// ============================================================
function getCSRFToken() {
    const tokenElement = document.getElementById("csrf-token");
    return tokenElement ? tokenElement.value : null;
}

function showMessage(message, type = "info") {
    const existingAlerts = document.querySelectorAll(".alert.position-fixed");
    existingAlerts.forEach(alert => alert.remove());

    const alertBox = document.createElement("div");
    alertBox.className = `alert alert-${type} position-fixed top-0 start-50 translate-middle-x mt-3 shadow`;
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
// گزارش تعداد رزرو کاربران
// ============================================================

// بارگذاری اولیه گزارش
function loadReport(year, month) {
    const reportBody = document.getElementById("reportTableBody");
    
    reportBody.innerHTML = `
        <tr>
            <td colspan="5" class="text-center py-4">
                <div class="spinner-border text-primary" role="status">
                    <span class="visually-hidden">در حال بارگذاری...</span>
                </div>
                <p class="text-muted mt-2">در حال دریافت گزارش...</p>
            </td>
        </tr>
    `;

    fetch(`/reservations/Alvan/report/?year=${year}&month=${month}`, {
        headers: {
            'X-Requested-With': 'XMLHttpRequest'
        }
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            let html = '';
            data.data.forEach((item, index) => {
                html += `
                    <tr>
                        <td>${index + 1}</td>
                        <td>${item.first_name}</td>
                        <td>${item.last_name}</td>
                        <td>${item.national_code}</td>
                        <td>
                            <span class="badge bg-primary">${item.reservation_count}</span>
                        </td>
                    </tr>
                `;
            });
            reportBody.innerHTML = html;
        } else {
            reportBody.innerHTML = `
                <tr>
                    <td colspan="5" class="text-center py-4 text-danger">
                        <i class="bi bi-exclamation-triangle display-4"></i>
                        <p class="mt-2">${data.message || 'خطا در دریافت گزارش'}</p>
                    </td>
                </tr>
            `;
        }
    })
    .catch(error => {
        console.error('Error:', error);
        reportBody.innerHTML = `
            <tr>
                <td colspan="5" class="text-center py-4 text-danger">
                    <i class="bi bi-exclamation-triangle display-4"></i>
                    <p class="mt-2">خطا در ارتباط با سرور</p>
                </td>
            </tr>
        `;
    });
}

// رویدادهای گزارش
document.addEventListener("DOMContentLoaded", function() {
    // ... کدهای قبلی ...
    
    // ============================================================
    // گزارش تعداد رزرو
    // ============================================================
    const reportYear = document.getElementById("reportYear");
    const reportMonth = document.getElementById("reportMonth");
    const generateReportBtn = document.getElementById("generateReportBtn");
    const exportReportExcelBtn = document.getElementById("exportReportExcelBtn");

    // بارگذاری اولیه با ماه جاری
    loadReport(reportYear.value, reportMonth.value);

    // دکمه نمایش گزارش
    if (generateReportBtn) {
        generateReportBtn.addEventListener("click", function() {
            loadReport(reportYear.value, reportMonth.value);
        });
    }

    // دکمه خروجی اکسل گزارش
    if (exportReportExcelBtn) {
        exportReportExcelBtn.addEventListener("click", function() {
            const year = reportYear.value;
            const month = reportMonth.value;
            window.location.href = `/reservations/Alvan/report-excel/?year=${year}&month=${month}`;
        });
    }

    // فعال‌سازی Enter در فیلد سال
    if (reportYear) {
        reportYear.addEventListener("keypress", function(e) {
            if (e.key === "Enter") {
                loadReport(reportYear.value, reportMonth.value);
            }
        });
    }
});