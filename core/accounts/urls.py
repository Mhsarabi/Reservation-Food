from django.urls import path
from .views import *

app_name = "accounts"

urlpatterns=[
    path("",LoginView.as_view(),name="login"),
    path("logout/", LogoutView.as_view(), name="logout"),
    path("change-password/", ChangePasswordView.as_view(), name="change_password"),
    path("Alvan/", AdminDashboardView.as_view(), name="admin_dashboard"),
    path("Alvan/users", UsersManagementView.as_view(), name="user_management"),
    path("Alvan/reset-password/user",ResetPasswordView.as_view(),name="reset_password_user"),
    path("Alvan/edit/user",EditUserView.as_view(),name="edit_user"),
    path("Alvan/delete/user",DeleteUserView.as_view(),name="delete_user"),
    path("Alvan/toggle-status/user",ToggleUserStatusView.as_view(),name="toggle_user_status"),
    path("Alvan/import-user",ImportUsersView.as_view(),name="import_users"),
]