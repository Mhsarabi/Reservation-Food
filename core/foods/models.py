from django.db import models

# Create your models here.
class Food(models.Model):
    food_name=models.CharField(max_length=100,verbose_name="نام غذا")

    food_image=models.ImageField(upload_to="foods/",verbose_name="تصویر غذا")

    def __str__(self):
        return self.food_name

    class Meta:
        verbose_name="غذا"
        verbose_name_plural="غذاها"
