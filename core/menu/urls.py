from django.urls import path
from .views import *

app_name = "menu"

urlpatterns = [
    path("", CalendarView.as_view(), name="calendar"),
    path("foods/create/", FoodCreateView.as_view(), name="food_create"),
    path("foods/update/", FoodUpdateView.as_view(), name="food_update"),
    path("foods/list/", FoodListView.as_view(), name="food_list"), 
]