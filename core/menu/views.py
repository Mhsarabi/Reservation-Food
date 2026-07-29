from django.shortcuts import render
from django.views.generic import TemplateView
from django.contrib.auth.mixins import LoginRequiredMixin

# Create your views here.
class CalendarView(LoginRequiredMixin, TemplateView):
    template_name = "menu/calendar.html"

    login_url = "login"