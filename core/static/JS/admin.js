// ===========================
// متغیرهای سراسری
// ===========================
let foods = [];
// ===========================
// دریافت CSRF Token
// ===========================
function getCSRFToken() {
    const cookieValue = document.cookie
        .split('; ')
        .find(row => row.startsWith('csrftoken='))
        ?.split('=')[1];
    return cookieValue || '';
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
// نمایش پیام در مودال
// ===========================
function showFoodMessage(message, type = 'success') {
    const messageDiv = document.getElementById('foodMessage');
    if (!messageDiv) return;
    
    messageDiv.textContent = message;
    messageDiv.className = `alert alert-${type}`;
    messageDiv.classList.remove('d-none');
    
    // بعد از 5 ثانیه پیام را مخفی کن
    clearTimeout(window.foodMessageTimeout);
    window.foodMessageTimeout = setTimeout(() => {
        messageDiv.classList.add('d-none');
    }, 5000);
}

// ===========================
// بروزرسانی لیست غذاها در همه Select ها
// ===========================
function updateAllFoodSelects() {
    const selectIds = ['foodSelect', 'editFoodSelect'];
    
    selectIds.forEach(selectId => {
        const select = document.getElementById(selectId);
        if (!select) return;
        
        // ذخیره مقدار فعلی
        const currentValue = select.value;
        
        // پاک کردن گزینه‌ها (به جز گزینه خالی اول)
        select.innerHTML = '<option value=""></option>';
        
        // اضافه کردن همه غذاها
        foods.forEach(food => {
            const option = document.createElement('option');
            option.value = food.id;
            option.textContent = food.name;
            select.appendChild(option);
        });
        
        // بازیابی مقدار قبلی اگر وجود داشت
        if (currentValue && foods.some(f => f.id == currentValue)) {
            select.value = currentValue;
        }
    });
}

// ===========================
// اضافه کردن غذا به Select (برای استفاده قبلی)
// ===========================
function addFoodToSelect(id, name) {
    const option = document.createElement('option');
    option.value = id;
    option.textContent = name;
    foodSelect.appendChild(option);
}

// ===========================
// بارگذاری اطلاعات روز
// ===========================
function loadDayData(year, month, day) {
    selectedKey = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    
    const months = [
        "فروردین",
        "اردیبهشت",
        "خرداد",
        "تیر",
        "مرداد",
        "شهریور",
        "مهر",
        "آبان",
        "آذر",
        "دی",
        "بهمن",
        "اسفند"
    ];
    
    selectedDate.textContent = `${day} ${months[month - 1]} ${year}`;
    
    const menu = menuData[selectedKey];
    
    if (menu) {
        const food = foods.find(f => f.id === menu.foodId);
        if (food) {
            foodSelect.value = food.id;
            foodImage.src = getImageUrl(food.image);
            foodTitle.textContent = food.name;
        }
    } else {
        foodSelect.value = "";
        foodImage.src = "/static/images/no-food.png";
        foodTitle.textContent = "هنوز غذایی انتخاب نشده است.";
    }
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
// راه‌اندازی اولیه تقویم
// ===========================
const calendar = new PersianCalendar("calendarGrid", true);
calendar.render();

// ===========================
// عناصر DOM
// ===========================
const fromDate = document.getElementById("fromDate");
const toDate = document.getElementById("toDate");
const weekChecks = document.querySelectorAll("#weekDays input[type='checkbox']");
const foodSelect = document.getElementById("foodSelect");
const foodImage = document.getElementById("foodImage");
const foodTitle = document.getElementById("foodTitle");
const selectedDate = document.getElementById("selectedDate");

let selectedKey = null;

// ===========================
// مقداردهی اولیه Datepicker ها
// ===========================
$("#fromDate").persianDatepicker({
    format: "YYYY/MM/DD",
    initialValue: false,
    autoClose: true
});

$("#toDate").persianDatepicker({
    format: "YYYY/MM/DD",
    initialValue: false,
    autoClose: true
});

$("#reportFromDate").persianDatepicker({
    format: "YYYY/MM/DD",
    initialValue: false,
    autoClose: true
});

$("#reportToDate").persianDatepicker({
    format: "YYYY/MM/DD",
    initialValue: false,
    autoClose: true
});

// ===========================
// بررسی حالت هفتگی
// ===========================
function isWeeklyMode() {
    return fromDate.value.trim() !== "" && toDate.value.trim() !== "";
}

// ===========================
// نمایش تاریخ امروز
// ===========================
const today = new Date();
document.getElementById("todayDate").textContent = today.toLocaleDateString("fa-IR");

// ===========================
// رویداد: تغییر غذا
// ===========================
foodSelect.addEventListener("change", function () {
    const food = foods.find(f => f.id == this.value);
    
    if (!food) {
        foodImage.src = "/static/images/no-food.png";
        foodTitle.textContent = "هنوز غذایی انتخاب نشده است.";
        return;
    }
    
    foodImage.src = getImageUrl(food.image);
    foodTitle.textContent = food.name;
});

// ===========================
// رویداد: انتخاب روز از تقویم
// ===========================
document.addEventListener("daySelected", function (e) {
    loadDayData(e.detail.year, e.detail.month, e.detail.day);
});

// ===========================
// رویداد: ذخیره غذای روز
// ===========================
document.getElementById("saveFood").addEventListener("click", function () {
    if (!selectedKey) {
        alert("ابتدا یک روز را انتخاب کنید.");
        return;
    }
    
    const [year, month, day] = selectedKey.split("-").map(Number);
    const selectedNumber = year * 10000 + month * 100 + day;
    
    const today = new Date();
    const jToday = jalaali.toJalaali(today);
    const todayNumber = jToday.jy * 10000 + jToday.jm * 100 + jToday.jd;
    
    if (selectedNumber < todayNumber) {
        alert("امکان ثبت غذا برای روزهای گذشته وجود ندارد.");
        return;
    }
    
    if (foodSelect.value === "") {
        alert("یک غذا انتخاب کنید.");
        return;
    }
    
    if (!menuData[selectedKey]) {
        menuData[selectedKey] = {};
    }
    
    menuData[selectedKey].foodId = Number(foodSelect.value);
    calendar.render();
});

// ===========================
// رویداد: حذف غذای روز
// ===========================
document.getElementById("deleteFood").addEventListener("click", function () {
    if (!selectedKey) {
        alert("ابتدا یک روز را انتخاب کنید.");
        return;
    }
    
    if (!menuData[selectedKey] || !menuData[selectedKey].foodId) {
        alert("برای این روز غذایی ثبت نشده است.");
        return;
    }
    
    delete menuData[selectedKey].foodId;
    
    if (Object.keys(menuData[selectedKey]).length === 0) {
        delete menuData[selectedKey];
    }
    
    calendar.render();
});

// ===========================
// رویداد: تغییر رمز عبور
// ===========================
document.getElementById("changePassword").addEventListener("click", function (e) {
    e.preventDefault();
    const modal = new bootstrap.Modal(document.getElementById("changePasswordModal"));
    modal.show();
});

// ===========================
// رویداد: ذخیره برنامه هفتگی
// ===========================
document.getElementById("saveWeekly").addEventListener("click", function () {
    saveWeeklyProgram();
});

// ===========================
// رویداد: باز کردن مودال تعریف غذا
// ===========================
document.getElementById("manageFoods").addEventListener("click", function (e) {
    e.preventDefault();
    fetchFoods().then(() => {
        updateAllFoodSelects();
        const modal = new bootstrap.Modal(document.getElementById("foodModal"));
        modal.show();
    });
});

// ===========================
// رویداد: پیش‌نمایش تصویر غذا
// ===========================
document.getElementById("foodImageInput").addEventListener("change", function () {
    const preview = document.getElementById("foodPreview");
    
    if (!this.files.length) {
        preview.src = "/static/images/no-food.png";
        return;
    }
    
    const file = this.files[0];
    
    // بررسی حجم
    if (file.size > 2 * 1024 * 1024) {
        showFoodMessage('❌ حجم تصویر نباید بیشتر از 2 مگابایت باشد.', 'danger');
        this.value = '';
        preview.src = "/static/images/no-food.png";
        return;
    }
    
    // بررسی نوع فایل
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

// ===========================
// رویداد: ذخیره غذای جدید (ارسال به سرور)
// ===========================
document.getElementById("saveNewFood").addEventListener("click", function () {
    const nameInput = document.getElementById("foodNameInput");
    const imageInput = document.getElementById("foodImageInput");
    const previewImg = document.getElementById("foodPreview");
    
    const name = nameInput.value.trim();
    const imageFile = imageInput.files[0];
    
    // ===== اعتبارسنجی =====
    if (name === "") {
        showFoodMessage('❌ لطفاً نام غذا را وارد کنید.', 'danger');
        nameInput.focus();
        return;
    }
    
    // ===== آماده‌سازی داده برای ارسال =====
    const formData = new FormData();
    formData.append('food_name', name);
    
    if (imageFile) {
        // بررسی حجم فایل (حداکثر 2 مگابایت)
        if (imageFile.size > 2 * 1024 * 1024) {
            showFoodMessage('❌ حجم تصویر نباید بیشتر از 2 مگابایت باشد.', 'danger');
            imageInput.value = '';
            previewImg.src = "/static/images/no-food.png";
            return;
        }
        
        // بررسی نوع فایل
        const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
        if (!allowedTypes.includes(imageFile.type)) {
            showFoodMessage('❌ فقط فرمت‌های JPEG, PNG, GIF و WEBP مجاز هستند.', 'danger');
            imageInput.value = '';
            previewImg.src = "/static/images/no-food.png";
            return;
        }
        
        formData.append('food_image', imageFile);
    }
    
    // ===== غیرفعال کردن دکمه =====
    const saveBtn = this;
    saveBtn.disabled = true;
    saveBtn.innerHTML = '<span class="spinner-border spinner-border-sm"></span> در حال ثبت...';
    
    // ===== ارسال به سرور =====
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
            // ===== موفقیت =====
            showFoodMessage(`✅ ${data.message}`, 'success');
            
            // اضافه کردن به آرایه محلی
            const newFood = {
                id: data.food.id,
                name: data.food.name,
                image: getImageUrl(data.food.image)
            };
            foods.push(newFood);
            
            // بروزرسانی تمام select ها
            updateAllFoodSelects();
            
            // انتخاب غذا در select اصلی (اختیاری)
            document.getElementById('foodSelect').value = data.food.id;
            
            // نمایش تصویر غذا در کارت سمت راست
            if (foodImage && foodTitle) {
                foodImage.src = newFood.image;
                foodTitle.textContent = newFood.name;
            }
            
            // پاک کردن فرم
            nameInput.value = '';
            imageInput.value = '';
            previewImg.src = "/static/images/no-food.png";
            
            // بستن مودال بعد از 1.5 ثانیه
            setTimeout(() => {
                const modal = bootstrap.Modal.getInstance(document.getElementById('foodModal'));
                if (modal) {
                    modal.hide();
                }
                saveBtn.disabled = false;
                saveBtn.innerHTML = 'ثبت غذا';
            }, 1500);
            
        } else {
            // ===== خطا از سمت سرور =====
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
    });
});

// ===========================
// رویداد: بازنشانی پیام هنگام بسته شدن مودال
// ===========================
document.getElementById('foodModal').addEventListener('hidden.bs.modal', function () {
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
});

// ===========================
// رویداد: گزارش ماهانه
// ===========================
document.getElementById("monthlyReport").addEventListener("click", function (e) {
    e.preventDefault();
    const modal = new bootstrap.Modal(document.getElementById("reportModal"));
    modal.show();
});

// ===========================
// رویداد: ویرایش غذاها
// ===========================
document.getElementById("editFoods").addEventListener("click", function(e) {
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

// ===========================
// رویداد: انتخاب غذا برای ویرایش
// ===========================
document.getElementById("editFoodSelect").addEventListener("change", loadSelectedFood);

// ===========================
// رویداد: پیش‌نمایش تصویر در ویرایش
// ===========================
document.getElementById("editFoodImage").addEventListener("change", function() {
    if (!this.files.length) return;
    
    const reader = new FileReader();
    reader.onload = function(e) {
        document.getElementById("editFoodPreview").src = e.target.result;
    };
    reader.readAsDataURL(this.files[0]);
});

// ===========================
// رویداد: ذخیره تغییرات ویرایش 
// ===========================
document.getElementById("saveFoodChanges").addEventListener("click", function () {
    const select = document.getElementById("editFoodSelect");
    const nameInput = document.getElementById("editFoodName");
    const imageInput = document.getElementById("editFoodImage");
    const previewImg = document.getElementById("editFoodPreview");
    
    const id = Number(select.value);
    const newName = nameInput.value.trim();
    const imageFile = imageInput.files[0];
    
    // ===== اعتبارسنجی =====
    if (!id) {
        alert("❌ لطفاً یک غذا را انتخاب کنید.");
        return;
    }
    
    if (newName === "") {
        alert("❌ نام غذا نمی‌تواند خالی باشد.");
        nameInput.focus();
        return;
    }
    
    // پیدا کردن غذا در آرایه محلی برای نمایش موقت
    const existingFood = foods.find(f => f.id === id);
    if (!existingFood) {
        alert("❌ غذا در لیست محلی یافت نشد.");
        return;
    }
    
    // ===== آماده‌سازی داده برای ارسال =====
    const formData = new FormData();
    formData.append('food_id', id);
    formData.append('food_name', newName);
    
    if (imageFile) {
        // بررسی حجم فایل (حداکثر 2 مگابایت)
        if (imageFile.size > 2 * 1024 * 1024) {
            alert('❌ حجم تصویر نباید بیشتر از 2 مگابایت باشد.');
            imageInput.value = '';
            previewImg.src = existingFood.image;
            return;
        }
        
        // بررسی نوع فایل
        const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
        if (!allowedTypes.includes(imageFile.type)) {
            alert('❌ فقط فرمت‌های JPEG, PNG, GIF و WEBP مجاز هستند.');
            imageInput.value = '';
            previewImg.src = existingFood.image;
            return;
        }
        
        formData.append('food_image', imageFile);
    }
    
    // ===== غیرفعال کردن دکمه =====
    const saveBtn = this;
    saveBtn.disabled = true;
    saveBtn.innerHTML = '<span class="spinner-border spinner-border-sm"></span> در حال ویرایش...';
    
    // ===== ارسال به سرور =====
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
            // ===== موفقیت =====
            console.log('✅ غذا با موفقیت ویرایش شد:', data.food);
            
            // بروزرسانی در آرایه محلی
            const foodIndex = foods.findIndex(f => f.id === data.food.id);
            if (foodIndex !== -1) {
                foods[foodIndex] = {
                    id: data.food.id,
                    name: data.food.name,
                    image: getImageUrl(data.food.image)
                };
            }
            
            // بروزرسانی تمام select ها
            updateAllFoodSelects();
            
            // بروزرسانی نمایش در کارت سمت راست
            if (foodSelect.value == data.food.id) {
                foodImage.src = getImageUrl(data.food.image);
                foodTitle.textContent = data.food.name;
            }
            
            // پاک کردن فرم
            nameInput.value = '';
            imageInput.value = '';
            previewImg.src = "/static/images/no-food.png";
            select.value = '';
            
            // نمایش پیام موفقیت
            alert(`✅ ${data.message}`);
            
            // بستن مودال
            const modal = bootstrap.Modal.getInstance(document.getElementById('editFoodModal'));
            if (modal) {
                modal.hide();
            }
            
            saveBtn.disabled = false;
            saveBtn.innerHTML = 'ذخیره تغییرات';
            
        } else {
            // ===== خطا از سمت سرور =====
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
    });
});

// ===========================
// رویداد: گزارش گیری - دریافت گزارش ماهانه
// ===========================
document.getElementById("generateMonthlyReport").addEventListener("click", function() {
    const year = document.getElementById("reportYear").value;
    const month = document.getElementById("reportMonth").value;
    
    if (!year || !month) {
        alert("لطفاً سال و ماه را انتخاب کنید.");
        return;
    }
    
    // اینجا کد دریافت گزارش ماهانه از سرور قرار می‌گیرد
    alert(`دریافت گزارش ماهانه ${year}/${month}`);
});

// ===========================
// رویداد: گزارش گیری - دریافت گزارش بازه زمانی
// ===========================
document.getElementById("generateRangeReport").addEventListener("click", function() {
    const fromDate = document.getElementById("reportFromDate").value;
    const toDate = document.getElementById("reportToDate").value;
    
    if (!fromDate || !toDate) {
        alert("لطفاً بازه زمانی را مشخص کنید.");
        return;
    }
    
    // اینجا کد دریافت گزارش بازه زمانی از سرور قرار می‌گیرد
    alert(`دریافت گزارش بازه زمانی ${fromDate} تا ${toDate}`);
});

// ===========================
// بارگذاری اولیه - دریافت غذاها از سرور
// ===========================
fetchFoods().then(() => {
    updateAllFoodSelects();
    calendar.render();
});