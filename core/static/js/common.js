// ============================================================
// Common Functions 
// ============================================================

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
// Image URL
// --------------------------------------------

function getImageUrl(imagePath) {
    if (!imagePath || imagePath === '') {
        return '/static/images/no-food.png';
    }

    if (
        imagePath.startsWith('http://') ||
        imagePath.startsWith('https://')
    ) {
        return imagePath;
    }

    if (imagePath.startsWith('/media/')) {
        return imagePath;
    }

    if (imagePath.startsWith('media/')) {
        return '/' + imagePath;
    }

    if (imagePath.includes('foods/')) {
        return '/media/' + imagePath;
    }

    return '/static/images/no-food.png';
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


function fetchFoods() {
    return fetch('/menu/foods/list/', {
        method: 'GET',
        headers: {
            'X-Requested-With': 'XMLHttpRequest',
        },
    })
    .then(response => {
        if (!response.ok) {
            throw new Error(`خطا در دریافت غذاها: ${response.status}`);
        }

        return response.json();
    })
    .then(data => {
        if (!data.success) {
            throw new Error('دریافت غذاها با خطا مواجه شد.');
        }

        window.foods = data.foods || [];

        return window.foods;
    });
}

function updateAllFoodSelects() {
    const selectIds = ['foodSelect', 'editFoodSelect'];

    selectIds.forEach(selectId => {
        const select = document.getElementById(selectId);

        if (!select) return;

        const currentValue = select.value;

        select.innerHTML = '<option value="">انتخاب غذا...</option>';

        window.foods.forEach(food => {
            const option = document.createElement('option');

            option.value = food.id;
            option.textContent = food.name;

            select.appendChild(option);
        });

        if (
            currentValue &&
            window.foods.some(food => food.id == currentValue)
        ) {
            select.value = currentValue;
        }
    });
}