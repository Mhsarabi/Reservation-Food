from django.urls import path
from .views import *

app_name = "reservations"

urlpatterns = [
    # ============================================================
    # ویوهای کاربر
    # ============================================================

    path("toggle/", ReservationToggleView.as_view(), name="toggle"),
    path("delete/", ReservationDeleteView.as_view(), name="delete"),
    path("reserve-month/", ReservationReserveMonthView.as_view(), name="reserve_month"),
    path("cancel-month/", ReservationCancelMonthView.as_view(), name="cancel_month"),
    path('add-extra/', AddExtraReservationView.as_view(), name='add_extra'),
    path('remove-extra/', RemoveExtraReservationView.as_view(), name='remove_extra'),
    path('delete-extra/', DeleteExtraReservationView.as_view(), name='delete_extra'),

    # ============================================================
    # گزارش‌گیری
    # ============================================================

    path("report-monthly/", MonthlyReportView.as_view(), name="report_monthly"),
    path("report-range/", RangeReportView.as_view(), name="report_range"),

    # ============================================================
    # مدیریت ادمین
    # ============================================================

    path("Alvan/manage/", ReservationManagementView.as_view(), name="reservation_management"),
    path("Alvan/delete/", DeleteReservationView.as_view(), name="delete_reservation"),

    # ============================================================
    # گزارش کاربران - صفحه جداگانه
    # ============================================================

    path("Alvan/user-report/", UserReportView.as_view(), name="user_report"),
]