from django.shortcuts import render, redirect, get_object_or_404
from django.contrib.auth.mixins import LoginRequiredMixin, UserPassesTestMixin
from django.template.loader import render_to_string
from django.http import JsonResponse, HttpResponse
from django.views import View
from menu.models import DailyMenu
from .models import Reservation
from datetime import datetime, time, timedelta, date
from django.utils import timezone
from django.contrib import messages
from django.db import models
from jalaali import Jalaali
from openpyxl import Workbook
from openpyxl.styles import Font, Alignment, PatternFill
from accounts.models import User


# ============================================================
# توابع کمکی جلالی (یکپارچه)
# ============================================================

def jalali_to_gregorian(year, month, day):
    """
    تبدیل تاریخ شمسی به میلادی
    ورودی: سال، ماه، روز شمسی
    خروجی: datetime.date میلادی
    """
    result = Jalaali.to_gregorian(year, month, day)
    return date(
        result['gy'],
        result['gm'],
        result['gd']
    )


def gregorian_to_jalali(year, month, day):
    """
    تبدیل تاریخ میلادی به شمسی
    ورودی: سال، ماه، روز میلادی
    خروجی: dict با کلیدهای jy, jm, jd
    """
    return Jalaali.to_jalaali(year, month, day)


def get_jalali_month_last_day(year, month):
    """
    دریافت آخرین روز ماه شمسی
    ورودی: سال و ماه شمسی
    خروجی: تعداد روزهای آن ماه
    """
    if month <= 6:
        return 31
    elif month <= 11:
        return 30
    else:  # اسفند
        if Jalaali.is_leap_jalaali_year(year):
            return 30
        return 29


def jalali_month_range(year, month):
    """
    دریافت بازه کامل یک ماه شمسی
    ورودی: سال و ماه شمسی
    خروجی: (تاریخ شروع میلادی, تاریخ پایان میلادی)
    """
    start = jalali_to_gregorian(year, month, 1)
    last_day = get_jalali_month_last_day(year, month)
    end = jalali_to_gregorian(year, month, last_day)
    return start, end


def jalali_year_range(year):
    """
    دریافت بازه کامل یک سال شمسی
    ورودی: سال شمسی
    خروجی: (تاریخ شروع میلادی, تاریخ پایان میلادی)
    """
    start = jalali_to_gregorian(year, 1, 1)
    last_day = get_jalali_month_last_day(year, 12)
    end = jalali_to_gregorian(year, 12, last_day)
    return start, end


def parse_jalali_date(jalali_date_str):
    """
    تبدیل رشته تاریخ شمسی (1403/05/12) به datetime.date
    ورودی: رشته تاریخ شمسی با فرمت YYYY/MM/DD
    خروجی: datetime.date میلادی
    """
    try:
        year, month, day = map(int, jalali_date_str.strip().split('/'))
        return jalali_to_gregorian(year, month, day)
    except (ValueError, TypeError, KeyError):
        return None


def get_jalali_years_from_db():
    """
    دریافت لیست سال‌های شمسی موجود در دیتابیس
    خروجی: لیست سال‌های شمسی به صورت مرتب شده
    """
    gregorian_years = (
        DailyMenu.objects
        .dates('food_date', 'year')
        .values_list('food_date__year', flat=True)
        .distinct()
        .order_by('-food_date__year')
    )
    
    years = set()
    for gregorian_year in gregorian_years:
        try:
            jalali_year = gregorian_to_jalali(gregorian_year, 1, 1)['jy']
            years.add(jalali_year)
        except Exception:
            pass
    
    if not years:
        # اگر سالی وجود نداشت، سال جاری را اضافه کن
        today = date.today()
        jalali_today = gregorian_to_jalali(today.year, today.month, today.day)
        years = {jalali_today['jy']}
    
    return sorted(years, reverse=True)


# ============================================================
# توابع کمکی
# ============================================================

def reservation_is_closed(menu):
    """بررسی بسته بودن زمان رزرو"""
    deadline = datetime.combine(
        menu.food_date - timedelta(days=1),
        time(23, 59, 59)
    )
    deadline = timezone.make_aware(deadline)
    return timezone.now() >= deadline


# ============================================================
# ویوهای کاربر
# ============================================================

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
        
        if Reservation.objects.filter(user=request.user, menu=menu).exists():
            return JsonResponse({
                "success": False,
                "message": "شما قبلاً این غذا را رزرو کرده‌اید."
            })
        
        Reservation.objects.create(user=request.user, menu=menu)
        
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
        
        menus = DailyMenu.objects.filter(
            food_date__range=[start_date, end_date]
        )
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
            menu__food_date__range=[start_date, end_date]
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


# ============================================================
# ویوهای مدیریتی (ادمین)
# ============================================================

class ReservationManagementView(LoginRequiredMixin, UserPassesTestMixin, View):
    template_name = "admin/reservation_management.html"
    
    def test_func(self):
        return self.request.user.is_staff

    # ============================================================
    # تبدیل تاریخ میلادی به شمسی
    # ============================================================
    @staticmethod
    def gregorian_to_jalali(gregorian_date):
        """تبدیل تاریخ میلادی به تاریخ شمسی"""

        result = Jalaali.to_jalaali(
            gregorian_date.year,
            gregorian_date.month,
            gregorian_date.day
        )

        return (
            f"{result['jy']:04d}/"
            f"{result['jm']:02d}/"
            f"{result['jd']:02d}"
        )
    # ============================================================
    # تبدیل تاریخ و ساعت میلادی به شمسی
    # ============================================================
    @staticmethod
    def gregorian_datetime_to_jalali(gregorian_datetime):
        """تبدیل تاریخ و ساعت میلادی به شمسی"""

        result = Jalaali.to_jalaali(
            gregorian_datetime.year,
            gregorian_datetime.month,
            gregorian_datetime.day
        )

        return (
            f"{result['jy']:04d}/"
            f"{result['jm']:02d}/"
            f"{result['jd']:02d} "
            f"{gregorian_datetime.hour:02d}:"
            f"{gregorian_datetime.minute:02d}"
        )
    
    # ============================================================
    # دریافت رزروهای فیلتر شده
    # ============================================================
    def get_filtered_reservations(self, request):
        """دریافت لیست رزروها با اعمال فیلترها"""
        reservations_list = (
            Reservation.objects
            .all()
            .select_related('user', 'menu', 'menu__food')
            .order_by('-reserve_time')
        )
        
        # ========================================================
        # فیلتر بر اساس اطلاعات کاربر
        # ========================================================
        user_filter = models.Q()
        has_user_filter = False
        
        first_name = request.GET.get('first_name')
        if first_name:
            user_filter &= models.Q(user__first_name__icontains=first_name)
            has_user_filter = True
        
        last_name = request.GET.get('last_name')
        if last_name:
            user_filter &= models.Q(user__last_name__icontains=last_name)
            has_user_filter = True
        
        national_code = request.GET.get('national_code')
        if national_code:
            user_filter &= models.Q(user__national_code__icontains=national_code)
            has_user_filter = True
        
        if has_user_filter:
            reservations_list = reservations_list.filter(user_filter)
        
        # ========================================================
        # فیلتر بر اساس غذا
        # ========================================================
        food_name = request.GET.get('food_name')
        if food_name:
            reservations_list = reservations_list.filter(
                menu__food__food_name__icontains=food_name
            )
        
        # ========================================================
        #  فیلتر بر اساس سال و ماه شمسی
        # ========================================================
        year = request.GET.get('year')
        month = request.GET.get('month')
        
        try:
            if year and month:
                start_date, end_date = jalali_month_range(int(year), int(month))
                reservations_list = reservations_list.filter(
                    menu__food_date__range=[start_date, end_date]
                )
            elif year:
                start_date, end_date = jalali_year_range(int(year))
                reservations_list = reservations_list.filter(
                    menu__food_date__range=[start_date, end_date]
                )
        except (ValueError, TypeError):
            pass
        
        # ========================================================
        #  فیلتر بر اساس بازه زمانی (از تاریخ - تا تاریخ)
        # ========================================================
        from_date = request.GET.get('from_date')
        to_date = request.GET.get('to_date')
        
        if from_date:
            from_greg = parse_jalali_date(from_date)
            if from_greg:
                reservations_list = reservations_list.filter(
                    menu__food_date__gte=from_greg
                )
        
        if to_date:
            to_greg = parse_jalali_date(to_date)
            if to_greg:
                reservations_list = reservations_list.filter(
                    menu__food_date__lte=to_greg
                )
        
        return reservations_list
    
    # ============================================================
    # تولید فایل اکسل
    # ============================================================
    def export_to_excel(self, reservations):
        """تولید فایل اکسل از لیست رزروها"""
        wb = Workbook()
        ws = wb.active
        ws.sheet_view.rightToLeft = True
        ws.title = "لیست رزروها"
        
        # ستون‌های هماهنگ با تمپلیت
        headers = ['ردیف', 'نام', 'نام خانوادگی', 'کد ملی', 'غذا', 'تاریخ رزرو', 'تاریخ ارائه غذا']
        header_fill = PatternFill(start_color="366092", end_color="366092", fill_type="solid")
        header_font = Font(color="FFFFFF", bold=True)
        
        for col, header in enumerate(headers, 1):
            cell = ws.cell(row=1, column=col, value=header)
            cell.fill = header_fill
            cell.font = header_font
            cell.alignment = Alignment(horizontal='center', vertical='center')
        
        for row, reservation in enumerate(reservations, 2):
            ws.cell(row=row, column=1, value=row-1)
            ws.cell(row=row, column=2, value=reservation.user.first_name)
            ws.cell(row=row, column=3, value=reservation.user.last_name)
            ws.cell(row=row, column=4, value=reservation.user.national_code)
            ws.cell(row=row, column=5, value=reservation.menu.food.food_name)
            # ========================================================
            # تبدیل تاریخ‌ها به شمسی
            # ========================================================
            reserve_time_jalali = self.gregorian_datetime_to_jalali(reservation.reserve_time)

            food_date_jalali = self.gregorian_to_jalali(reservation.menu.food_date)

            ws.cell(row=row,column=6,value=reserve_time_jalali)

            ws.cell(row=row,column=7,value=food_date_jalali)
            
            for col in range(1, 8):
                ws.cell(row=row, column=col).alignment = Alignment(horizontal='center', vertical='center')
        
        # تنظیم عرض ستون‌ها
        ws.column_dimensions['A'].width = 6
        ws.column_dimensions['B'].width = 20
        ws.column_dimensions['C'].width = 20
        ws.column_dimensions['D'].width = 15
        ws.column_dimensions['E'].width = 25
        ws.column_dimensions['F'].width = 20
        ws.column_dimensions['G'].width = 20
        
        return wb
    
    # ============================================================
    # GET
    # ============================================================
    def get(self, request):
        # بررسی درخواست اکسل
        if request.GET.get('export') == 'excel':
            reservations = self.get_filtered_reservations(request)
            wb = self.export_to_excel(reservations)
            
            response = HttpResponse(
                content_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
            )
            filename = f"reservations_{datetime.now().strftime('%Y%m%d_%H%M%S')}.xlsx"
            response['Content-Disposition'] = f'attachment; filename="{filename}"'
            wb.save(response)
            return response
        
        is_ajax = request.headers.get('X-Requested-With') == 'XMLHttpRequest'
        
        # دریافت رزروهای فیلتر شده
        reservations_list = self.get_filtered_reservations(request)
        
        # داده‌های مورد نیاز برای فرم‌ها
        users = (
            User.objects
            .filter(is_active=True)
            .order_by('first_name', 'last_name')
        )
        
        menus = (
            DailyMenu.objects
            .select_related('food')
            .order_by('-food_date')
        )
        
        years = get_jalali_years_from_db()
        
        # پاسخ AJAX
        if is_ajax:
            html = render_to_string(
                'admin/partials/reservation_table_rows.html',
                {
                    'reservations': reservations_list,
                    'users': users,
                    'menus': menus
                },
                request=request
            )
            
            return JsonResponse({
                'success': True,
                'html': html,
                'total': reservations_list.count(),
            })
        
        return render(
            request,
            self.template_name,
            {
                'reservations': reservations_list,
                'users': users,
                'menus': menus,
                'years': years,
            }
        )
    
    # ============================================================
    # POST
    # ============================================================
    def post(self, request):
        if "add_reservation" in request.POST:
            try:
                user_id = request.POST.get("user_id")
                menu_id = request.POST.get("menu_id")
                
                if not user_id or not menu_id:
                    messages.error(
                        request,
                        "لطفاً کاربر و تاریخ را انتخاب کنید."
                    )
                    return redirect("reservations:reservation_management")
                
                if Reservation.objects.filter(
                    user_id=user_id,
                    menu_id=menu_id
                ).exists():
                    messages.error(
                        request,
                        "این کاربر قبلاً برای این تاریخ رزرو کرده است."
                    )
                    return redirect("reservations:reservation_management")
                
                Reservation.objects.create(
                    user_id=user_id,
                    menu_id=menu_id
                )
                messages.success(request, "رزرو با موفقیت اضافه شد.")
                
            except Exception as e:
                messages.error(request, f"خطا در ایجاد رزرو: {str(e)}")
        
        return redirect("reservations:reservation_management")
    
class DeleteReservationView(LoginRequiredMixin, UserPassesTestMixin, View):
    def test_func(self):
        return self.request.user.is_staff
    
    def post(self, request):
        try:
            reservation_id = request.POST.get('reservation_id')
            reservation = get_object_or_404(Reservation, id=reservation_id)
            reservation.delete()
            
            return JsonResponse({
                'success': True,
                'message': 'رزرو با موفقیت حذف شد.'
            })
        except Exception as e:
            return JsonResponse({
                'success': False,
                'message': f'خطا: {str(e)}'
            })


# ============================================================
# ویوهای گزارش‌گیری
# ============================================================

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
            
            # استفاده از توابع یکپارچه جلالی
            start_date = jalali_to_gregorian(year, month, 1)
            last_day = get_jalali_month_last_day(year, month)
            end_date = jalali_to_gregorian(year, month, last_day)
            
            users = User.objects.filter(is_active=True)
            
            reservations = Reservation.objects.filter(
                menu__food_date__range=[start_date, end_date]
            ).select_related('user', 'menu__food')
            
            report_data = []
            for user in users:
                user_reservations = reservations.filter(user=user)
                count = user_reservations.count()
                
                report_data.append({
                    'first_name': user.first_name,
                    'last_name': user.last_name,
                    'username': user.username,
                    'national_code': user.national_code,
                    'personnel_code': user.personnel_code,
                    'site': user.site or '-',
                    'department': user.department or '-',
                    'reservation_count': count,
                })
            
            report_data.sort(key=lambda x: x['national_code'], reverse=True)
            
            # ایجاد فایل اکسل
            wb = Workbook()
            ws = wb.active
            ws.sheet_view.rightToLeft = True
            ws.title = f"Monthly_Report_{year}_{month}"
            
            headers = ['ردیف', 'نام', 'نام خانوادگی', 'نام کاربری', 'کد ملی', 'کد پرسنلی', 'سایت', 'دپارتمان', 'تعداد رزرو']
            header_fill = PatternFill(start_color="366092", end_color="366092", fill_type="solid")
            header_font = Font(color="FFFFFF", bold=True)
            
            for col, header in enumerate(headers, 1):
                cell = ws.cell(row=1, column=col, value=header)
                cell.fill = header_fill
                cell.font = header_font
                cell.alignment = Alignment(horizontal='center')
            
            for row, data in enumerate(report_data, 2):
                ws.cell(row=row, column=1, value=row-1)
                ws.cell(row=row, column=2, value=data['first_name'])
                ws.cell(row=row, column=3, value=data['last_name'])
                ws.cell(row=row, column=4, value=data['username'])
                ws.cell(row=row, column=5, value=data['national_code'])
                ws.cell(row=row, column=6, value=data['personnel_code'])
                ws.cell(row=row, column=7, value=data['site'])
                ws.cell(row=row, column=8, value=data['department'])
                ws.cell(row=row, column=9, value=data['reservation_count'])
            
            ws.column_dimensions['A'].width = 6
            ws.column_dimensions['B'].width = 20
            ws.column_dimensions['C'].width = 20
            ws.column_dimensions['D'].width = 20
            ws.column_dimensions['E'].width = 20
            ws.column_dimensions['F'].width = 15
            ws.column_dimensions['G'].width = 15
            ws.column_dimensions['H'].width = 15
            ws.column_dimensions['I'].width = 20
            
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
            
            # تبدیل تاریخ‌های شمسی به میلادی
            start_date = parse_jalali_date(from_date)
            end_date = parse_jalali_date(to_date)
            
            if not start_date or not end_date:
                return JsonResponse({
                    'success': False,
                    'message': 'فرمت تاریخ وارد شده صحیح نیست.'
                })
            
            if start_date > end_date:
                return JsonResponse({
                    'success': False,
                    'message': 'تاریخ شروع نباید از تاریخ پایان بزرگتر باشد.'
                })
            
            users = User.objects.filter(is_active=True)
            
            reservations = Reservation.objects.filter(
                menu__food_date__range=[start_date, end_date]
            ).select_related('user', 'menu__food')
            
            report_data = []
            for user in users:
                user_reservations = reservations.filter(user=user)
                count = user_reservations.count()
                
                report_data.append({
                    'first_name': user.first_name,
                    'last_name': user.last_name,
                    'username': user.username,
                    'national_code': user.national_code,
                    'personnel_code': user.personnel_code,
                    'site': user.site or '-',
                    'department': user.department or '-',
                    'reservation_count': count,
                })
            
            report_data.sort(key=lambda x: x['national_code'], reverse=True)
            
            # ایجاد فایل اکسل
            wb = Workbook()
            ws = wb.active
            ws.sheet_view.rightToLeft = True
            
            headers = ['ردیف', 'نام', 'نام خانوادگی', 'نام کاربری', 'کد ملی', 'کد پرسنلی', 'سایت', 'دپارتمان', 'تعداد رزرو']
            header_fill = PatternFill(start_color="366092", end_color="366092", fill_type="solid")
            header_font = Font(color="FFFFFF", bold=True)
            
            for col, header in enumerate(headers, 1):
                cell = ws.cell(row=1, column=col, value=header)
                cell.fill = header_fill
                cell.font = header_font
                cell.alignment = Alignment(horizontal='center')
            
            for row, data in enumerate(report_data, 2):
                ws.cell(row=row, column=1, value=row-1)
                ws.cell(row=row, column=2, value=data['first_name'])
                ws.cell(row=row, column=3, value=data['last_name'])
                ws.cell(row=row, column=4, value=data['username'])
                ws.cell(row=row, column=5, value=data['national_code'])
                ws.cell(row=row, column=6, value=data['personnel_code'])
                ws.cell(row=row, column=7, value=data['site'])
                ws.cell(row=row, column=8, value=data['department'])
                ws.cell(row=row, column=9, value=data['reservation_count'])
            
            ws.column_dimensions['A'].width = 6
            ws.column_dimensions['B'].width = 20
            ws.column_dimensions['C'].width = 20
            ws.column_dimensions['D'].width = 20
            ws.column_dimensions['E'].width = 20
            ws.column_dimensions['F'].width = 15
            ws.column_dimensions['G'].width = 15
            ws.column_dimensions['H'].width = 15
            ws.column_dimensions['I'].width = 20
            
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
                'message': f'خطا در ایجاد گزارش: {str(e)}'
            })