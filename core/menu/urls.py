from django.urls import path
from .views import *

app_name = "menu"

urlpatterns = [
    path("", CalendarView.as_view(), name="calendar"),
    path('daily-menus/', DailyMenusAPIView.as_view(), name='daily_menus'),
    path("foods/create/", FoodCreateView.as_view(), name="food_create"),
    path("foods/update/", FoodUpdateView.as_view(), name="food_update"),
    path("foods/list/", FoodListView.as_view(), name="food_list"),
    path("foods/delete/", FoodDeleteView.as_view(), name="food_delete"),
    path('save-daily-food/', SaveDailyFoodView.as_view(), name='save_daily_food'),
    path('delete-daily-food/', DeleteDailyFoodView.as_view(), name='delete_daily_food'), 
    path('save-weekly/', SaveWeeklyFoodView.as_view(), name='save_weekly'),
    path("Alvan/foods/manage/", FoodManagementView.as_view(), name="food_management"),
]