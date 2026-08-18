    const loginTab = document.getElementById("loginTab");
    const registerTab = document.getElementById("registerTab");

    const loginForm = document.getElementById("loginForm");
    const registerForm = document.getElementById("registerForm");

    loginTab.addEventListener("click",function(){

        loginTab.classList.add("active");
        registerTab.classList.remove("active");

        loginForm.hidden=false;
        registerForm.hidden=true;

    });

    registerTab.addEventListener("click",function(){

        registerTab.classList.add("active");
        loginTab.classList.remove("active");

        loginForm.hidden=true;
        registerForm.hidden=false;

    });