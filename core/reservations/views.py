from django.shortcuts import render
from django.contrib.auth.mixins import LoginRequiredMixin
from django.http import JsonResponse
from django.views import View
from menu.models import DailyMenu
from .models import Reservation

# Create your views here.
class ReservationToggleView(LoginRequiredMixin, View):

    def post(self, request):

        food_date = request.POST.get("food_date")

        if not food_date:
            return JsonResponse({
                "success": False,
                "message": "تاریخ ارسال نشده است."
            })

        try:
            menu = DailyMenu.objects.get(food_date=food_date)

        except DailyMenu.DoesNotExist:
            return JsonResponse({
                "success": False,
                "message": "برای این روز غذایی ثبت نشده است."
            })

        if Reservation.objects.filter(
            user=request.user,
            menu=menu
            ).exists():

            return JsonResponse({
                "success": False,
                "message": "شما قبلاً این غذا را رزرو کرده‌اید."
            })


        # اگر رزرو وجود نداشت → ایجاد رزرو
        Reservation.objects.create(
            user=request.user,
            menu=menu,
        )

        return JsonResponse({
            "success": True,
            "reserved": True,
            "message": "غذا با موفقیت رزرو شد."
        })

class ReservationDeleteView(LoginRequiredMixin, View):

    def post(self, request):

        food_date = request.POST.get("food_date")

        if not food_date:
            return JsonResponse({
                "success": False,
                "message": "تاریخ ارسال نشده است."
            })

        try:
            menu = DailyMenu.objects.get(food_date=food_date)

            reservation = Reservation.objects.get(
                user=request.user,
                menu=menu
            )

        except DailyMenu.DoesNotExist:

            return JsonResponse({
                "success": False,
                "message": "برای این روز غذایی ثبت نشده است."
            })

        except Reservation.DoesNotExist:

            return JsonResponse({
                "success": False,
                "message": "رزروی برای حذف وجود ندارد."
            })

        reservation.delete()

        return JsonResponse({
            "success": True,
            "message": "رزرو با موفقیت لغو شد."
        })

# def adminreservation(request):
#     return render(request,"reservations/admin.html")