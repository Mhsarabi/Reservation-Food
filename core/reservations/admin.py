from django.contrib import admin
from .models import Reservation

# Register your models here.
@admin.register(Reservation)
class ReservationAdmin(admin.ModelAdmin):
    list_display=(
        "user",
        "food_date",
        "food_name",
        "status",
        "reserve_time",
    )

    list_filter = (
        "status",
        "menu__food_date",
    )

    search_fields = (
        "user__full_name",
        "user__personnel_code",
        "user__national_code",
    )

    ordering = (
        "-menu__food_date",
    )

    @admin.display(description="تاریخ")
    def food_date(self, obj):
        return obj.menu.food_date

    @admin.display(description="غذا")
    def food_name(self, obj):
        return obj.menu.food.food_name