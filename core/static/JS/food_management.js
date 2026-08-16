// ============================================================
// Food Management JS
// ============================================================

document.addEventListener("DOMContentLoaded", function() {
    
    const addFoodForm = document.getElementById("addFoodForm");
    const foodNameInput = document.getElementById("manageFoodNameInput");
    const foodImageInput = document.getElementById("manageFoodImageInput");
    
    if (addFoodForm) {

    addFoodForm.addEventListener("submit", function(e) {

        let empty = false;

        if (!foodNameInput || foodNameInput.value.trim() === "") {

            empty = true;

            if (foodNameInput) {
                foodNameInput.classList.add("is-invalid");
            }

        } else {

            foodNameInput.classList.remove("is-invalid");

        }


        if (
            !foodImageInput ||
            !foodImageInput.files ||
            foodImageInput.files.length === 0
        ) {

            empty = true;

            if (foodImageInput) {
                foodImageInput.classList.add("is-invalid");
            }

        } else {

            foodImageInput.classList.remove("is-invalid");

        }


        if (empty) {

            e.preventDefault();

            showMessage(
                "لطفاً تمام فیلدها را پر کنید.",
                "danger"
            );
        }

    });
}
    
    if (foodNameInput) {
        foodNameInput.addEventListener("input", function() {
            if (this.value.trim() !== "") {
                this.classList.remove("is-invalid");
            }
        });
    }
    
    if (foodImageInput) {
        foodImageInput.addEventListener("change", function() {
            if (this.files && this.files.length > 0) {
                this.classList.remove("is-invalid");
            }
        });
    }
    

    const filterInputs = document.querySelectorAll(".filter-input");
    const foodTableBody = document.getElementById("foodTableBody");
    const foodCount = document.getElementById("foodCount");
    
    let timeoutId = null;

    function fetchFoodTable() {
        const params = new URLSearchParams();
        
        filterInputs.forEach(input => {
            const value = input.value.trim();
            if (value) params.append(input.name, value);
        });
        
        if (foodTableBody) {
            foodTableBody.innerHTML = `
                <tr>
                    <td colspan="3" class="text-center py-4">
                        <div class="spinner-border text-success" role="status">
                            <span class="visually-hidden">در حال بارگذاری...</span>
                        </div>
                        <p class="text-muted mt-2">در حال جستجو...</p>
                    </td>
                </tr>
            `;
        }

        fetch(`/menu/Alvan/foods/manage/?${params.toString()}`, {
            headers: {
                'X-Requested-With': 'XMLHttpRequest'
            }
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                if (foodTableBody) {
                    foodTableBody.innerHTML = data.html;
                }
                
                if (foodCount) {
                    foodCount.innerHTML = `تعداد کل غذاها: ${data.total}`;
                }
            }
        })
        .catch(error => {
            console.error('Error:', error);
            if (foodTableBody) {
                foodTableBody.innerHTML = `
                    <tr>
                        <td colspan="3" class="text-center py-4 text-danger">
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
            timeoutId = setTimeout(fetchFoodTable, 400);
        });
    });

    const foodTable = document.getElementById("foodTable");
    
    if (foodTable) {
        foodTable.addEventListener("click", function(e) {
            const target = e.target.closest(".edit-toggle-btn");
            if (target) {
                const foodId = target.dataset.foodId;
                enableEditMode(foodId);
            }
        });
        
        foodTable.addEventListener("click", function(e) {
            const target = e.target.closest(".save-edit-btn");
            if (target) {
                const foodId = target.dataset.foodId;
                saveEditFood(foodId);
            }
        });
        
        foodTable.addEventListener("click", function(e) {
            const target = e.target.closest(".cancel-edit-btn");
            if (target) {
                const foodId = target.dataset.foodId;
                cancelEditMode(foodId);
            }
        });
        
        foodTable.addEventListener("click", function(e) {
            const target = e.target.closest(".delete-food-btn");
            if (target) {
                const foodId = target.dataset.foodId;
                const foodName = target.dataset.foodName;
                handleDeleteFood(foodId, foodName);
            }
        });
    }
    
    function enableEditMode(foodId) {
        const row = document.getElementById(`food-row-${foodId}`);
        if (!row) return;
        row.classList.add('editing');
    }

    function cancelEditMode(foodId) {
        const row = document.getElementById(`food-row-${foodId}`);
        if (!row) return;
        row.classList.remove('editing');
    }

    function saveEditFood(foodId) {
        const row = document.getElementById(`food-row-${foodId}`);
        if (!row) return;
        
        const food_name = row.querySelector('input[name="food_name"]').value.trim();
        const food_image = row.querySelector('input[name="food_image"]').files[0];
        
        if (!food_name) {
            showMessage("لطفاً نام غذا را وارد کنید.", "danger");
            return;
        }
        
        const saveBtn = row.querySelector('.save-edit-btn');
        const originalHtml = saveBtn.innerHTML;
        saveBtn.innerHTML = '<span class="spinner-border spinner-border-sm" role="status"></span>';
        saveBtn.disabled = true;
        
        const formData = new FormData();
        formData.append('food_id', foodId);
        formData.append('food_name', food_name);
        if (food_image) {
            formData.append('food_image', food_image);
        }
        
        fetch("/menu/foods/update/", {
            method: "POST",
            headers: {
                "X-CSRFToken": getCSRFToken(),
            },
            body: formData
        })
        .then(response => response.json())
        .then(data => {
            saveBtn.innerHTML = originalHtml;
            saveBtn.disabled = false;
            
            if (data.success) {
                showMessage("اطلاعات غذا با موفقیت به‌روزرسانی شد.", "success");
                fetchFoodTable();
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

    function handleDeleteFood(foodId, foodName) {
        showConfirmModal(
            `حذف غذا`,
            `
            <div class="text-center">
                <i class="bi bi-exclamation-triangle-fill text-danger" style="font-size: 4rem;"></i>
                <p class="mt-3">آیا از حذف غذا</p>
                <p class="fw-bold text-danger fs-5">"${foodName}"</p>
                <p class="mt-3">مطمئن هستید؟</p>
                <p class="text-muted small">این عمل غیرقابل بازگشت است!</p>
            </div>
            `,
            function() {
                fetch("/menu/foods/delete/", {
                    method: "POST",
                    headers: {
                        "X-CSRFToken": getCSRFToken(),
                        "Content-Type": "application/x-www-form-urlencoded",
                    },
                    body: new URLSearchParams({
                        food_id: foodId
                    })
                })
                .then(response => response.json())
                .then(data => {
                    if (data.success) {
                        showMessage("غذا با موفقیت حذف شد.", "success");
                        fetchFoodTable();
                    } else {
                        showMessage(data.message || "خطا در حذف غذا.", "danger");
                    }
                })
                .catch(error => {
                    showMessage("خطا در ارتباط با سرور.", "danger");
                });
            }
        );
    }

    
    const overlay = document.createElement('div');
    overlay.className = 'modal-image-overlay';
    document.body.appendChild(overlay);
    
    const closeBtn = document.createElement('div');
    closeBtn.className = 'close-image-btn';
    closeBtn.innerHTML = '×';
    document.body.appendChild(closeBtn);
    
    let activeImg = null;
    
    document.addEventListener('click', function(e) {
        const img = e.target.closest('.food-table img');
        if (img && img.closest('.view-mode')) {
            e.preventDefault();
            e.stopPropagation();
            
            if (activeImg) {
                closeImage();
                setTimeout(() => {
                    openImage(img);
                }, 200);
            } else {
                openImage(img);
            }
        }
    });
    
    function openImage(img) {
        activeImg = img;
        img.classList.add('active');
        overlay.classList.add('show');
        closeBtn.classList.add('show');
        document.body.style.overflow = 'hidden';
    }
    
    function closeImage() {
        if (activeImg) {
            activeImg.classList.remove('active');
            activeImg = null;
        }
        overlay.classList.remove('show');
        closeBtn.classList.remove('show');
        document.body.style.overflow = '';
    }
    
    overlay.addEventListener('click', closeImage);
    closeBtn.addEventListener('click', function(e) {
        e.stopPropagation();
        closeImage();
    });
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') closeImage();
    });

});


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

