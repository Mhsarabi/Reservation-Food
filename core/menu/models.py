from django.db import models

# Create your models here.
class Food(models.Model):
    food_name=models.CharField(max_length=100,verbose_name="نام غذا",unique=True)

    food_image=models.ImageField(upload_to="foods/",verbose_name="تصویر غذا",blank=True,null=True)

    created_at = models.DateTimeField(auto_now_add=True, verbose_name="تاریخ ایجاد")

    updated_at = models.DateTimeField(auto_now=True, verbose_name="تاریخ بروزرسانی")

    def __str__(self):
        return self.food_name

    class Meta:
        verbose_name="غذا"
        verbose_name_plural="غذاها"
        ordering = ['food_name']

class DailyMenu(models.Model):
    food=models.ForeignKey(Food,on_delete=models.CASCADE,related_name='daily_menus',verbose_name="غذا")

    food_date=models.DateField(unique=True,verbose_name="تاریخ غذا")

    class Meta:
        verbose_name="منوی غذا"
        verbose_name_plural="منوی روزانه"
        ordering=("-food_date",)

    def __str__(self):
        return f"{self.food_date} - {self.food.food_name}"