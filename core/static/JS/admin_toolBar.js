// ============================================================
// Admin ToolBar JS - مدیریت هدر، مودال‌ها و گزارش‌گیری
// ============================================================

// ===========================
// متغیرهای سراسری
// ===========================
let foods = [];

// ===========================
// دریافت CSRF Token
// ===========================
function getCSRFToken() {
    const tokenElement = document.getElementById("csrf-token");
    return tokenElement ? tokenElement.value : null;
}

// ===========================
// تابع کمکی: ساخت URL تصویر
// ===========================
function getImageUrl(imagePath) {
    if (!imagePath || imagePath === '') {
        return '/static/images/no-food.png';
    }
    
    if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
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

// ===========================
// نمایش پیام در مودال
// ===========================
function showFoodMessage(message, type = 'success') {
    const messageDiv = document.getElementById('foodMessage');
    if (!messageDiv) return;
    
    messageDiv.textContent = message;
    messageDiv.className = `alert alert-${type}`;
    messageDiv.classList.remove('d-none');
    
    clearTimeout(window.foodMessageTimeout);
    window.foodMessageTimeout = setTimeout(() => {
        messageDiv.classList.add('d-none');
    }, 5000);
}

// ===========================
// دریافت لیست غذاها از سرور
// ===========================
function fetchFoods() {
    console.log('📡 دریافت لیست غذاها از سرور...');
    
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
        if (data.success) {
            foods = data.foods;
            console.log(`✅ ${foods.length} غذا دریافت شد.`);
            return foods;
        } else {
            throw new Error('دریافت غذاها با خطا مواجه شد.');
        }
    })
    .catch(error => {
        console.error('❌ خطا:', error);
        foods = [];
        return foods;
    });
}

// ===========================
// بروزرسانی لیست غذاها در همه Select ها
// ===========================
function updateAllFoodSelects() {
    const selectIds = ['foodSelect', 'editFoodSelect'];
    
    selectIds.forEach(selectId => {
        const select = document.getElementById(selectId);
        if (!select) return;
        
        const currentValue = select.value;
        select.innerHTML = '<option value=""></option>';
        
        foods.forEach(food => {
            const option = document.createElement('option');
            option.value = food.id;
            option.textContent = food.name;
            select.appendChild(option);
        });
        
        if (currentValue && foods.some(f => f.id == currentValue)) {
            select.value = currentValue;
        }
    });
}

// ===========================
// بارگذاری غذا برای ویرایش
// ===========================
function loadSelectedFood() {
    const id = Number(document.getElementById("editFoodSelect").value);
    const food = foods.find(f => f.id === id);
    
    if (!food) {
        document.getElementById("editFoodName").value = "";
        document.getElementById("editFoodPreview").src = "/static/images/no-food.png";
        return;
    }
    
    document.getElementById("editFoodName").value = food.name;
    document.getElementById("editFoodPreview").src = getImageUrl(food.image);
}

// ===========================
// نمایش پیام‌های عمومی
// ===========================
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
// ✅ تابع کمکی برای حذف backdrop (مهم!)
// ============================================================
function clearModalBackdrop() {
    document.querySelectorAll('.modal-backdrop').forEach(el => el.remove());
    document.body.classList.remove('modal-open');
    document.body.style.overflow = '';
}

// ============================================================
// ✅ تابع کمکی برای بستن ایمن مودال (مهم!)
// ============================================================
function safeCloseModal(modalId) {
    const modalElement = document.getElementById(modalId);
    if (!modalElement) return;
    
    const modal = bootstrap.Modal.getInstance(modalElement);
    if (modal) {
        modal.hide();
    }
    
    setTimeout(() => {
        clearModalBackdrop();
    }, 150);
}

// ===========================
// مقداردهی اولیه Datepicker ها
// ===========================
function initDatepickers() {
    if (typeof $ !== 'undefined') {
        if (document.getElementById("fromDate")) {
            $("#fromDate").persianDatepicker({
                format: "YYYY/MM/DD",
                initialValue: false,
                persianDigit: false,
                autoClose: true
            });
        }
        
        if (document.getElementById("toDate")) {
            $("#toDate").persianDatepicker({
                format: "YYYY/MM/DD",
                initialValue: false,
                persianDigit: false,
                autoClose: true
            });
        }
        
        if (document.getElementById("reportFromDate")) {
            $("#reportFromDate").persianDatepicker({
                format: "YYYY/MM/DD",
                initialValue: false,
                persianDigit: false,
                autoClose: true
            });
        }
        
        if (document.getElementById("reportToDate")) {
            $("#reportToDate").persianDatepicker({
                format: "YYYY/MM/DD",
                initialValue: false,
                persianDigit: false,
                autoClose: true
            });
        }
    }
}

// ===========================
// راه‌اندازی اولیه
// ===========================
document.addEventListener("DOMContentLoaded", function() {
    
    // ============================================================
    // ✅ مدیریت بسته شدن همه مودال‌ها (مهم!)
    // ============================================================
    const modalIds = [
        'passwordModal',
        'foodModal', 
        'reportModal',
        'editFoodModal',
        'resetPasswordModal',
        'editUserModal',
        'deleteUserModal'
    ];
    
    // برای هر مودال، event listener اضافه کن
    modalIds.forEach(modalId => {
        const modalElement = document.getElementById(modalId);
        if (modalElement) {
            modalElement.addEventListener('hidden.bs.modal', function() {
                clearModalBackdrop();
            });
        }
    });
    
    // بستن مودال با دکمه ضربدر
    document.addEventListener('click', function(e) {
        if (e.target.closest('.btn-close') && e.target.closest('.modal')) {
            setTimeout(() => {
                clearModalBackdrop();
            }, 200);
        }
    });
    
    // بستن مودال با کلید ESC
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            setTimeout(() => {
                clearModalBackdrop();
            }, 200);
        }
    });
    
    // ============================================================
    // 1. مدیریت دکمه‌های منو برای نمایش مودال‌ها
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
            console.log(`✅ Found button: ${btnId}`);
            btn.addEventListener("click", function(e) {
                e.preventDefault();
                const modalId = menuButtons[btnId];
                const modalElement = document.getElementById(modalId);
                if (modalElement) {
                    console.log(`✅ Showing modal: ${modalId}`);
                    const modal = new bootstrap.Modal(modalElement);
                    modal.show();
                } else {
                    console.error(`❌ Modal not found: ${modalId}`);
                }
            });
        } else {
            console.warn(`⚠️ Button not found: ${btnId}`);
        }
    });
    
    // ============================================================
    // 2. نمایش تاریخ امروز
    // ============================================================
    const todayDateElement = document.getElementById("todayDate");
    if (todayDateElement) {
        const today = new Date();
        todayDateElement.textContent = today.toLocaleDateString("fa-IR");
    }
    
    // ============================================================
    // 3. تغییر رمز عبور (دکمه ذخیره در مودال)
    // ============================================================
    const savePasswordBtn = document.getElementById("savePassword");
    if (savePasswordBtn) {
        savePasswordBtn.addEventListener("click", function() {
            const oldPassword = document.getElementById("oldPassword").value;
            const newPassword = document.getElementById("newPassword").value;
            const repeatPassword = document.getElementById("repeatPassword").value;
            
            if (!oldPassword || !newPassword || !repeatPassword) {
                showMessage("لطفاً تمام فیلدها را پر کنید.", "danger");
                return;
            }
            
            if (newPassword !== repeatPassword) {
                showMessage("رمز عبور و تکرار آن مطابقت ندارند.", "danger");
                return;
            }
            
            if (newPassword.length < 8) {
                showMessage("رمز عبور باید حداقل 8 کاراکتر باشد.", "danger");
                return;
            }
            
            fetch("/Alvan/change-password/", {
                method: "POST",
                headers: {
                    "X-CSRFToken": getCSRFToken(),
                    "Content-Type": "application/x-www-form-urlencoded",
                },
                body: new URLSearchParams({
                    old_password: oldPassword,
                    new_password: newPassword,
                    repeat_password: repeatPassword
                })
            })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    showMessage("رمز عبور با موفقیت تغییر کرد.", "success");
                    safeCloseModal('passwordModal');
                    document.getElementById("oldPassword").value = "";
                    document.getElementById("newPassword").value = "";
                    document.getElementById("repeatPassword").value = "";
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
    // 4. رویداد: باز کردن مودال تعریف غذا
    // ============================================================
    const manageFoodsBtn = document.getElementById("manageFoods");
    if (manageFoodsBtn) {
        manageFoodsBtn.addEventListener("click", function(e) {
            e.preventDefault();
            fetchFoods().then(() => {
                updateAllFoodSelects();
                const modal = new bootstrap.Modal(document.getElementById("foodModal"));
                modal.show();
            });
        });
    }
    
    // ============================================================
    // 5. رویداد: ویرایش غذاها
    // ============================================================
    const editFoodsBtn = document.getElementById("editFoods");
    if (editFoodsBtn) {
        editFoodsBtn.addEventListener("click", function(e) {
            e.preventDefault();
            fetchFoods().then(() => {
                const select = document.getElementById("editFoodSelect");
                select.innerHTML = "";
                
                foods.forEach(food => {
                    const option = document.createElement("option");
                    option.value = food.id;
                    option.textContent = food.name;
                    select.appendChild(option);
                });
                
                select.selectedIndex = -1;
                document.getElementById("editFoodName").value = "";
                document.getElementById("editFoodPreview").src = "/static/images/no-food.png";
                
                const modal = new bootstrap.Modal(document.getElementById("editFoodModal"));
                modal.show();
            });
        });
    }
    
    // ============================================================
    // 6. رویداد: انتخاب غذا برای ویرایش
    // ============================================================
    const editFoodSelect = document.getElementById("editFoodSelect");
    if (editFoodSelect) {
        editFoodSelect.addEventListener("change", loadSelectedFood);
    }
    
    // ============================================================
    // 7. رویداد: پیش‌نمایش تصویر در ویرایش
    // ============================================================
    const editFoodImage = document.getElementById("editFoodImage");
    if (editFoodImage) {
        editFoodImage.addEventListener("change", function() {
            if (!this.files.length) return;
            
            const reader = new FileReader();
            reader.onload = function(e) {
                document.getElementById("editFoodPreview").src = e.target.result;
            };
            reader.readAsDataURL(this.files[0]);
        });
    }
    
    // ============================================================
    // 8. رویداد: پیش‌نمایش تصویر غذا
    // ============================================================
    const foodImageInput = document.getElementById("foodImageInput");
    if (foodImageInput) {
        foodImageInput.addEventListener("change", function() {
            const preview = document.getElementById("foodPreview");
            
            if (!this.files.length) {
                preview.src = "/static/images/no-food.png";
                return;
            }
            
            const file = this.files[0];
            
            if (file.size > 2 * 1024 * 1024) {
                showFoodMessage('❌ حجم تصویر نباید بیشتر از 2 مگابایت باشد.', 'danger');
                this.value = '';
                preview.src = "/static/images/no-food.png";
                return;
            }
            
            const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
            if (!allowedTypes.includes(file.type)) {
                showFoodMessage('❌ فقط فرمت‌های JPEG, PNG, GIF و WEBP مجاز هستند.', 'danger');
                this.value = '';
                preview.src = "/static/images/no-food.png";
                return;
            }
            
            const reader = new FileReader();
            reader.onload = function(e) {
                preview.src = e.target.result;
            };
            reader.onerror = function() {
                showFoodMessage('❌ خطا در خواندن فایل.', 'danger');
            };
            reader.readAsDataURL(file);
        });
    }
    
    // ============================================================
    // 9. رویداد: ذخیره غذای جدید
    // ============================================================
    const saveNewFoodBtn = document.getElementById("saveNewFood");
    if (saveNewFoodBtn) {
        saveNewFoodBtn.addEventListener("click", function() {
            const nameInput = document.getElementById("foodNameInput");
            const imageInput = document.getElementById("foodImageInput");
            const previewImg = document.getElementById("foodPreview");
            
            const name = nameInput.value.trim();
            const imageFile = imageInput.files[0];
            
            if (name === "") {
                showFoodMessage('❌ لطفاً نام غذا را وارد کنید.', 'danger');
                nameInput.focus();
                return;
            }
            
            const formData = new FormData();
            formData.append('food_name', name);
            
            if (imageFile) {
                if (imageFile.size > 2 * 1024 * 1024) {
                    showFoodMessage('❌ حجم تصویر نباید بیشتر از 2 مگابایت باشد.', 'danger');
                    imageInput.value = '';
                    previewImg.src = "/static/images/no-food.png";
                    return;
                }
                
                const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
                if (!allowedTypes.includes(imageFile.type)) {
                    showFoodMessage('❌ فقط فرمت‌های JPEG, PNG, GIF و WEBP مجاز هستند.', 'danger');
                    imageInput.value = '';
                    previewImg.src = "/static/images/no-food.png";
                    return;
                }
                
                formData.append('food_image', imageFile);
            }
            
            const saveBtn = this;
            saveBtn.disabled = true;
            saveBtn.innerHTML = '<span class="spinner-border spinner-border-sm"></span> در حال ثبت...';
            
            fetch('/menu/foods/create/', {
                method: 'POST',
                body: formData,
                headers: {
                    'X-CSRFToken': getCSRFToken(),
                },
            })
            .then(response => {
                if (!response.ok) {
                    if (response.status === 403) {
                        throw new Error('شما دسترسی لازم برای این عملیات را ندارید.');
                    }
                    if (response.status === 400) {
                        throw new Error('اطلاعات ارسالی معتبر نیست.');
                    }
                    throw new Error(`خطای سرور: ${response.status}`);
                }
                return response.json();
            })
            .then(data => {
                if (data.success) {
                    showFoodMessage(`✅ ${data.message}`, 'success');
                    
                    const newFood = {
                        id: data.food.id,
                        name: data.food.name,
                        image: getImageUrl(data.food.image)
                    };
                    foods.push(newFood);
                    
                    updateAllFoodSelects();
                    
                    const foodSelectEl = document.getElementById("foodSelect");
                    if (foodSelectEl) {
                        foodSelectEl.value = data.food.id;
                    }
                    
                    const foodImageEl = document.getElementById("foodImage");
                    const foodTitleEl = document.getElementById("foodTitle");
                    if (foodImageEl && foodTitleEl) {
                        foodImageEl.src = newFood.image;
                        foodTitleEl.textContent = newFood.name;
                    }
                    
                    nameInput.value = '';
                    imageInput.value = '';
                    previewImg.src = "/static/images/no-food.png";
                    
                    setTimeout(() => {
                        safeCloseModal('foodModal');
                        saveBtn.disabled = false;
                        saveBtn.innerHTML = 'ثبت غذا';
                    }, 1500);
                    
                } else {
                    showFoodMessage(`❌ ${data.message}`, 'danger');
                    saveBtn.disabled = false;
                    saveBtn.innerHTML = 'ثبت غذا';
                }
            })
            .catch(error => {
                console.error('Error:', error);
                showFoodMessage(`❌ ${error.message}`, 'danger');
                saveBtn.disabled = false;
                saveBtn.innerHTML = 'ثبت غذا';
                clearModalBackdrop();
            });
        });
    }
    
    // ============================================================
    // 10. رویداد: ذخیره تغییرات ویرایش غذا
    // ============================================================
    const saveFoodChangesBtn = document.getElementById("saveFoodChanges");
    if (saveFoodChangesBtn) {
        saveFoodChangesBtn.addEventListener("click", function() {
            const select = document.getElementById("editFoodSelect");
            const nameInput = document.getElementById("editFoodName");
            const imageInput = document.getElementById("editFoodImage");
            const previewImg = document.getElementById("editFoodPreview");
            
            const id = Number(select.value);
            const newName = nameInput.value.trim();
            const imageFile = imageInput.files[0];
            
            if (!id) {
                alert("❌ لطفاً یک غذا را انتخاب کنید.");
                return;
            }
            
            if (newName === "") {
                alert("❌ نام غذا نمی‌تواند خالی باشد.");
                nameInput.focus();
                return;
            }
            
            const existingFood = foods.find(f => f.id === id);
            if (!existingFood) {
                alert("❌ غذا در لیست محلی یافت نشد.");
                return;
            }
            
            const formData = new FormData();
            formData.append('food_id', id);
            formData.append('food_name', newName);
            
            if (imageFile) {
                if (imageFile.size > 2 * 1024 * 1024) {
                    alert('❌ حجم تصویر نباید بیشتر از 2 مگابایت باشد.');
                    imageInput.value = '';
                    previewImg.src = existingFood.image;
                    return;
                }
                
                const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
                if (!allowedTypes.includes(imageFile.type)) {
                    alert('❌ فقط فرمت‌های JPEG, PNG, GIF و WEBP مجاز هستند.');
                    imageInput.value = '';
                    previewImg.src = existingFood.image;
                    return;
                }
                
                formData.append('food_image', imageFile);
            }
            
            const saveBtn = this;
            saveBtn.disabled = true;
            saveBtn.innerHTML = '<span class="spinner-border spinner-border-sm"></span> در حال ویرایش...';
            
            fetch('/menu/foods/update/', {
                method: 'POST',
                body: formData,
                headers: {
                    'X-CSRFToken': getCSRFToken(),
                },
            })
            .then(response => {
                if (!response.ok) {
                    if (response.status === 403) {
                        throw new Error('شما دسترسی لازم برای این عملیات را ندارید.');
                    }
                    if (response.status === 404) {
                        throw new Error('آدرس سرور پیدا نشد.');
                    }
                    throw new Error(`خطای سرور: ${response.status}`);
                }
                return response.json();
            })
            .then(data => {
                if (data.success) {            
                    const foodIndex = foods.findIndex(f => f.id === data.food.id);
                    if (foodIndex !== -1) {
                        foods[foodIndex] = {
                            id: data.food.id,
                            name: data.food.name,
                            image: getImageUrl(data.food.image)
                        };
                    }
                    
                    updateAllFoodSelects();
                    
                    const foodSelectEl = document.getElementById("foodSelect");
                    const foodImageEl = document.getElementById("foodImage");
                    const foodTitleEl = document.getElementById("foodTitle");
                    
                    if (foodSelectEl && foodSelectEl.value == data.food.id) {
                        if (foodImageEl) foodImageEl.src = getImageUrl(data.food.image);
                        if (foodTitleEl) foodTitleEl.textContent = data.food.name;
                    }
                    
                    nameInput.value = '';
                    imageInput.value = '';
                    previewImg.src = "/static/images/no-food.png";
                    select.value = '';
                    
                    alert(`✅ ${data.message}`);
                    
                    safeCloseModal('editFoodModal');
                    
                    saveBtn.disabled = false;
                    saveBtn.innerHTML = 'ذخیره تغییرات';
                    
                } else {
                    console.error('❌ خطای سرور:', data.message);
                    alert(`❌ ${data.message}`);
                    saveBtn.disabled = false;
                    saveBtn.innerHTML = 'ذخیره تغییرات';
                }
            })
            .catch(error => {
                console.error('❌ خطا:', error);
                alert(`❌ ${error.message}`);
                saveBtn.disabled = false;
                saveBtn.innerHTML = 'ذخیره تغییرات';
                clearModalBackdrop();
            });
        });
    }
    
    // ============================================================
    // 11. بازنشانی پیام هنگام بسته شدن مودال
    // ============================================================
    const foodModal = document.getElementById('foodModal');
    if (foodModal) {
        foodModal.addEventListener('hidden.bs.modal', function() {
            const messageDiv = document.getElementById('foodMessage');
            if (messageDiv) {
                messageDiv.classList.add('d-none');
                messageDiv.textContent = '';
            }
            
            const saveBtn = document.getElementById('saveNewFood');
            if (saveBtn) {
                saveBtn.disabled = false;
                saveBtn.innerHTML = 'ثبت غذا';
            }
            
            clearModalBackdrop();
        });
    }
    
    // ============================================================
    // 12. رویداد: گزارش گیری - باز کردن مودال
    // ============================================================
    const monthlyReportBtn = document.getElementById("monthlyReport");
    if (monthlyReportBtn) {
        monthlyReportBtn.addEventListener("click", function(e) {
            e.preventDefault();
            const modal = new bootstrap.Modal(document.getElementById("reportModal"));
            modal.show();
        });
    }
    
    // ============================================================
    // 13. رویداد: گزارش ماهانه
    // ============================================================
    const generateMonthlyReportBtn = document.getElementById("generateMonthlyReport");
    if (generateMonthlyReportBtn) {
        generateMonthlyReportBtn.addEventListener("click", function() {
            const year = document.getElementById("reportYear").value;
            const month = document.getElementById("reportMonth").value;
            
            if (!year || !month) {
                alert("⚠️ لطفاً سال و ماه را انتخاب کنید.");
                return;
            }
            
            const btn = this;
            btn.disabled = true;
            btn.innerHTML = '<span class="spinner-border spinner-border-sm"></span> در حال ایجاد گزارش...';
            
            const csrfToken = getCSRFToken();
            
            fetch('/reservations/report-monthly/', {
                method: 'POST',
                headers: {
                    'X-CSRFToken': csrfToken,
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: new URLSearchParams({
                    year: year,
                    month: month,
                }),
            })
            .then(response => {
                if (!response.ok) {
                    throw new Error(`خطا: ${response.status}`);
                }
                
                // دریافت نام فایل از هدر
                const contentDisposition = response.headers.get("Content-Disposition");
                console.log("📄 Content-Disposition:", contentDisposition); // برای دیباگ
                
                let filename = `گزارش_${year}_${month}.xlsx`;

                if (contentDisposition) {
                    // ✅ روش صحیح: ابتدا filename معمولی را بگیر و decode کن
                    const match = contentDisposition.match(/filename="([^"]+)"/);
                    if (match && match[1]) {
                        let rawFilename = match[1];
                        // اگر شامل % بود، decode کن
                        if (rawFilename.includes('%')) {
                            try {
                                filename = decodeURIComponent(rawFilename);
                            } catch (e) {
                                filename = rawFilename;
                            }
                        } else {
                            filename = rawFilename;
                        }
                    }
                    
                    // اگر filename* هم بود (UTF-8)، آن را در نظر بگیر
                    const utf8Match = contentDisposition.match(/filename\*=UTF-8''([^;]+)/i);
                    if (utf8Match && utf8Match[1]) {
                        try {
                            filename = decodeURIComponent(utf8Match[1]);
                        } catch (e) {
                            // اگر نشد، همان را نگه دار
                        }
                    }
                }
                
                console.log("📄 Extracted filename:", filename); // برای دیباگ
                
                return response.blob().then(blob => ({ blob, filename }));
            })
            .then(({ blob, filename }) => {
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = filename;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                window.URL.revokeObjectURL(url);
            })
            .catch(error => {
                alert(`❌ خطا در دریافت گزارش: ${error.message}`);
            })
            .finally(() => {
                btn.disabled = false;
                btn.innerHTML = 'دریافت گزارش ماهانه';
            });
        });
    }

    // ============================================================
    // 14. رویداد: گزارش بازه زمانی (اصلاح شده)
    // ============================================================
    const generateRangeReportBtn = document.getElementById("generateRangeReport");
    if (generateRangeReportBtn) {
        generateRangeReportBtn.addEventListener("click", function() {
            const fromDate = document.getElementById("reportFromDate").value;
            const toDate = document.getElementById("reportToDate").value;
            
            if (!fromDate || !toDate) {
                alert("⚠️ لطفاً بازه زمانی را مشخص کنید.");
                return;
            }
            
            const btn = this;
            btn.disabled = true;
            btn.innerHTML = '<span class="spinner-border spinner-border-sm"></span> در حال ایجاد گزارش...';
            
            const csrfToken = getCSRFToken();
            
            // ✅ استفاده از fetch با response.blob() مانند گزارش ماهانه
            fetch('/reservations/report-range/', {
                method: 'POST',
                headers: {
                    'X-CSRFToken': csrfToken,
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: new URLSearchParams({
                    from_date: fromDate,
                    to_date: toDate,
                }),
            })
            .then(response => {
                if (!response.ok) {
                    throw new Error(`خطا: ${response.status}`);
                }
                
                const contentDisposition = response.headers.get("Content-Disposition");

                let filename = `گزارش_${fromDate.replace(/\//g, "-")}_تا_${toDate.replace(/\//g, "-")}.xlsx`;

                if (contentDisposition) {

                    const utf8Match = contentDisposition.match(/filename\*=UTF-8''([^;]+)/i);

                    if (utf8Match) {

                        filename = decodeURIComponent(utf8Match[1]);

                    } else {

                        const asciiMatch = contentDisposition.match(/filename="?([^"]+)"?/i);

                        if (asciiMatch) {
                            filename = asciiMatch[1];
                        }

                    }
                }
                
                return response.blob().then(blob => ({ blob, filename }));
            })
            .then(({ blob, filename }) => {
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = filename;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                window.URL.revokeObjectURL(url);
            })
            .catch(error => {
                alert(`❌ خطا در دریافت گزارش: ${error.message}`);
            })
            .finally(() => {
                btn.disabled = false;
                btn.innerHTML = 'دریافت گزارش بازه زمانی';
            });
        });
    }
    
    // ============================================================
    // 15. مقداردهی Datepicker ها
    // ============================================================
    initDatepickers();
    
});