// ============================================================
// Reservation List JS - مدیریت لیست رزروها
// ============================================================

console.log("✅ Reservation List JS loaded");

document.addEventListener("DOMContentLoaded", function() {

    console.log("🚀 Reservation List DOM ready");

    const reservationTableBody = document.getElementById("reservationTableBody");
    const dateFilterForm = document.getElementById("dateFilterForm");
    const filterInputs = document.querySelectorAll(".filter-input");
    const filterYear = document.getElementById("filterYear");
    const filterMonth = document.getElementById("filterMonth");
    const filterFromDate = document.getElementById("filterFromDate");
    const filterToDate = document.getElementById("filterToDate");
    const exportExcelBtn = document.getElementById("exportExcelBtn");
    const clearReservationFilter = document.getElementById("clearReservationFilter");
    const reservationTable = document.getElementById("reservationTable");
    const addReservationForm = document.getElementById("addReservationForm");

    if (!reservationTableBody) {
        console.log("ℹ️ Reservation table not found");
        return;
    }

    // --------------------------------------------
    // ساخت پارامترهای فیلتر
    // --------------------------------------------

    function getReservationFilters() {
        const params = new URLSearchParams();

        filterInputs.forEach(function(input) {
            const value = input.value.trim();
            if (value) {
                params.set(input.name, value);
            }
        });

        if (filterYear && filterYear.value.trim()) {
            params.set("year", filterYear.value.trim());
        }
        if (filterMonth && filterMonth.value) {
            params.set("month", filterMonth.value);
        }
        if (filterFromDate && filterFromDate.value.trim()) {
            params.set("from_date", filterFromDate.value.trim());
        }
        if (filterToDate && filterToDate.value.trim()) {
            params.set("to_date", filterToDate.value.trim());
        }

        return params;
    }

    // --------------------------------------------
    // دریافت AJAX
    // --------------------------------------------

    async function fetchReservations() {
        const params = getReservationFilters();
        const url = `/reservations/Alvan/manage/?${params.toString()}`;

        reservationTableBody.innerHTML = `
            <tr>
                <td colspan="7" class="text-center py-4">
                    <div class="spinner-border text-primary" role="status"></div>
                    <p class="text-muted mt-2 mb-0">در حال دریافت اطلاعات...</p>
                </td>
            </tr>
        `;

        try {
            const response = await fetch(url, {
                method: "GET",
                headers: {
                    "X-Requested-With": "XMLHttpRequest",
                    "Accept": "application/json"
                },
                credentials: "same-origin"
            });

            if (!response.ok) {
                throw new Error(`خطای HTTP ${response.status}`);
            }

            const data = await response.json();

            if (data.success && data.reservation_html) {
                reservationTableBody.innerHTML = data.reservation_html;
            } else {
                reservationTableBody.innerHTML = `
                    <tr>
                        <td colspan="7" class="text-center py-4">
                            <i class="bi bi-inbox display-4 text-muted"></i>
                            <p class="text-muted mt-2">هیچ رزروی یافت نشد.</p>
                        </td>
                    </tr>
                `;
            }

        } catch (error) {
            console.error("❌ Error:", error);
            reservationTableBody.innerHTML = `
                <tr>
                    <td colspan="7" class="text-center py-4 text-danger">
                        <i class="bi bi-exclamation-triangle display-4"></i>
                        <p class="mt-3 mb-1">خطا در دریافت اطلاعات</p>
                    </td>
                </tr>
            `;
        }
    }

    // --------------------------------------------
    // رویدادها
    // --------------------------------------------

    if (dateFilterForm) {
        dateFilterForm.addEventListener("submit", function(event) {
            event.preventDefault();
            fetchReservations();
        });
    }

    let searchTimeout = null;
    filterInputs.forEach(function(input) {
        input.addEventListener("input", function() {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(fetchReservations, 500);
        });
    });

    if (clearReservationFilter) {
        clearReservationFilter.addEventListener("click", function(event) {
            event.preventDefault();
            filterInputs.forEach(function(input) { input.value = ""; });
            if (filterYear) filterYear.value = "";
            if (filterMonth) filterMonth.value = "";
            if (filterFromDate) filterFromDate.value = "";
            if (filterToDate) filterToDate.value = "";
            fetchReservations();
        });
    }

    if (exportExcelBtn) {
        exportExcelBtn.addEventListener("click", function(event) {
            event.preventDefault();
            const params = getReservationFilters();
            params.set("export", "reservation");
            window.location.href = `/reservations/Alvan/manage/?${params.toString()}`;
        });
    }

    // --------------------------------------------
    // حذف رزرو
    // --------------------------------------------

    if (reservationTable) {
        reservationTable.addEventListener("click", function(event) {
            const deleteButton = event.target.closest(".delete-reservation-btn");
            if (!deleteButton) return;

            const reservationId = deleteButton.dataset.reservationId;
            const reservationInfo = deleteButton.dataset.reservationInfo || "";

            if (confirm(`آیا از حذف رزرو "${reservationInfo}" مطمئن هستید؟`)) {
                deleteReservation(reservationId);
            }
        });
    }

    async function deleteReservation(reservationId) {
        try {
            const response = await fetch("/reservations/Alvan/delete/", {
                method: "POST",
                headers: {
                    "X-CSRFToken": getCSRFToken(),
                    "Content-Type": "application/x-www-form-urlencoded",
                    "X-Requested-With": "XMLHttpRequest"
                },
                credentials: "same-origin",
                body: new URLSearchParams({ reservation_id: reservationId })
            });

            const data = await response.json();
            if (data.success) {
                fetchReservations();
            } else {
                alert(data.message || "خطا در حذف رزرو.");
            }
        } catch (error) {
            alert("خطا در ارتباط با سرور.");
        }
    }

    function getCSRFToken() {
        const input = document.querySelector('input[name="csrfmiddlewaretoken"]');
        return input ? input.value : "";
    }

    // --------------------------------------------
    // فرم افزودن رزرو
    // --------------------------------------------

    if (addReservationForm) {
        addReservationForm.addEventListener("submit", function(event) {
            const userSelect = addReservationForm.querySelector('select[name="user_id"]');
            const menuSelect = addReservationForm.querySelector('select[name="menu_id"]');

            if (!userSelect.value || !menuSelect.value) {
                event.preventDefault();
                alert("لطفاً کاربر و غذا را انتخاب کنید.");
            }
        });
    }

    // Select2
    if (typeof $ !== "undefined" && $.fn.select2) {
        $(".user-select").select2({
            placeholder: "جستجوی کاربر...",
            allowClear: true,
            width: "100%",
            dir: "rtl"
        });
    }

    // Datepicker
    if (typeof $ !== "undefined" && $.fn.persianDatepicker) {
        $(".datepicker").persianDatepicker({
            format: "YYYY/MM/DD",
            autoClose: true,
            initialValue: false,
            observer: true,
            persianDigit: false
        });
    }

    console.log("✅ Reservation List ready");
});