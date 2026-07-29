from django.db import models
from foods.models import Food

# Create your models here.
class DailyMenu(models.Model):
    food=models.ForeignKey(Food,on_delete=models.CASCADE,related_name='daily_menus',verbose_name="غذا")

    food_date=models.DateField(unique=True,verbose_name="تاریخ غذا")

    class Meta:
        verbose_name="منوی غذا"
        verbose_name_plural="منوی روزانه"
        ordering=("-food_date",)

    def __str__(self):
        return f"{self.food_date} - {self.food.food_name}"