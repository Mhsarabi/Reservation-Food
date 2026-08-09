from django.contrib import admin
from .models import DailyMenu,Food
from django.utils.html import format_html


# Register your models here.
@admin.register(Food)
class FoodAdmin(admin.ModelAdmin):
    list_display = (
        'id',
        'food_name',
        'food_image_preview',
        'created_at',
        'updated_at',
    )
    
    list_filter = (
        'created_at',
        'updated_at',
    )
    
    search_fields = (
        'food_name',
    )
    
    ordering = (
        'food_name',
    )
    
    fieldsets = (
        ('اطلاعات اصلی', {
            'fields': ('food_name', 'food_image')
        }),
        ('تاریخ‌ها', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)  
        }),
    )
    
    readonly_fields = (
        'created_at',
        'updated_at',
    )
    
    def food_image_preview(self, obj):
        if obj.food_image:
            return format_html(
                '<img src="{}" style="width:50px;height:50px;object-fit:cover;border-radius:8px;" />',
                obj.food_image.url
            )
        return '-'
    
    food_image_preview.short_description = 'تصویر'


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