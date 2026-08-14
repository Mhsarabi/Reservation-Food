from django.db import models
from django.contrib.auth.models import AbstractBaseUser, PermissionsMixin
from django.contrib.auth.base_user import BaseUserManager
# Create your models here.

class UserManager(BaseUserManager):
    def create_user(self,national_code,password,**extra_fields):

        if not national_code:
            raise ValueError("national code is required.")

        if not password:
            password = national_code

        if 'username' not in extra_fields or not extra_fields.get('username'):
            extra_fields['username'] = national_code

        user=self.model(national_code=national_code,**extra_fields)
        user.set_password(password)
        user.save(using=self._db)

        return user

    def create_superuser(self,national_code,password=None,**extra_fields):
        extra_fields.setdefault("is_staff",True)
        extra_fields.setdefault("is_superuser",True)
        extra_fields.setdefault("is_active",True)

        if 'username' not in extra_fields or not extra_fields.get('username'):
            extra_fields['username'] = national_code

        if extra_fields.get("is_staff") is not True:
         raise ValueError("Superuser must have is_staff=True.")

        if extra_fields.get("is_superuser") is not True:
         raise ValueError("Superuser must have is_superuser=True.")

        return self.create_user(national_code,password,**extra_fields)



class User(AbstractBaseUser,PermissionsMixin):
    username = models.CharField(max_length=50,unique=True,verbose_name="نام کاربری")

    first_name = models.CharField(max_length=50,verbose_name="نام")

    last_name = models.CharField(max_length=50,verbose_name="نام خانوادگی")

    national_code=models.CharField(max_length=10,unique=True,verbose_name="کد ملی")

    personnel_code=models.CharField(max_length=10,unique=True,verbose_name="کد پرسنلی")

    site=models.CharField(max_length=100,verbose_name="سایت",null=True)

    department=models.CharField(max_length=100,verbose_name="واحد")

    is_active = models.BooleanField(default=True)

    is_staff = models.BooleanField(default=False)

    objects = UserManager()

    USERNAME_FIELD="national_code"

    REQUIRED_FIELDS=[
        "personnel_code",
        "first_name",
        "last_name",
        "department"
    ]

    def save(self, *args, **kwargs):
        if not self.username:
            self.username = self.national_code

        if not self.password:
            self.set_password(self.national_code)
        super().save(*args, **kwargs)

    def __str__(self):
        return self.username