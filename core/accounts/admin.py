from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import User,UserManager

# Register your models here.
@admin.register(User)
class CustomUserAdmin(UserAdmin):
    model=User

    list_display=(
        "username",
        "first_name",
        "last_name",
        "national_code",
        "personnel_code",
        "site",
        "department",
        "is_active",
        "is_staff",
    )

    list_filter = (
        "is_active",
        "is_staff",
        "is_superuser",
        "site"
    )

    search_fields = (
        "national_code",
        "personnel_code",
        "username",
        "first_name",
        "last_name",
        "site"
    )

    ordering = ("personnel_code",)

    fieldsets=(
        ("اطلاعات ورود",{
            "fields":("national_code","password"),
        }),
        ("اطلاعات پرسنلی",{
            "fields":(
                "personnel_code",
                "username",
                "first_name",
                "last_name",
                "site",
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
                "username",
                "first_name",
                "last_name",
                "site",
                "department",
                "password1",
                "password2",
                "is_active",
                "is_staff",
            ),
        }),
    )
