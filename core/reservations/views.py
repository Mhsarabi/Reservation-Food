from django.shortcuts import redirect, get_object_or_404, render
from django.contrib.auth.mixins import LoginRequiredMixin, UserPassesTestMixin
from django.template.loader import render_to_string
from django.http import JsonResponse, HttpResponse
from django.views import View
from django.contrib import messages
from django.utils import timezone

from datetime import datetime, time, timedelta, date

from openpyxl import Workbook
from openpyxl.styles import Font, Alignment, PatternFill, Border, Side
from jalaali import Jalaali
from urllib.parse import quote

from menu.models import DailyMenu
from accounts.models import User
from .models import Reservation


# ============================================================
# Date functions
# ============================================================

def to_gregorian(year, month, day):
    result = Jalaali.to_gregorian(year, month, day)
    return date(result["gy"], result["gm"], result["gd"])


def to_jalali(year, month, day):
    return Jalaali.to_jalaali(year, month, day)


def get_month_last_day(year, month):
    if month <= 6:
        return 31
    if month <= 11:
        return 30
    return 30 if Jalaali.is_leap_jalaali_year(year) else 29


def get_month_range(year, month):
    start = to_gregorian(year, month, 1)
    end = to_gregorian(year, month, get_month_last_day(year, month))
    return start, end


def get_year_range(year):
    start = to_gregorian(year, 1, 1)
    end = to_gregorian(year, 12, get_month_last_day(year, 12))
    return start, end


def parse_jalali_date(date_str):
    try:
        year, month, day = map(int, date_str.strip().replace("-", "/").split("/"))
        return to_gregorian(year, month, day)
    except (ValueError, TypeError, KeyError):
        return None


def get_current_jalali():
    today = date.today()
    result = to_jalali(today.year, today.month, today.day)
    return result["jy"], result["jm"]


def get_available_years():
    years = set()
    menu_dates = DailyMenu.objects.dates("food_date", "year").values_list("food_date__year", flat=True)
    for gregorian_year in menu_dates:
        try:
            jalali_year = to_jalali(gregorian_year, 1, 1)["jy"]
            years.add(jalali_year)
        except Exception:
            continue
    if not years:
        years.add(get_current_jalali()[0])
    return sorted(years, reverse=True)


def is_reservation_closed(menu):
    deadline = datetime.combine(menu.food_date - timedelta(days=1), time(23, 59, 59))
    deadline = timezone.make_aware(deadline)
    return timezone.now() >= deadline


# ============================================================
# Excel styling function
# ============================================================

def apply_border(cell, border_style='thin'):
    side = Side(border_style=border_style, color='000000')
    cell.border = Border(
        left=side,
        right=side,
        top=side,
        bottom=side
    )
    return cell


def apply_header_style(cell):
    cell.fill = PatternFill(
        start_color="366092",
        end_color="366092",
        fill_type="solid"
    )
    cell.font = Font(
        color="FFFFFF",
        bold=True
    )
    cell.alignment = Alignment(
        horizontal="center",
        vertical="center"
    )
    apply_border(cell)
    return cell


def apply_cell_style(cell):
    cell.alignment = Alignment(
        horizontal="center",
        vertical="center"
    )
    apply_border(cell)
    return cell


# ============================================================
# filter for date
# ============================================================

def apply_date_filters(qs, request, date_field):
    year = request.GET.get("year")
    month = request.GET.get("month")

    if year:
        try:
            year = int(year)
            if month:
                month = int(month)
                start, end = get_month_range(year, month)
                qs = qs.filter(**{f"{date_field}__range": [start, end]})
            else:
                start, end = get_year_range(year)
                qs = qs.filter(**{f"{date_field}__range": [start, end]})
        except (ValueError, TypeError):
            pass

    from_date = request.GET.get("from_date")
    if from_date:
        start_date = parse_jalali_date(from_date)
        if start_date:
            qs = qs.filter(**{f"{date_field}__gte": start_date})

    to_date = request.GET.get("to_date")
    if to_date:
        end_date = parse_jalali_date(to_date)
        if end_date:
            qs = qs.filter(**{f"{date_field}__lte": end_date})

    return qs


# ============================================================
# Operations for reserve
# ============================================================

class ReservationToggleView(LoginRequiredMixin, View):
    def post(self, request):
        food_date = request.POST.get("food_date")
        if not food_date:
            return JsonResponse({"success": False, "message": "تاریخ ارسال نشده است."})

        try:
            menu = DailyMenu.objects.get(food_date=food_date)
        except DailyMenu.DoesNotExist:
            return JsonResponse({"success": False, "message": "برای این روز غذایی ثبت نشده است."})

        if is_reservation_closed(menu):
            return JsonResponse({"success": False, "message": "مهلت رزرو به پایان رسیده است."})

        if Reservation.objects.filter(user=request.user, menu=menu).exists():
            return JsonResponse({"success": False, "message": "شما قبلاً این غذا را رزرو کرده‌اید."})

        Reservation.objects.create(user=request.user, menu=menu)
        return JsonResponse({"success": True, "reserved": True, "message": "غذا با موفقیت رزرو شد."})


class ReservationDeleteView(LoginRequiredMixin, View):
    def post(self, request):
        food_date = request.POST.get("food_date")
        if not food_date:
            return JsonResponse({"success": False, "message": "تاریخ ارسال نشده است."})

        try:
            menu = DailyMenu.objects.get(food_date=food_date)
        except DailyMenu.DoesNotExist:
            return JsonResponse({"success": False, "message": "برای این روز غذایی ثبت نشده است."})

        if is_reservation_closed(menu):
            return JsonResponse({"success": False, "message": "مهلت لغو رزرو به پایان رسیده است."})

        try:
            reservation = Reservation.objects.get(user=request.user, menu=menu)
            reservation.delete()
            return JsonResponse({"success": True, "message": "رزرو با موفقیت لغو شد."})
        except Reservation.DoesNotExist:
            return JsonResponse({"success": False, "message": "رزروی برای حذف وجود ندارد."})


class ReservationReserveMonthView(LoginRequiredMixin, View):
    def post(self, request):
        start_date = request.POST.get("start_date")
        end_date = request.POST.get("end_date")
        if not start_date or not end_date:
            return JsonResponse({"success": False, "message": "بازه تاریخ ارسال نشده است."})

        menus = DailyMenu.objects.filter(food_date__range=[start_date, end_date])
        created = 0
        for menu in menus:
            if is_reservation_closed(menu):
                continue
            _, is_created = Reservation.objects.get_or_create(user=request.user, menu=menu)
            if is_created:
                created += 1

        return JsonResponse({"success": True, "created": created, "message": "رزروهای ماه با موفقیت انجام شد."})


class ReservationCancelMonthView(LoginRequiredMixin, View):
    def post(self, request):
        start_date = request.POST.get("start_date")
        end_date = request.POST.get("end_date")
        if not start_date or not end_date:
            return JsonResponse({"success": False, "message": "بازه تاریخ ارسال نشده است."})

        reservations = Reservation.objects.filter(
            user=request.user,
            menu__food_date__range=[start_date, end_date]
        )
        deleted = 0
        for reservation in reservations:
            if is_reservation_closed(reservation.menu):
                continue
            reservation.delete()
            deleted += 1

        return JsonResponse({"success": True, "deleted": deleted, "message": "رزروهای ماه لغو شد."})


# ============================================================
# Reserve manage
# ============================================================

class ReservationManagementView(LoginRequiredMixin, UserPassesTestMixin, View):
    template_name = "admin/reservation_management.html"

    def test_func(self):
        return self.request.user.is_staff

    def get_filtered_reservations(self, request):
        reservations = Reservation.objects.select_related("user", "menu", "menu__food").order_by("-reserve_time")

        first_name = request.GET.get("first_name")
        if first_name:
            reservations = reservations.filter(user__first_name__icontains=first_name)

        last_name = request.GET.get("last_name")
        if last_name:
            reservations = reservations.filter(user__last_name__icontains=last_name)

        national_code = request.GET.get("national_code")
        if national_code:
            reservations = reservations.filter(user__national_code__icontains=national_code)

        food_name = request.GET.get("food_name")
        if food_name:
            reservations = reservations.filter(menu__food__food_name__icontains=food_name)

        reservations = apply_date_filters(reservations, request, "menu__food_date")
        return reservations

    def export_excel(self, reservations):
        wb = Workbook()
        ws = wb.active
        ws.sheet_view.rightToLeft = True
        # ws.title = "لیست رزروها"

        headers = ["ردیف", "نام", "نام خانوادگی", "کد ملی", "غذا", "تاریخ رزرو", "تاریخ ارائه غذا"]

        for column, header in enumerate(headers, 1):
            cell = ws.cell(row=1, column=column, value=header)
            apply_header_style(cell)

        for row, reservation in enumerate(reservations, 2):
            cell = ws.cell(row=row, column=1, value=row - 1)
            apply_cell_style(cell)

            cell = ws.cell(row=row, column=2, value=reservation.user.first_name)
            apply_cell_style(cell)

            cell = ws.cell(row=row, column=3, value=reservation.user.last_name)
            apply_cell_style(cell)

            cell = ws.cell(row=row, column=4, value=reservation.user.national_code)
            apply_cell_style(cell)

            cell = ws.cell(row=row, column=5, value=reservation.menu.food.food_name)
            apply_cell_style(cell)

            j_reserve = to_jalali(
                reservation.reserve_time.year,
                reservation.reserve_time.month,
                reservation.reserve_time.day
            )
            cell = ws.cell(
                row=row,
                column=6,
                value=(
                    f"{j_reserve['jy']:04d}/"
                    f"{j_reserve['jm']:02d}/"
                    f"{j_reserve['jd']:02d} "
                    f"{reservation.reserve_time.hour:02d}:"
                    f"{reservation.reserve_time.minute:02d}"
                )
            )
            apply_cell_style(cell)

            j_food = to_jalali(
                reservation.menu.food_date.year,
                reservation.menu.food_date.month,
                reservation.menu.food_date.day
            )
            cell = ws.cell(
                row=row,
                column=7,
                value=(
                    f"{j_food['jy']:04d}/"
                    f"{j_food['jm']:02d}/"
                    f"{j_food['jd']:02d}"
                )
            )
            apply_cell_style(cell)

        widths = {"A": 6, "B": 20, "C": 20, "D": 15, "E": 25, "F": 20, "G": 20}
        for column, width in widths.items():
            ws.column_dimensions[column].width = width

        return wb

    def get(self, request):
        reservations = self.get_filtered_reservations(request)

        if request.GET.get("export") == "reservation":
            wb = self.export_excel(reservations)
            year = request.GET.get("year", "")
            month = request.GET.get("month", "")
            
            if year and month:
                filename = f"گزارش_{year}_{month}.xlsx"
            elif year:
                filename = f"گزارش_{year}.xlsx"
            else:
                filename = "گزارش.xlsx"
            encoded_filename = quote(filename)
            response = HttpResponse(
                content_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
            )
            response["Content-Disposition"] = f'attachment;  filename="{encoded_filename}"'
            wb.save(response)
            return response

        users = User.objects.filter(is_active=True).order_by("first_name", "last_name")
        menus = DailyMenu.objects.select_related("food").order_by("-food_date")
        years = get_available_years()
        current_year, current_month = get_current_jalali()

        if request.headers.get("X-Requested-With") == "XMLHttpRequest":
            return JsonResponse({
                "success": True,
                "reservation_html": render_to_string(
                    "admin/partials/reservation_table_rows.html",
                    {"reservations": reservations},
                    request=request
                )
            })

        return render(request, self.template_name, {
            "reservations": reservations,
            "users": users,
            "menus": menus,
            "years": years,
            "current_year": current_year,
            "current_month": current_month,
        })

    def post(self, request):
        if "add_reservation" in request.POST:
            try:
                user_id = request.POST.get("user_id")
                menu_id = request.POST.get("menu_id")

                if not user_id or not menu_id:
                    messages.error(request, "لطفاً کاربر و غذا را انتخاب کنید.")
                    return redirect("reservations:reservation_management")

                if Reservation.objects.filter(user_id=user_id, menu_id=menu_id).exists():
                    messages.error(request, "این کاربر قبلاً برای این تاریخ رزرو کرده است.")
                    return redirect("reservations:reservation_management")

                Reservation.objects.create(user_id=user_id, menu_id=menu_id)
                messages.success(request, "رزرو با موفقیت اضافه شد.")
            except Exception as e:
                messages.error(request, f"خطا: {e}")

        return redirect("reservations:reservation_management")


# ============================================================
# Delete reserve
# ============================================================

class DeleteReservationView(LoginRequiredMixin, UserPassesTestMixin, View):
    def test_func(self):
        return self.request.user.is_staff

    def post(self, request):
        try:
            reservation = get_object_or_404(Reservation, id=request.POST.get("reservation_id"))
            reservation.delete()
            return JsonResponse({"success": True, "message": "رزرو حذف شد."})
        except Exception as e:
            return JsonResponse({"success": False, "message": str(e)})


# ============================================================
# count reserve report
# ============================================================

class UserReportView(LoginRequiredMixin, UserPassesTestMixin, View):
    template_name = "admin/user_report.html"
    report_rows_template = "admin/partials/user_report_rows.html"

    def test_func(self):
        return self.request.user.is_staff

    def get_report_data(self, request):
        reservations = Reservation.objects.select_related("user", "menu", "menu__food")
        reservations = apply_date_filters(reservations, request, "menu__food_date")

        user_ids_with_reservations = reservations.values_list("user_id", flat=True).distinct()
        if not user_ids_with_reservations:
            return []

        users = User.objects.filter(id__in=user_ids_with_reservations, is_active=True).order_by("first_name", "last_name")

        first_name = request.GET.get("first_name")
        if first_name:
            users = users.filter(first_name__icontains=first_name)

        last_name = request.GET.get("last_name")
        if last_name:
            users = users.filter(last_name__icontains=last_name)

        username = request.GET.get("username")
        if username:
            users = users.filter(username__icontains=username)

        national_code = request.GET.get("national_code")
        if national_code:
            users = users.filter(national_code__icontains=national_code)

        personnel_code = request.GET.get("personnel_code")
        if personnel_code:
            users = users.filter(personnel_code__icontains=personnel_code)

        site = request.GET.get("site")
        if site:
            users = users.filter(site__icontains=site)

        department = request.GET.get("department")
        if department:
            users = users.filter(department__icontains=department)

        report_data = []
        for user in users:
            count = reservations.filter(user=user).count()
            if count > 0:
                report_data.append({
                    "first_name": user.first_name or "-",
                    "last_name": user.last_name or "-",
                    "username": user.username or "-",
                    "national_code": user.national_code or "-",
                    "personnel_code": user.personnel_code or "-",
                    "site": user.site or "-",
                    "department": user.department or "-",
                    "reservation_count": count,
                })

        report_data.sort(key=lambda item: item["reservation_count"], reverse=True)
        return report_data

    def export_excel(self, request):
        report = self.get_report_data(request)

        if not report:
            wb = Workbook()
            ws = wb.active
            ws.title = "گزارش کاربران"
            ws.sheet_view.rightToLeft = True
            cell = ws.cell(row=1, column=1, value="هیچ رزروی در بازه انتخاب شده یافت نشد.")
            apply_cell_style(cell)

            response = HttpResponse(
                content_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
            )
            response["Content-Disposition"] = 'attachment; filename="empty_report.xlsx"'
            wb.save(response)
            return response

        year = request.GET.get("year")
        month = request.GET.get("month")
        from_date = request.GET.get("from_date")
        to_date = request.GET.get("to_date")

        wb = Workbook()
        ws = wb.active
        ws.title = "گزارش کاربران"
        ws.sheet_view.rightToLeft = True

        headers = ["ردیف", "نام", "نام خانوادگی", "نام کاربری", "کد ملی", "کد پرسنلی", "تعداد رزرو", "سایت", "دپارتمان"]

        for column, header in enumerate(headers, 1):
            cell = ws.cell(row=1, column=column, value=header)
            apply_header_style(cell)

        for row, data in enumerate(report, 2):
            row_data = [
                (row - 1, 1),
                (data["first_name"], 2),
                (data["last_name"], 3),
                (data["username"], 4),
                (data["national_code"], 5),
                (data["personnel_code"], 6),
                (data["reservation_count"], 7),
                (data["site"], 8),
                (data["department"], 9),
            ]
            for value, col in row_data:
                cell = ws.cell(row=row, column=col, value=value)
                apply_cell_style(cell)

        widths = {"A": 6, "B": 20, "C": 20, "D": 20, "E": 20, "F": 15, "G": 15, "H": 20, "I": 20}
        for column, width in widths.items():
            ws.column_dimensions[column].width = width

        if from_date and to_date:
            clean_from = from_date.replace("/", "-")
            clean_to = to_date.replace("/", "-")
            filename = f"گزارش_{clean_from}_to_{clean_to}.xlsx"
        elif year and month:
            filename = f"گزارش_{year}_{month}.xlsx"
        elif year:
            filename = f"گزارش_{year}.xlsx"
        else:
            filename = "گزارش.xlsx"

        encoded_filename = quote(filename)
        response = HttpResponse(content_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")
        response["Content-Disposition"] = f'attachment; filename="{encoded_filename}"'
        wb.save(response)

        return response

    def get(self, request):
        if request.GET.get("export") == "excel":
            return self.export_excel(request)

        current_year, current_month = get_current_jalali()

        selected_year = request.GET.get("year")
        selected_month = request.GET.get("month")

        if not selected_year:
            selected_year = str(current_year)
        if not selected_month:
            selected_month = str(current_month)

        from_date = request.GET.get("from_date", "")
        to_date = request.GET.get("to_date", "")

        report = self.get_report_data(request)
        years = get_available_years()

        context = {
            "user_report": report,
            "years": years,
            "current_year": current_year,
            "current_month": current_month,
            "selected_year": selected_year,
            "selected_month": selected_month,
            "from_date": from_date,
            "to_date": to_date,
            "first_name": request.GET.get("first_name", ""),
            "last_name": request.GET.get("last_name", ""),
            "username": request.GET.get("username", ""),
            "national_code": request.GET.get("national_code", ""),
            "personnel_code": request.GET.get("personnel_code", ""),
            "site": request.GET.get("site", ""),
            "department": request.GET.get("department", ""),
        }

        is_ajax = request.headers.get("X-Requested-With") == "XMLHttpRequest"
        if is_ajax:
            html = render_to_string(self.report_rows_template, context, request=request)
            return JsonResponse({"success": True, "html": html})

        return render(request, self.template_name, context)


# ============================================================
# month report
# ============================================================

class MonthlyReportView(LoginRequiredMixin, UserPassesTestMixin, View):
    def test_func(self):
        return self.request.user.is_staff

    def post(self, request):
        try:
            year = int(request.POST.get("year"))
            month = int(request.POST.get("month"))

            if not year or not month:
                return JsonResponse({"success": False, "message": "سال و ماه را انتخاب کنید."})

            start, end = get_month_range(year, month)

            reservations = Reservation.objects.filter(menu__food_date__range=[start, end])
            users = User.objects.filter(is_active=True)

            report = []
            for user in users:
                count = reservations.filter(user=user).count()
                if count > 0:
                    report.append({
                        "first_name": user.first_name,
                        "last_name": user.last_name,
                        "username": user.username,
                        "national_code": user.national_code,
                        "personnel_code": user.personnel_code,
                        "site": user.site or "-",
                        "department": user.department or "-",
                        "reservation_count": count,
                    })

            report.sort(key=lambda x: x["reservation_count"], reverse=True)

            year_str = request.POST.get("year", "")
            month_str = request.POST.get("month", "")

            wb = Workbook()
            ws = wb.active
            ws.sheet_view.rightToLeft = True
            ws.title = f"گزارش_{year_str}_{month_str}"

            headers = ["ردیف", "نام", "نام خانوادگی", "نام کاربری", "کد ملی", "کد پرسنلی", "تعداد رزرو", "سایت", "دپارتمان"]

            for column, header in enumerate(headers, 1):
                cell = ws.cell(row=1, column=column, value=header)
                apply_header_style(cell)

            for row, data in enumerate(report, 2):
                row_data = [
                    (row - 1, 1),
                    (data["first_name"], 2),
                    (data["last_name"], 3),
                    (data["username"], 4),
                    (data["national_code"], 5),
                    (data["personnel_code"], 6),
                    (data["reservation_count"], 7),
                    (data["site"], 8),
                    (data["department"], 9),
                ]
                for value, col in row_data:
                    cell = ws.cell(row=row, column=col, value=value)
                    apply_cell_style(cell)

            widths = {"A": 6, "B": 20, "C": 20, "D": 20, "E": 20, "F": 15, "G": 15, "H": 15, "I": 20}
            for column, width in widths.items():
                ws.column_dimensions[column].width = width

            
            if year and month:
                filename = f"گزارش ماهانه_{year}_{month}.xlsx"
            elif year:
                filename = f"گزارش ماهانه_{year}.xlsx"
            else:
                filename = "گزارش ماهانه.xlsx"
            
            encoded_filename = quote(filename)
            response = HttpResponse(content_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")
            response["Content-Disposition"] = f'attachment; filename="{encoded_filename}"'
            wb.save(response)
            return response

        except Exception as e:
            return JsonResponse({"success": False, "message": str(e)})


# ============================================================
# Range Report
# ============================================================

class RangeReportView(LoginRequiredMixin, UserPassesTestMixin, View):
    def test_func(self):
        return self.request.user.is_staff

    def post(self, request):
        try:
            from_date = request.POST.get("from_date")
            to_date = request.POST.get("to_date")

            if not from_date or not to_date:
                return JsonResponse({"success": False, "message": "بازه زمانی را مشخص کنید."})

            start = parse_jalali_date(from_date)
            end = parse_jalali_date(to_date)

            if not start or not end:
                return JsonResponse({"success": False, "message": "فرمت تاریخ صحیح نیست."})

            if start > end:
                return JsonResponse({"success": False, "message": "تاریخ شروع نباید از پایان بزرگتر باشد."})

            reservations = Reservation.objects.filter(menu__food_date__range=[start, end])
            user_ids_with_reservations = reservations.values_list("user_id", flat=True).distinct()
            users = User.objects.filter(id__in=user_ids_with_reservations, is_active=True)

            report = []
            for user in users:
                count = reservations.filter(user=user).count()
                report.append({
                    "first_name": user.first_name,
                    "last_name": user.last_name,
                    "username": user.username,
                    "national_code": user.national_code,
                    "personnel_code": user.personnel_code,
                    "site": user.site or "-",
                    "department": user.department or "-",
                    "reservation_count": count,
                })

            report.sort(key=lambda x: x["reservation_count"], reverse=True)

            wb = Workbook()
            ws = wb.active
            ws.sheet_view.rightToLeft = True
            ws.title = f"گزارش_بازه_{from_date}_تا_{to_date}"

            headers = ["ردیف", "نام", "نام خانوادگی", "نام کاربری", "کد ملی", "کد پرسنلی", "تعداد رزرو", "سایت", "دپارتمان"]

            for column, header in enumerate(headers, 1):
                cell = ws.cell(row=1, column=column, value=header)
                apply_header_style(cell)

            for row, data in enumerate(report, 2):
                row_data = [
                    (row - 1, 1),
                    (data["first_name"], 2),
                    (data["last_name"], 3),
                    (data["username"], 4),
                    (data["national_code"], 5),
                    (data["personnel_code"], 6),
                    (data["reservation_count"], 7),
                    (data["site"], 8),
                    (data["department"], 9),
                ]
                for value, col in row_data:
                    cell = ws.cell(row=row, column=col, value=value)
                    apply_cell_style(cell)

            widths = {"A": 6, "B": 20, "C": 20, "D": 20, "E": 20, "F": 15, "G": 15, "H": 20, "I": 20}
            for column, width in widths.items():
                ws.column_dimensions[column].width = width

            clean_from = from_date.replace("/", "-")
            clean_to = to_date.replace("/", "-")
            filename = f"گزارش_بازه_{clean_from}_تا_{clean_to}.xlsx"
            encoded_filename = quote(filename)

            response = HttpResponse(
                content_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
            )
            response["Content-Disposition"] = f'attachment; filename="{encoded_filename}"'
            wb.save(response)
            return response

        except Exception as e:
            return JsonResponse({"success": False, "message": str(e)})