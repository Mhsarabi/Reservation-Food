from django.db import models
from accounts.models import User
from menu.models import DailyMenu

# Create your models here.
class Reservation(models.Model):

    class Status(models.TextChoices):
        RESERVED="reserved","رزرو شده"
        CANCELED="canceled","لغو شده"

    user=models.ForeignKey(User,on_delete=models.CASCADE,related_name="reservations",verbose_name="کاربر")

    menu=models.ForeignKey(DailyMenu,on_delete=models.CASCADE,related_name="reservations",verbose_name="منوی روز")

    status=models.CharField(max_length=20,choices=Status.choices,default=Status.RESERVED,verbose_name="وضعیت")

    reserve_time= models.DateTimeField(auto_now_add=True,verbose_name="زمان رزرو")

    class Meta:
        verbose_name="رزرو"
        verbose_name_plural="رزروها"

        ordering = ["-reserve_time"]

        constraints=[
            models.UniqueConstraint(
                fields=["user","menu"],
                name="unique_user_reservation_per_day"
            )
        ]

    def __str__(self):
        return f"{self.user.full_name} - {self.menu.food_date}"