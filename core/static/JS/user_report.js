// ============================================================
// User Report JS - گزارش کاربران (صفحه جداگانه)
// ============================================================

document.addEventListener("DOMContentLoaded", function() {

    console.log("🚀 User Report DOM ready");

    const reportTableBody = document.getElementById("reportTableBody");
    const reportFilterForm = document.getElementById("userReportFilterForm");
    const reportYear = document.getElementById("userReportYear");
    const reportMonth = document.getElementById("userReportMonth");
    const reportFromDate = document.getElementById("userReportFromDate");
    const reportToDate = document.getElementById("userReportToDate");
    const exportReportExcel = document.getElementById("exportReportExcel");
    const clearReportFilter = document.getElementById("clearReportFilter");

    if (!reportTableBody) {
        console.log("ℹ️ Report table not found");
        return;
    }

    // --------------------------------------------
    // ساخت پارامترهای فیلتر
    // --------------------------------------------

    function getReportFilters() {
        const params = new URLSearchParams();

        if (reportYear && reportYear.value.trim()) {
            params.set("year", reportYear.value.trim());
        }
        if (reportMonth && reportMonth.value) {
            params.set("month", reportMonth.value);
        }
        if (reportFromDate && reportFromDate.value.trim()) {
            params.set("from_date", reportFromDate.value.trim());
        }
        if (reportToDate && reportToDate.value.trim()) {
            params.set("to_date", reportToDate.value.trim());
        }

        document.querySelectorAll(".report-filter-input").forEach(function(input) {
            const value = input.value.trim();
            if (value) {
                params.set(input.name, value);
            }
        });

        return params;
    }

    // --------------------------------------------
    // دریافت AJAX گزارش
    // --------------------------------------------

    async function fetchUserReport() {
        const year = reportYear ? reportYear.value.trim() : "";
        const month = reportMonth ? reportMonth.value : "";

        if (!year && !month) {
            reportTableBody.innerHTML = `
                <tr>
                    <td colspan="9" class="text-center py-4">
                        <i class="bi bi-inbox display-4 text-muted"></i>
                        <p class="text-muted mt-2">برای مشاهده گزارش، سال و ماه را انتخاب کنید.</p>
                    </td>
                </tr>
            `;
            return;
        }

        const params = getReportFilters();
        console.log("📤 FILTER PARAMS:", params.toString());
        const url = `/reservations/Alvan/user-report/?${params.toString()}`;

        reportTableBody.innerHTML = `
            <tr>
                <td colspan="9" class="text-center py-4">
                    <div class="spinner-border text-primary" role="status"></div>
                    <p class="text-muted mt-2 mb-0">در حال دریافت گزارش...</p>
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

            if (data.success && data.html) {
                reportTableBody.innerHTML = data.html;
                console.log("✅ Report updated successfully");
            } else {
                reportTableBody.innerHTML = `
                    <tr>
                        <td colspan="9" class="text-center py-4">
                            <i class="bi bi-inbox display-4 text-muted"></i>
                            <p class="text-muted mt-2">داده‌ای یافت نشد.</p>
                        </td>
                    </tr>
                `;
            }

        } catch (error) {
            console.error("❌ Error:", error);
            reportTableBody.innerHTML = `
                <tr>
                    <td colspan="9" class="text-center py-4 text-danger">
                        <i class="bi bi-exclamation-triangle display-4"></i>
                        <p class="mt-3 mb-1">خطا در دریافت گزارش</p>
                    </td>
                </tr>
            `;
        }
    }

    // --------------------------------------------
    // رویدادها
    // --------------------------------------------

    // Submit فرم
    if (reportFilterForm) {
        reportFilterForm.addEventListener("submit", function(event) {
            event.preventDefault();
            fetchUserReport();
        });
    }

    // تغییر سال - بارگذاری خودکار
    if (reportYear) {
        reportYear.addEventListener("change", function() {
            if (reportYear.value.trim() && reportMonth && reportMonth.value) {
                fetchUserReport();
            }
        });
    }

    // تغییر ماه - بارگذاری خودکار
    if (reportMonth) {
        reportMonth.addEventListener("change", function() {
            console.log("🟢 MONTH CHANGED:", reportMonth.value);
            if (reportMonth.value && reportYear && reportYear.value.trim()) {
                fetchUserReport();
            }
        });
    }

    // فیلتر لحظه‌ای متنی
    let searchTimeout = null;
    document.querySelectorAll(".report-filter-input").forEach(function(input) {
        input.addEventListener("input", function() {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(fetchUserReport, 500);
        });
    });

    // حذف فیلتر
    if (clearReportFilter) {
        clearReportFilter.addEventListener("click", function(event) {
            event.preventDefault();
            if (reportYear) reportYear.value = "";
            if (reportMonth) reportMonth.value = "";
            if (reportFromDate) reportFromDate.value = "";
            if (reportToDate) reportToDate.value = "";
            document.querySelectorAll(".report-filter-input").forEach(function(input) {
                input.value = "";
            });
            
            // بعد از پاک کردن، پیام اولیه را نشان بده
            reportTableBody.innerHTML = `
                <tr>
                    <td colspan="9" class="text-center py-4">
                        <i class="bi bi-inbox display-4 text-muted"></i>
                        <p class="text-muted mt-2">برای مشاهده گزارش، سال و ماه را انتخاب کنید.</p>
                    </td>
                </tr>
            `;
        });
    }

    // خروجی Excel
    if (exportReportExcel) {
        exportReportExcel.addEventListener("click", function(event) {
            event.preventDefault();
            const params = getReportFilters();
            params.set("export", "excel");
            window.location.href = `/reservations/Alvan/user-report/?${params.toString()}`;
        });
    }

    // --------------------------------------------
    // Datepicker
    // --------------------------------------------

    if (typeof $ !== "undefined" && $.fn.persianDatepicker) {
        $(".datepicker").persianDatepicker({
            format: "YYYY/MM/DD",
            autoClose: true,
            initialValue: false,
            observer: true,
            persianDigit: false
        });
    }

    // --------------------------------------------
    // بارگذاری اولیه گزارش
    // --------------------------------------------

    // اگر سال و ماه مقدار دارند (که در ویو مقداردهی شده‌اند)، گزارش را بارگذاری کن
    if (reportYear && reportYear.value.trim() && reportMonth && reportMonth.value) {
        console.log("📅 Loading initial report for:", reportYear.value, reportMonth.value);
        // با تاخیر کوتاه برای اطمینان از آماده بودن DOM
        setTimeout(fetchUserReport, 300);
    }

    console.log("✅ User Report ready");
});