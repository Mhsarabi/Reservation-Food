from django.shortcuts import render
from django.views.generic import TemplateView
from django.contrib.auth.mixins import LoginRequiredMixin
from .models import DailyMenu
from reservations.models import Reservation

# Create your views here.
class CalendarView(LoginRequiredMixin, TemplateView):
    template_name = "menu/calendar.html"

    login_url = "login"

    def get_context_data(self,**kwargs):
        context=super().get_context_data(**kwargs)

        menus = DailyMenu.objects.select_related("food").order_by("food_date")

        reserved_ids = set(
            Reservation.objects.filter(
                user=self.request.user
            ).values_list("menu_id", flat=True)
        )

        for menu in menus:
            menu.is_reserved = menu.id in reserved_ids

        context["menus"] = menus

        return context