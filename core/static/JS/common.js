// ============================================================
// Common Functions - توابع مشترک بین همه بخش‌ها
// ============================================================

console.log("✅ Common JS loaded");

// --------------------------------------------
// CSRF Token
// --------------------------------------------

function getCSRFToken() {
    const csrfInput = document.querySelector('input[name="csrfmiddlewaretoken"]');
    if (csrfInput) {
        return csrfInput.value;
    }

    const cookie = document.cookie.split("; ").find(function(row) {
        return row.startsWith("csrftoken=");
    });

    if (!cookie) {
        return "";
    }

    return decodeURIComponent(cookie.split("=")[1]);
}

// --------------------------------------------
// نمایش پیام
// --------------------------------------------

function showMessage(message, type = "info") {
    document.querySelectorAll(".custom-floating-alert").forEach(function(element) {
        element.remove();
    });

    const alertBox = document.createElement("div");
    alertBox.className = `alert alert-${type} custom-floating-alert position-fixed top-0 start-50 translate-middle-x mt-3 shadow`;
    alertBox.style.zIndex = "9999";
    alertBox.style.minWidth = "300px";
    alertBox.style.textAlign = "center";
    alertBox.innerHTML = message;

    document.body.appendChild(alertBox);

    setTimeout(function() {
        if (alertBox.parentNode) {
            alertBox.remove();
        }
    }, 3000);
}

// --------------------------------------------
// Modal تأیید
// --------------------------------------------

function showConfirmModal(title, bodyHTML, onConfirm) {
    const oldModal = document.getElementById("customConfirmModal");
    if (oldModal) {
        oldModal.remove();
    }

    const html = `
        <div class="modal fade" id="customConfirmModal" tabindex="-1">
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
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">
                            انصراف
                        </button>
                        <button type="button" class="btn btn-danger" id="confirmAction">
                            تأیید
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;

    document.body.insertAdjacentHTML("beforeend", html);

    const modalElement = document.getElementById("customConfirmModal");
    const modal = new bootstrap.Modal(modalElement);
    modal.show();

    const confirmButton = document.getElementById("confirmAction");
    if (confirmButton) {
        confirmButton.addEventListener("click", function() {
            modal.hide();
            if (typeof onConfirm === "function") {
                onConfirm();
            }
        });
    }

    modalElement.addEventListener("hidden.bs.modal", function() {
        modalElement.remove();
    });
}