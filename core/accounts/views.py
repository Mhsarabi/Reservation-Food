from django.shortcuts import render,redirect
from django.views import View
from django.contrib.auth import authenticate,login
from django.contrib import messages
from django.contrib.auth import logout
import json
from django.http import JsonResponse
from django.contrib.auth.mixins import LoginRequiredMixin
from django.contrib.auth import update_session_auth_hash

# Create your views here.
# login
class LoginView(View):
    template_name = "accounts/login.html"

    def get(self, request):
        if request.user.is_authenticated:
            return redirect("/")

        return render(request, self.template_name)

    def post(self, request):
        personnel_code = request.POST.get("personnel_code")
        password = request.POST.get("password")

        user = authenticate(
            request,
            username=personnel_code,
            password=password,
        )

        if user is not None:
            login(request, user)
            return redirect("menu:calendar")

        messages.error(
            request,
            "کد پرسنلی یا رمز عبور اشتباه است."
        )

        return render(request, self.template_name)

# logout
class LogoutView(View):

    def get(self, request):
        logout(request)
        return redirect("accounts:login")


# change password
class ChangePasswordView(LoginRequiredMixin, View):

    def post(self, request):

        old_password = request.POST.get("old_password")
        new_password = request.POST.get("new_password")
        repeat_password = request.POST.get("repeat_password")

        if not request.user.check_password(old_password):
            return JsonResponse({
                "success": False,
                "message": "رمز فعلی اشتباه است."
            })

        if new_password != repeat_password:
            return JsonResponse({
                "success": False,
                "message": "تکرار رمز عبور صحیح نیست."
            })

        if len(new_password) < 8:
            return JsonResponse({
                "success": False,
                "message": "رمز عبور باید حداقل ۸ کاراکتر باشد."
            })

        request.user.set_password(new_password)
        request.user.save()

        update_session_auth_hash(request, request.user)

        return JsonResponse({
            "success": True,
            "message": "رمز عبور با موفقیت تغییر یافت."
        })