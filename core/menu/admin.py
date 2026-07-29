from django.contrib import admin
from .models import DailyMenu

# Register your models here.
@admin.register(DailyMenu)
class DailyMenuAdmin(admin.ModelAdmin):
    list_display=(
        "food_date",
        "food"
    )

    list_filter=(
        "food_date",
    )

    search_fields=(
        "food__food_name",
    )

    ordering=(
        "food_date",
    )