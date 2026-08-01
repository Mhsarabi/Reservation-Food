from django.urls import path
from .views import *

app_name = "reservations"

urlpatterns=[
    # path("admin/alvan/plan",adminreservation,name='reservation-plan'),
    path("toggle/",ReservationToggleView.as_view(),name="toggle",),
    path("delete/", ReservationDeleteView.as_view(), name="delete"),
    path("reserve-month/",ReservationReserveMonthView.as_view(),name="reserve_month",),
    path("cancel-month/",ReservationCancelMonthView.as_view(),name="cancel_month",),
]