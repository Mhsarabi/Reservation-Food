from django.urls import path
from . import views

urlpatterns=[
    path("",views.reservation,name='reservation'),
    path("admin/alvan/plan",views.adminreservation,name='reservation-plan'),

]