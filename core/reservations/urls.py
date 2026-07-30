from django.urls import path
from .views import *

app_name = "reservations"

urlpatterns=[
    # path("admin/alvan/plan",adminreservation,name='reservation-plan'),
    path("toggle/",ReservationToggleView.as_view(),name="toggle",),
    path("delete/", ReservationDeleteView.as_view(), name="delete"),

]