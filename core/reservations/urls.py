from django.urls import path
from .views import *

app_name = "reservations"

urlpatterns=[
    path("toggle/",ReservationToggleView.as_view(),name="toggle",),
    path("delete/", ReservationDeleteView.as_view(), name="delete"),
    path("reserve-month/",ReservationReserveMonthView.as_view(),name="reserve_month",),
    path("cancel-month/",ReservationCancelMonthView.as_view(),name="cancel_month",),
    path('report-monthly/', MonthlyReportView.as_view(), name='report_monthly'),
    path('report-range/', RangeReportView.as_view(), name='report_range'),
    path("Alvan/manage/", ReservationManagementView.as_view(), name="reservation_management"),
    path("Alvan/delete/", DeleteReservationView.as_view(), name="delete_reservation"),
    path("Alvan/report-monthly/", MonthlyReportView.as_view(), name="report_monthly"),
    path("Alvanreport-range/", RangeReportView.as_view(), name="report_range"),
]