from django.shortcuts import render
from django.contrib.auth.mixins import LoginRequiredMixin
from django.http import JsonResponse,HttpResponse
from django.contrib.auth.mixins import LoginRequiredMixin, UserPassesTestMixin
from django.views import View
from menu.models import DailyMenu
from .models import Reservation
from datetime import datetime, time,timedelta
from django.utils import timezone
import jalaali
from openpyxl import Workbook
from openpyxl.styles import Font, Alignment, PatternFill
from accounts.models import User

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
    deadline = datetime.combine(menu.food_date - timedelta(days=1), time(23, 59, 59))
    deadline = timezone.make_aware(deadline)
    return timezone.now() >= deadline



class MonthlyReportView(LoginRequiredMixin, UserPassesTestMixin, View):    
    def test_func(self):
        return self.request.user.is_staff
    
    def post(self, request):
        try:
            year = int(request.POST.get('year'))
            month = int(request.POST.get('month'))
            
            if not year or not month:
                return JsonResponse({
                    'success': False,
                    'message': 'لطفاً سال و ماه را انتخاب کنید.'
                })
            
            start_date = jalaali.Jalaali.to_gregorian(year, month, 1)
            end_day = jalaali.Jalaali.jalaali_month_length(year, month)
            end_date = jalaali.Jalaali.to_gregorian(year, month, end_day)
            
            start_date_obj = datetime(
                start_date["gy"],
                start_date["gm"],
                start_date["gd"]
            ).date()

            end_date_obj = datetime(
                end_date["gy"],
                end_date["gm"],
                end_date["gd"]
            ).date()
            
            users = User.objects.filter(is_active=True)
            
            reservations = Reservation.objects.filter(
                menu__food_date__range=[start_date_obj, end_date_obj]
            ).select_related('user', 'menu__food')
            
            report_data = []
            for user in users:
                user_reservations = reservations.filter(user=user)
                count = user_reservations.count()
                

                
                report_data.append({
                    'full_name': user.full_name if hasattr(user, 'full_name') else user.username,
                    'national_code': user.national_code if hasattr(user, 'national_code') else '',
                    'department': user.department if hasattr(user, 'department') else '',
                    'reservation_count': count,
                })
            
            report_data.sort(key=lambda x: x['national_code'], reverse=True)
            
            wb = Workbook()
            ws = wb.active
            ws.sheet_view.rightToLeft = True
            ws.title = f"Monthly_Report_{year}_{month}"
            
            headers = ['ردیف', 'نام کاربر', 'کد ملی', 'دپارتمان', 'تعداد رزرو']
            header_fill = PatternFill(start_color="366092", end_color="366092", fill_type="solid")
            header_font = Font(color="FFFFFF", bold=True)
            
            for col, header in enumerate(headers, 1):
                cell = ws.cell(row=1, column=col, value=header)
                cell.fill = header_fill
                cell.font = header_font
                cell.alignment = Alignment(horizontal='center')
            
            for row, data in enumerate(report_data, 2):
                ws.cell(row=row, column=1, value=row-1)
                ws.cell(row=row, column=2, value=data['full_name'])
                ws.cell(row=row, column=3, value=data['national_code'])
                ws.cell(row=row, column=4, value=data['department'])
                ws.cell(row=row, column=5, value=data['reservation_count'])
            
            ws.column_dimensions['A'].width = 8
            ws.column_dimensions['B'].width = 20
            ws.column_dimensions['C'].width = 15
            ws.column_dimensions['D'].width = 20
            ws.column_dimensions['E'].width = 15
            ws.column_dimensions['F'].width = 40
            
            response = HttpResponse(
                content_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
            )
            filename = f"monthly_report_{year}_{month}.xlsx"
            response['Content-Disposition'] = f'attachment; filename="{filename}"'
            
            wb.save(response)
            return response
            
        except Exception as e:
            print(f"error: {str(e)}")
            return JsonResponse({
                'success': False,
                'message': f'خطا در ایجاد گزارش: {str(e)}'
            })


class RangeReportView(LoginRequiredMixin, UserPassesTestMixin, View):    
    def test_func(self):
        return self.request.user.is_staff
    
    def post(self, request):
        try:
            from_date = request.POST.get('from_date')  
            to_date = request.POST.get('to_date')      
            
            if not from_date or not to_date:
                return JsonResponse({
                    'success': False,
                    'message': 'لطفاً بازه زمانی را مشخص کنید.'
                })
            
            from_parts = from_date.split('/')
            to_parts = to_date.split('/')
            
            from_greg = jalaali.Jalaali.to_gregorian(
                int(from_parts[0]),
                int(from_parts[1]),
                int(from_parts[2])
            )

            to_greg = jalaali.Jalaali.to_gregorian(
                int(to_parts[0]),
                int(to_parts[1]),
                int(to_parts[2])
            )

            start_date_obj = datetime(
                from_greg["gy"],
                from_greg["gm"],
                from_greg["gd"]
            ).date()

            end_date_obj = datetime(
                to_greg["gy"],
                to_greg["gm"],
                to_greg["gd"]
            ).date()
            
            
            if start_date_obj > end_date_obj:
                return JsonResponse({
                    'success': False,
                    'message': 'تاریخ شروع نباید از تاریخ پایان بزرگتر باشد.'
                })
            
            users = User.objects.filter(is_active=True)
            
            reservations = Reservation.objects.filter(
                menu__food_date__range=[start_date_obj, end_date_obj]
            ).select_related('user', 'menu__food')
            
            report_data = []
            for user in users:
                user_reservations = reservations.filter(user=user)
                count = user_reservations.count()
                                
                report_data.append({
                    'full_name': user.full_name if hasattr(user, 'full_name') else user.username,
                    'national_code': user.national_code if hasattr(user, 'national_code') else '',
                    'department': user.department if hasattr(user, 'department') else '',
                    'reservation_count': count,
                })
            
            report_data.sort(key=lambda x: x['national_code'], reverse=True)
            
            wb = Workbook()
            ws = wb.active
            ws.sheet_view.rightToLeft = True
            
            
            headers = ['ردیف', 'نام کاربر', 'کد ملی', 'دپارتمان', 'تعداد رزرو']
            header_fill = PatternFill(start_color="366092", end_color="366092", fill_type="solid")
            header_font = Font(color="FFFFFF", bold=True)
            
            for col, header in enumerate(headers, 1):
                cell = ws.cell(row=1, column=col, value=header)
                cell.fill = header_fill
                cell.font = header_font
                cell.alignment = Alignment(horizontal='center')
            
            for row, data in enumerate(report_data, 2):
                ws.cell(row=row, column=1, value=row-1)
                ws.cell(row=row, column=2, value=data['full_name'])
                ws.cell(row=row, column=3, value=data['national_code'])
                ws.cell(row=row, column=4, value=data['department'])
                ws.cell(row=row, column=5, value=data['reservation_count'])    

            ws.column_dimensions['A'].width = 8
            ws.column_dimensions['B'].width = 20
            ws.column_dimensions['C'].width = 15
            ws.column_dimensions['D'].width = 20
            ws.column_dimensions['E'].width = 15
            ws.column_dimensions['F'].width = 40
            
            response = HttpResponse(
                content_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
            )
            clean_from = from_date.replace('/', '-')
            clean_to = to_date.replace('/', '-')
            ws.title = f"Range_Report_{clean_from}_to_{clean_to}"
            filename = f"range_report_{clean_from}_to_{clean_to}.xlsx"
            response['Content-Disposition'] = f'attachment; filename="{filename}"'
            
            wb.save(response)
            return response
            
        except Exception as e:
            print(f"error: {str(e)}")
            return JsonResponse({
                'success': False,
                'message': f'errors in reaporing: {str(e)}'
            })