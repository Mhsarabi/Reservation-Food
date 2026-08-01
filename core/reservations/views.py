from django.shortcuts import render
from django.contrib.auth.mixins import LoginRequiredMixin
from django.http import JsonResponse
from django.views import View
from menu.models import DailyMenu
from .models import Reservation
from datetime import datetime, time,timedelta
from django.utils import timezone

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

        if reservation_is_closed(menu):
            return JsonResponse({
                "success": False,
                "message": "مهلت رزرو این غذا به پایان رسیده است."
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
            if reservation_is_closed(menu):
                return JsonResponse({
                    "success": False,
                    "message": "مهلت لغو رزرو به پایان رسیده است."
            })


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


class ReservationReserveMonthView(LoginRequiredMixin, View):

    def post(self, request):
        start_date = request.POST.get("start_date")
        end_date = request.POST.get("end_date")


        if not start_date or not end_date:
            return JsonResponse({
                "success": False,
                "message": "سال یا ماه ارسال نشده است."
            })

        menus = DailyMenu.objects.filter(food_date__range=[start_date, end_date])

        created = 0

        for menu in menus:
            if reservation_is_closed(menu):
                continue
            _, is_created = Reservation.objects.get_or_create(
                user=request.user,
                menu=menu
            )

            if is_created:
                created += 1
            

        return JsonResponse({
            "success": True,
            "created": created,
            "message": "رزروهای ماه با موفقیت انجام شد."
        })


class ReservationCancelMonthView(LoginRequiredMixin, View):

    def post(self, request):

        start_date = request.POST.get("start_date")
        end_date = request.POST.get("end_date")

        if not start_date or not end_date:
            return JsonResponse({
                "success": False,
                "message": "بازه تاریخ ارسال نشده است."
            })

        reservations = Reservation.objects.filter(
            user=request.user,
            menu__food_date__range=[start_date, end_date],
        )

        deleted = 0

        for reservation in reservations:
            if reservation_is_closed(reservation.menu):
                continue

            reservation.delete()
            deleted += 1

        return JsonResponse({
            "success": True,
            "deleted": deleted,
            "message": "رزروهای ماه لغو شد."
        })


def reservation_is_closed(menu):
    """
    اگر وارد روز غذا شده باشیم، رزرو بسته است.
    """
    deadline = datetime.combine(menu.food_date - timedelta(days=1), time(23, 59, 59))
    deadline = timezone.make_aware(deadline)
    return timezone.now() >= deadline