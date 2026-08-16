function faToEn(str) {

    const fa = "۰۱۲۳۴۵۶۷۸۹";
    const en = "0123456789";

    return str.replace(/[۰-۹]/g, d => en[fa.indexOf(d)]);

}

function saveWeeklyProgram() {

    if (fromDate.value.trim() === "" ||
        toDate.value.trim() === "") {

        alert("بازه زمانی را وارد کنید.");
        return;

    }
    
    const from =
    faToEn(fromDate.value.trim())
    .split("/")
    .map(Number);

    const to =
        faToEn(toDate.value.trim())
        .split("/")
        .map(Number);

    if (from.length !== 3 || to.length !== 3) {

        alert("فرمت تاریخ صحیح نیست.");
        return;

    }

    const selectedWeekDays = [];

    weekChecks.forEach(ch => {

        if (ch.checked) {

            selectedWeekDays.push(Number(ch.value));

        }

    });

    if (selectedWeekDays.length === 0) {

        alert("حداقل یک روز هفته را انتخاب کنید.");
        return;

    }

    if (foodSelect.value === "") {

    alert("ابتدا یک غذا انتخاب کنید.");
    return;

    }

    const foodId = Number(foodSelect.value);

    let jy = from[0];
    let jm = from[1];
    let jd = from[2];

    const endNumber =
        to[0] * 10000 +
        to[1] * 100 +
        to[2];

    while (true) {

        const currentNumber =
            jy * 10000 +
            jm * 100 +
            jd;

        if (currentNumber > endNumber)
            break;


        const g =
            jalaali.toGregorian(jy, jm, jd);

        const jsDate =
            new Date(g.gy, g.gm - 1, g.gd);

        const weekDay =
            (jsDate.getDay() + 1) % 7;



        if (selectedWeekDays.includes(weekDay)) {

            const key =
                `${jy}-${String(jm).padStart(2,"0")}-${String(jd).padStart(2,"0")}`;

            if (!menuData[key]) {

                menuData[key] = {};

            }

            menuData[key].foodId = foodId;

        }



        jd++;

        if (jd > jalaali.jalaaliMonthLength(jy, jm)) {

            jd = 1;

            jm++;

            if (jm > 12) {

                jm = 1;
                jy++;

            }

        }

    }

    calendar.render();

}