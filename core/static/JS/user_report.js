// ============================================================
// User Report JS
// ============================================================

document.addEventListener("DOMContentLoaded", function() {

    const reportTableBody = document.getElementById("reportTableBody");
    const reportFilterForm = document.getElementById("userReportFilterForm");
    const reportYear = document.getElementById("userReportYear");
    const reportMonth = document.getElementById("userReportMonth");
    const reportFromDate = document.getElementById("userReportFromDate");
    const reportToDate = document.getElementById("userReportToDate");
    const exportReportExcel = document.getElementById("exportReportExcel");
    const clearReportFilter = document.getElementById("clearReportFilter");

    // --------------------------------------------
    // Get filter parameters
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

        document.querySelectorAll(".report-filter-select").forEach(function(select) {
            const value = select.value.trim();
            if (value) {
                params.set(select.name, value);
            }
        });

        return params;
    }

    // --------------------------------------------
    // Fetch report via AJAX
    // --------------------------------------------

    async function fetchUserReport() {
        const year = reportYear ? reportYear.value.trim() : "";
        const month = reportMonth ? reportMonth.value : "";

        if (!year && !month) {
            reportTableBody.innerHTML = `
                <tr>
                    <td colspan="8" class="text-center py-4">
                        <i class="bi bi-inbox display-4 text-muted"></i>
                        <p class="text-muted mt-2">برای مشاهده گزارش، سال و ماه را انتخاب کنید.</p>
                    </td>
                </tr>
            `;
            return;
        }

        const params = getReportFilters();
        const url = `/reservations/Alvan/user-report/?${params.toString()}`;

        reportTableBody.innerHTML = `
            <tr>
                <td colspan="8" class="text-center py-4">
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
                throw new Error(`HTTP Error: ${response.status}`);
            }

            const data = await response.json();

            if (data.success && data.html) {
                reportTableBody.innerHTML = data.html;
            } else {
                reportTableBody.innerHTML = `
                    <tr>
                        <td colspan="8" class="text-center py-4">
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
                    <td colspan="8" class="text-center py-4 text-danger">
                        <i class="bi bi-exclamation-triangle display-4"></i>
                        <p class="mt-3 mb-1">خطا در دریافت گزارش</p>
                    </td>
                </tr>
            `;
        }
    }

    // --------------------------------------------
    // Download Excel without page refresh
    // --------------------------------------------

    async function downloadExcel() {
        const params = getReportFilters();
        params.set("export", "excel");
        const url = `/reservations/Alvan/user-report/?${params.toString()}`;

        if (exportReportExcel) {
            exportReportExcel.disabled = true;
            exportReportExcel.innerHTML = '<span class="spinner-border spinner-border-sm"></span>';
        }

        try {
            const response = await fetch(url, {
                method: "GET",
                headers: {
                    "X-Requested-With": "XMLHttpRequest"
                },
                credentials: "same-origin"
            });

            if (!response.ok) {
                throw new Error(`Error: ${response.status}`);
            }

            const contentDisposition = response.headers.get('Content-Disposition');
            let filename = 'گزارش.xlsx';

            if (contentDisposition) {
                const utf8Match = contentDisposition.match(/filename\*=UTF-8''([^;]+)/i);
                if (utf8Match && utf8Match[1]) {
                    try {
                        filename = decodeURIComponent(utf8Match[1]);
                    } catch (e) {
                        filename = utf8Match[1];
                    }
                } else {
                    const match = contentDisposition.match(/filename="([^"]+)"/);
                    if (match && match[1]) {
                        let raw = match[1];
                        if (raw.includes('%')) {
                            try {
                                filename = decodeURIComponent(raw);
                            } catch (e) {
                                filename = raw;
                            }
                        } else {
                            filename = raw;
                        }
                    }
                }
            }

            const blob = await response.blob();
            const urlBlob = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = urlBlob;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(urlBlob);

        } catch (error) {
            console.error('❌ Excel download error:', error);
            alert('خطا در دانلود فایل اکسل. لطفاً مجدداً تلاش کنید.');
        } finally {
            // Restore button state
            if (exportReportExcel) {
                exportReportExcel.disabled = false;
                exportReportExcel.innerHTML = '<i class="bi bi-file-earmark-excel me-1"></i> اکسل';
            }
        }
    }

    // --------------------------------------------
    // Event listeners
    // --------------------------------------------

    if (reportFilterForm) {
        reportFilterForm.addEventListener("submit", function(event) {
            event.preventDefault();
            fetchUserReport();
        });
    }

    if (reportYear) {
        reportYear.addEventListener("change", function() {
            if (reportYear.value.trim() && reportMonth && reportMonth.value) {
                fetchUserReport();
            }
        });
    }

    if (reportMonth) {
        reportMonth.addEventListener("change", function() {
            if (reportMonth.value && reportYear && reportYear.value.trim()) {
                fetchUserReport();
            }
        });
    }

    let searchTimeout = null;
    document.querySelectorAll(".report-filter-input").forEach(function(input) {
        input.addEventListener("input", function() {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(fetchUserReport, 500);
        });
    });

    document.querySelectorAll(".report-filter-select").forEach(function(select) {
        select.addEventListener("change", function() {
            fetchUserReport();
        });
    });

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

            document.querySelectorAll(".report-filter-select").forEach(function(select) {
                select.value = "";
            });

            reportTableBody.innerHTML = `
                <tr>
                    <td colspan="8" class="text-center py-4">
                        <i class="bi bi-inbox display-4 text-muted"></i>
                        <p class="text-muted mt-2">برای مشاهده گزارش، سال و ماه را انتخاب کنید.</p>
                    </td>
                </tr>
            `;
        });
    }

    if (exportReportExcel) {
        exportReportExcel.addEventListener("click", function(event) {
            event.preventDefault();
            downloadExcel();
        });
    }

    // --------------------------------------------
    // Persian Datepicker initialization
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
    // Initial load - auto fetch if year and month have values
    // --------------------------------------------

    if (reportYear && reportYear.value.trim() && reportMonth && reportMonth.value) {
        setTimeout(fetchUserReport, 300);
    }

    console.log("✅ User Report ready");
});