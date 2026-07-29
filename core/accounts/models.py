from django.db import models
from django.contrib.auth.models import AbstractBaseUser, PermissionsMixin
from django.contrib.auth.base_user import BaseUserManager
# Create your models here.

class UserManager(BaseUserManager):
    def create_user(self,personnel_code,password,**extra_fields):

        if not personnel_code:
            raise ValueError("Personnel code is required.")

        user=self.model(personnel_code=personnel_code,**extra_fields)
        user.set_password(password)
        user.save(using=self._db)

        return user

    def create_superuser(self,personnel_code,password=None,**extra_fields):
        extra_fields.setdefault("is_staff",True)
        extra_fields.setdefault("is_superuser",True)
        extra_fields.setdefault("is_active",True)

        if extra_fields.get("is_staff") is not True:
         raise ValueError("Superuser must have is_staff=True.")

        if extra_fields.get("is_superuser") is not True:
         raise ValueError("Superuser must have is_superuser=True.")

        return self.create_user(personnel_code,password,**extra_fields)



class User(AbstractBaseUser,PermissionsMixin):
    national_code=models.CharField(max_length=10,unique=True,verbose_name="کد ملی")

    personnel_code=models.CharField(max_length=10,unique=True,verbose_name="کد پرسنلی")

    full_name=models.CharField(max_length=150,verbose_name="نام کامل")

    department=models.CharField(max_length=100,verbose_name="واحد")

    is_active = models.BooleanField(default=True)

    is_staff = models.BooleanField(default=False)

    objects = UserManager()

    USERNAME_FIELD="personnel_code"

    REQUIRED_FIELDS=[
        "national_code",
        "full_name",
        "department"
    ]

    def __str__(self):
        return self.full_name