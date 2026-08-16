from django.db import models
from accounts.models import User
from menu.models import DailyMenu

# Create your models here.
class Reservation(models.Model):

    user=models.ForeignKey(User,on_delete=models.CASCADE,related_name="reservations",verbose_name="کاربر")

    menu=models.ForeignKey(DailyMenu,on_delete=models.CASCADE,related_name="reservations",verbose_name="منوی روز")

    reserve_time= models.DateTimeField(auto_now_add=True,verbose_name="زمان رزرو")

    is_extra = models.BooleanField(default=False, verbose_name="رزرو اضافه")

    class Meta:
        verbose_name="رزرو"
        verbose_name_plural="رزروها"

        ordering = ("-reserve_time",)

        constraints=[
            models.UniqueConstraint(
                fields=["user", "menu"],
                condition=models.Q(is_extra=False),
                name="unique_main_reservation_per_day"
            ),
        ]

    def __str__(self):
        return f"{self.user.last_name} - {self.menu.food_date}"