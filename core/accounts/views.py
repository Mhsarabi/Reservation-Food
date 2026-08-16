from django.shortcuts import render,redirect,get_object_or_404
from django.template.loader import render_to_string
from django.views import View
from django.contrib.auth import authenticate,login
from django.contrib import messages
from django.contrib.auth import logout
from .models import User
from django.http import JsonResponse
from django.contrib.auth.mixins import LoginRequiredMixin, UserPassesTestMixin
from django.contrib.auth import update_session_auth_hash
from django.views.generic import TemplateView
from django.db import IntegrityError
import openpyxl

# Create your views here.
# login
class LoginView(View):
    template_name = "accounts/login.html"

    def get(self, request):
        if request.user.is_authenticated:
            if request.user.is_staff:
                return redirect("accounts:admin_dashboard")
            else:
                return redirect("menu:calendar")

        return render(request, self.template_name)

    def post(self, request):
        national_code = request.POST.get("national_code")
        password = request.POST.get("password")

        user = authenticate(
            request,
            username=national_code,
            password=password,
        )

        if user is not None:
            login(request, user)

            if user.is_staff:
                return redirect("accounts:admin_dashboard")

            return redirect("menu:calendar")

        messages.error(
            request,
            "کد ملی یا رمز عبور اشتباه است."
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


class AdminDashboardView(LoginRequiredMixin,UserPassesTestMixin,TemplateView):
    template_name = "admin/admin.html"

    def test_func(self):
        return self.request.user.is_staff


class UsersManagementView(LoginRequiredMixin, View):
    template_name = "admin/user_management.html"

    def get(self, request):
        is_ajax = request.headers.get('X-Requested-With') == 'XMLHttpRequest'
        
        users_list = User.objects.all().order_by('id')

        first_name = request.GET.get('first_name')
        if first_name:
            users_list = users_list.filter(first_name__icontains=first_name)

        last_name = request.GET.get('last_name')
        if last_name:
            users_list = users_list.filter(last_name__icontains=last_name)

        national_code = request.GET.get('national_code')
        if national_code:
            users_list = users_list.filter(national_code__icontains=national_code)

        personnel_code = request.GET.get('personnel_code')
        if personnel_code:
            users_list = users_list.filter(personnel_code__icontains=personnel_code)

        username = request.GET.get('username')
        if username:
            users_list = users_list.filter(username__icontains=username)

        site = request.GET.get('site')
        if site:
            users_list = users_list.filter(site=site)

        department = request.GET.get('department')
        if department:
            users_list = users_list.filter(department=department)

        status = request.GET.get('status')
        if status:
            is_active = status == 'active'
            users_list = users_list.filter(is_active=is_active)

        users = users_list
        
        if is_ajax:
            html = render_to_string(
                'admin/partials/user_table_rows.html',
                {'users': users},
                request=request
            )
            
            return JsonResponse({
                'success': True,
                'html': html,
            })

        return render(
            request,
            self.template_name,
            {"users": users}
        )

    def post(self, request):
        if "add_user" in request.POST:
            try:
                username = request.POST.get("username", "").strip()
                national_code = request.POST.get("national_code", "").strip()
                
                if not username:
                    username = national_code

                extra_limit = request.POST.get("extra_reservation_limit", 0)
                try:
                    extra_reservation_limit = int(extra_limit)
                    if extra_reservation_limit < 0:
                        extra_reservation_limit = 0
                except ValueError:
                    extra_reservation_limit = 0

                User.objects.create_user(
                    national_code=national_code,
                    password=request.POST.get("password") or national_code,
                    first_name=request.POST.get("first_name"),
                    last_name=request.POST.get("last_name"),
                    username=username,
                    personnel_code=request.POST.get("personnel_code"),
                    site=request.POST.get("site"),
                    department=request.POST.get("department"),
                    extra_reservation_limit=extra_reservation_limit, 
                )
                messages.success(request, "کاربر با موفقیت اضافه شد.")

            except IntegrityError:
                messages.error(
                    request,
                    "کد ملی یا کد پرسنلی قبلاً ثبت شده است."
                )
            except Exception as e:
                messages.error(
                    request,
                    f"خطا در ایجاد کاربر: {str(e)}"
                )

        return redirect("accounts:user_management")


class ResetPasswordView(LoginRequiredMixin, View):

    def post(self, request):

        user_id = request.POST.get("user_id")
        new_password = request.POST.get("password")

        user = User.objects.get(id=user_id)

        user.set_password(new_password)
        user.save()

        return JsonResponse({
            "success": True,
            "message": "رمز عبور با موفقیت تغییر کرد."
        })

class EditUserView(LoginRequiredMixin, UserPassesTestMixin, View):
    def test_func(self):
        return self.request.user.is_staff

    def post(self, request):
        try:
            user = User.objects.get(id=request.POST["user_id"])

            user.first_name = request.POST["first_name"]
            user.last_name = request.POST["last_name"]
            user.username = request.POST["username"]
            user.personnel_code = request.POST["personnel_code"]
            user.national_code = request.POST["national_code"]
            user.site = request.POST["site"]
            user.department = request.POST["department"]
            extra_limit = request.POST.get("extra_reservation_limit", 0)
            user.is_active = request.POST.get("is_active") == "true"
            
            try:
                user.extra_reservation_limit = int(extra_limit)
                if user.extra_reservation_limit < 0:
                    user.extra_reservation_limit = 0
            except ValueError:
                user.extra_reservation_limit = 0

            user.save()

            return JsonResponse({
                "success": True,
                "message": "اطلاعات کاربر با موفقیت به‌روزرسانی شد."
            })
            
        except User.DoesNotExist:
            return JsonResponse({
                "success": False,
                "message": "کاربر یافت نشد."
            })
        except Exception as e:
            return JsonResponse({
                "success": False,
                "message": f"خطا: {str(e)}"
            })

class DeleteUserView(LoginRequiredMixin,UserPassesTestMixin,View):

    def test_func(self):
        return self.request.user.is_staff

    def post(self, request):

        user = User.objects.get(id=request.POST["user_id"])

        if user.is_superuser or user.is_staff:
            return JsonResponse({
                "success": False,
                "message": "امکان حذف کردن مدیر اصلی وجود ندارد."
            })

        user.delete()

        return JsonResponse({
            "success": True
        })

class ToggleUserStatusView(LoginRequiredMixin,UserPassesTestMixin,View):

    def test_func(self):
        return self.request.user.is_staff

    def post(self, request):

        user = get_object_or_404(User,id=request.POST["user_id"])

        if user.is_superuser:
            return JsonResponse({
                "success": False,
                "message": "امکان غیرفعال کردن مدیر اصلی وجود ندارد."
            })

        user.is_active = not user.is_active
        user.save()

        return JsonResponse({
            "success": True,
            "is_active": user.is_active,
            "message": (
                "کاربر فعال شد."if user.is_active else "کاربر غیرفعال شد."
            )
        })

class ImportUsersView(LoginRequiredMixin, UserPassesTestMixin, View):
    def test_func(self):
        return self.request.user.is_staff

    def post(self, request):
        excel_file = request.FILES.get('excel_file')
        
        if not excel_file:
            messages.error(request, "لطفاً یک فایل انتخاب کنید.")
            return redirect('accounts:user_management')

        if not excel_file.name.endswith(('.xlsx', '.xls')):
            messages.error(request, "فرمت فایل باید .xlsx یا .xls باشد.")
            return redirect('accounts:user_management')

        try:
            workbook = openpyxl.load_workbook(excel_file)
            sheet = workbook.active

            headers = []
            for cell in sheet[1]:
                headers.append(cell.value)


            header_mapping = {
                'نام': 'first_name',
                'نام خانوادگی': 'last_name',
                'کد ملی': 'national_code',
                'کد پرسنلی': 'personnel_code',
                'نام کاربری': 'username',
                'سایت': 'site',
                'واحد': 'department',
            }

            required_headers = ['نام', 'نام خانوادگی', 'کد ملی', 'کد پرسنلی']
            missing_headers = [h for h in required_headers if h not in headers]
            
            if missing_headers:
                messages.error(
                    request, 
                    f"ستون‌های زیر در فایل وجود ندارند: {', '.join(missing_headers)}"
                )
                return redirect('accounts:user_management')


            header_index = {}
            for idx, header in enumerate(headers):
                if header in header_mapping:
                    header_index[header_mapping[header]] = idx

            created_count = 0
            failed_count = 0
            error_messages = [] 
            
            for row_idx, row in enumerate(sheet.iter_rows(min_row=2, values_only=True), start=2):
                if not any(row):
                    continue
                    
                try:
                    first_name = str(row[header_index.get('first_name', 0)] or '').strip()
                    last_name = str(row[header_index.get('last_name', 1)] or '').strip()
                    national_code = str(row[header_index.get('national_code', 2)] or '').strip()
                    personnel_code = str(row[header_index.get('personnel_code', 3)] or '').strip()
                    
                    username = str(row[header_index.get('username', 4)] or '').strip() if header_index.get('username') is not None else ''
                    site = str(row[header_index.get('site', 5)] or '').strip() if header_index.get('site') is not None else ''
                    department = str(row[header_index.get('department', 6)] or '').strip() if header_index.get('department') is not None else ''

                    if not all([first_name, last_name, national_code, personnel_code]):
                        failed_count += 1
                        error_messages.append(
                            f"⚠️ ردیف {row_idx}: {first_name} {last_name} - داده‌های ضروری کامل نیستند."
                        )
                        continue

                    if User.objects.filter(national_code=national_code).exists():
                        failed_count += 1
                        error_messages.append(
                            f"⚠️ ردیف {row_idx}: {first_name} {last_name} - کد ملی ({national_code}) قبلاً ثبت شده است."
                        )
                        continue

                    if not username:
                        username = national_code

                    original_username = username
                    counter = 1
                    while User.objects.filter(username=username).exists():
                        username = f"{original_username}_{counter}"
                        counter += 1

                    User.objects.create_user(
                        national_code=national_code,
                        password=national_code, 
                        first_name=first_name,
                        last_name=last_name,
                        username=username, 
                        personnel_code=personnel_code,
                        site=site if site else None,
                        department=department,
                        is_active=True,
                    )
                    
                    created_count += 1

                except Exception as e:
                    failed_count += 1
                    error_messages.append(
                        f"⚠️ ردیف {row_idx}: {first_name if 'first_name' in locals() else '-'} - {str(e)}"
                    )

            if created_count > 0:
                messages.success(request, f"✅ {created_count} کاربر با موفقیت ایجاد شدند.")
            
            if failed_count > 0:
                error_text = "<ul class='mb-0'>"
                for msg in error_messages[:10]:
                    error_text += f"<li>{msg}</li>"

                if len(error_messages) > 10:
                    error_text += f"<li>... و {len(error_messages) - 10} خطای دیگر</li>"

                error_text += "</ul>"
                
                messages.warning(
                    request,
                    f"{failed_count} کاربر ایجاد نشدند:{error_text}",
                    extra_tags="safe",
                )

            return redirect('accounts:user_management')

        except Exception as e:
            messages.error(request, f"خطا در خواندن فایل: {str(e)}")
            return redirect('accounts:user_management')