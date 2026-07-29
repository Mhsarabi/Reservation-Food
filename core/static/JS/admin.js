const calendar = new PersianCalendar("calendarGrid", true);
calendar.render();

const fromDate = document.getElementById("fromDate");
const toDate = document.getElementById("toDate");
const weekChecks =
document.querySelectorAll("#weekDays input[type='checkbox']");


const foodSelect = document.getElementById("foodSelect");
const foodImage = document.getElementById("foodImage");
const foodTitle = document.getElementById("foodTitle");
const selectedDate = document.getElementById("selectedDate");

let selectedKey = null;


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


function isWeeklyMode() {

    return (
        fromDate.value.trim() !== "" &&
        toDate.value.trim() !== ""

    );

}

const today = new Date();

document.getElementById("todayDate").textContent =
    today.toLocaleDateString("fa-IR");

/* ===========================
   پر کردن لیست غذاها
=========================== */

foods.forEach(food => {

    let option1 = document.createElement("option");

    option1.value = food.id;
    option1.textContent = food.name;

    foodSelect.appendChild(option1);

});


/* ===========================
   تغییر غذا
=========================== */

foodSelect.addEventListener("change", function () {

    const food = foods.find(f => f.id == this.value);

    if (!food) {

        foodImage.src = "../static/images/no-food.png";
        foodTitle.textContent = "هنوز غذایی انتخاب نشده است.";

        return;

    }

    foodImage.src = food.image;
    foodTitle.textContent = food.name;

});


/* ===========================
   بارگذاری اطلاعات روز
=========================== */

function loadDayData(year, month, day) {

    selectedKey =
        `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;

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

    selectedDate.textContent =
        `${day} ${months[month - 1]} ${year}`;

    const menu = menuData[selectedKey];

    if (menu) {

        const food =
            foods.find(f => f.id === menu.foodId);

        if (food) {

            foodSelect.value = food.id;
            foodImage.src = food.image;
            foodTitle.textContent = food.name;

        }

    }
    else {

        foodSelect.value = "";
        foodImage.src = "../static/images/no-food.png";
        foodTitle.textContent = "هنوز غذایی انتخاب نشده است.";

    }

}


/* ===========================
   انتخاب روز از تقویم
=========================== */

document.addEventListener("daySelected", function (e) {

    loadDayData(

        e.detail.year,
        e.detail.month,
        e.detail.day

    );

});


/* ===========================
   ذخیره
=========================== */
document.getElementById("saveFood").addEventListener("click", function () {

        if (!selectedKey) {

        alert("ابتدا یک روز را انتخاب کنید.");
        return;

    }

    const [year, month, day] = selectedKey.split("-").map(Number);

    const selectedNumber =
        year * 10000 +
        month * 100 +
        day;

    const today = new Date();
    const jToday = jalaali.toJalaali(today);

    const todayNumber =
        jToday.jy * 10000 +
        jToday.jm * 100 +
        jToday.jd;

    if(selectedNumber < todayNumber){

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

    menuData[selectedKey].foodId =
        Number(foodSelect.value);

    calendar.render();

});


/* ===========================
   حذف غذا
=========================== */

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

    console.log("After delete =", menuData[selectedKey]);

    if (Object.keys(menuData[selectedKey]).length === 0) {

        delete menuData[selectedKey];

    }

    calendar.render();

});

document.getElementById("changePassword")
.addEventListener("click", function (e) {

    e.preventDefault();

    const modal =
        new bootstrap.Modal(
            document.getElementById("changePasswordModal")
        );

    modal.show();

});

/* ===========================
   ذخیره برنامه هفتگی
=========================== */
document.getElementById("saveWeekly")
    .addEventListener("click", function () {

        saveWeeklyProgram();

    });


/* ===========================
   فرم تعریف غذا در سامانه
=========================== */
document
.getElementById("manageFoods")
.addEventListener("click", function (e) {

    e.preventDefault();

    const modal =
        new bootstrap.Modal(
            document.getElementById("foodModal")
        );

    modal.show();

});

document
.getElementById("foodImageInput")
.addEventListener("change", function () {

    if (!this.files.length)
        return;

    const reader = new FileReader();

    reader.onload = function (e) {

        document
        .getElementById("foodPreview")
        .src = e.target.result;

    }

    reader.readAsDataURL(this.files[0]);

});

document
.getElementById("saveNewFood")
.addEventListener("click", function () {

    const name =
        document
        .getElementById("foodNameInput")
        .value
        .trim();

    const image =
        document
        .getElementById("foodPreview")
        .src;

    if (name === "") {

        alert("نام غذا را وارد کنید.");

        return;

    }

    const newId =
        foods.length + 1;

    foods.push({

        id:newId,

        name:name,

        image:image

    });

    addFoodToSelect(newId, name);

    // ریست فرم
    document.getElementById("foodNameInput").value = "";
    document.getElementById("foodImageInput").value = "";
    document.getElementById("foodPreview").src =
        "../static/images/no-food.png";

    // بستن Modal
    bootstrap.Modal.getInstance(
        document.getElementById("foodModal")
    ).hide();

});

function addFoodToSelect(id,name){

    const option =
        document.createElement("option");

    option.value=id;

    option.textContent=name;

    foodSelect.appendChild(option);

}


document
.getElementById("monthlyReport")
.addEventListener("click", function (e) {

    e.preventDefault();

    const modal =
        new bootstrap.Modal(
            document.getElementById("reportModal")
        );

    modal.show();

});

/* ===========================
   فرم ویرایش غذا
=========================== */
document
.getElementById("editFoods")
.addEventListener("click", function(e){

    e.preventDefault();

    const select =
        document.getElementById("editFoodSelect");

    select.innerHTML = "";

    foods.forEach(food=>{

        const option =
            document.createElement("option");

        option.value = food.id;
        option.textContent = food.name;

        select.appendChild(option);

    });

    select.selectedIndex = -1;

    document.getElementById("editFoodName").value = "";
    document.getElementById("editFoodPreview").src ="";

    const modal =
        new bootstrap.Modal(
            document.getElementById("editFoodModal")
        );

    modal.show();

});
function loadSelectedFood(){

    const id =
        Number(document.getElementById("editFoodSelect").value);

    const food =
        foods.find(f=>f.id===id);

    if(!food)
        return;

    document.getElementById("editFoodName").value =
        food.name;

    document.getElementById("editFoodPreview").src =
        food.image;

}
document
.getElementById("editFoodSelect")
.addEventListener("change", loadSelectedFood);
document
.getElementById("editFoodImage")
.addEventListener("change",function(){

    if(!this.files.length)
        return;

    const reader =
        new FileReader();

    reader.onload = function(e){

        document.getElementById("editFoodPreview").src =
            e.target.result;

    }

    reader.readAsDataURL(this.files[0]);

});
document
.getElementById("saveFoodChanges")
.addEventListener("click", function () {

    const id = Number(
        document.getElementById("editFoodSelect").value
    );

    const food = foods.find(f => f.id === id);

    if (!food) return;

    food.name =
        document.getElementById("editFoodName").value.trim();

    food.image =
        document.getElementById("editFoodPreview").src;

    // بروزرسانی لیست انتخاب غذا
    foodSelect.innerHTML = '<option value=""></option>';

    foods.forEach(f => {

        const option = document.createElement("option");
        option.value = f.id;
        option.textContent = f.name;

        foodSelect.appendChild(option);

    });

    bootstrap.Modal
        .getInstance(document.getElementById("editFoodModal"))
        .hide();

    alert("تغییرات ذخیره شد.");

});


/* ===========================
   گزارش گرفتن
=========================== */
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