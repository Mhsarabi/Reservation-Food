from django.urls import path
from .views import *

app_name = "accounts"

urlpatterns=[
    path("",LoginView.as_view(),name="login"),
    path("logout/", LogoutView.as_view(), name="logout"),
    path("change-password/", ChangePasswordView.as_view(), name="change_password"),

]