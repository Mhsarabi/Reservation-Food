from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import User,UserManager

# Register your models here.
@admin.register(User)
class CustomUserAdmin(UserAdmin):
    model=User

    list_display=(
        "national_code",
        "personnel_code",
        "full_name",
        "department",
        "is_active",
        "is_staff",
    )

    list_filter = (
        "is_active",
        "is_staff",
        "is_superuser",
    )

    search_fields = (
        "national_code",
        "personnel_code",
        "full_name",
    )

    ordering = ("personnel_code",)

    fieldsets=(
        ("اطلاعات ورود",{
            "fields":("national_code","password"),
        }),
        ("اطلاعات پرسنلی",{
            "fields":(
                "personnel_code",
                "full_name",
                "department",
            ),
        }),
        ("دسترسی ها",{
            "fields":(
                "is_active",
                "is_staff",
                "is_superuser",
                "groups",
                "user_permissions",
            ),
        }),
        ("تاریخ های مهم",{
            "fields":("last_login",),
        }),
    )

    add_fieldsets = (
        ("ایجاد کاربر", {
            "classes": ("wide",),
            "fields": (
                "national_code",
                "personnel_code",
                "full_name",
                "department",
                "password1",
                "password2",
                "is_active",
                "is_staff",
            ),
        }),
    )
