from django.urls import path
from .views import CalendarView

app_name = "menu"

urlpatterns = [
    path("", CalendarView.as_view(), name="calendar"),
]