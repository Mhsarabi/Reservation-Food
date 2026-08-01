from django.shortcuts import render
from django.views.generic import TemplateView
from django.contrib.auth.mixins import LoginRequiredMixin, UserPassesTestMixin
from .models import DailyMenu,Food
from reservations.models import Reservation
from django.views import View
from django.http import JsonResponse
import os

# Create your views here.
class CalendarView(LoginRequiredMixin, TemplateView):
    template_name = "menu/calendar.html"

    login_url = "accounts:login"

    def get_context_data(self,**kwargs):
        context=super().get_context_data(**kwargs)

        menus = DailyMenu.objects.select_related("food").order_by("food_date")

        reserved_ids = set(
            Reservation.objects.filter(
                user=self.request.user
            ).values_list("menu_id", flat=True)
        )

        for menu in menus:
            menu.is_reserved = menu.id in reserved_ids

        context["menus"] = menus

        return context

class FoodCreateView(LoginRequiredMixin, UserPassesTestMixin, View):

    def test_func(self):
        return self.request.user.is_staff

    def post(self, request):

        food_name = request.POST.get("food_name")
        food_image = request.FILES.get("food_image")

        if not food_name:
            return JsonResponse({
                "success": False,
                "message": "نام غذا الزامی است."
            })

        if Food.objects.filter(food_name=food_name).exists():
            return JsonResponse({
                "success": False,
                "message": "این غذا قبلاً ثبت شده است."
            })

        food = Food.objects.create(
            food_name=food_name,
            food_image=food_image
        )

        return JsonResponse({
            "success": True,
            "message": "غذا با موفقیت ثبت شد.",
            "food": {
                "id": food.id,
                "name": food.food_name,
                "image": food.food_image.url if food.food_image else ""
            }
        })


class FoodListView(LoginRequiredMixin, View):
    def get(self, request):
        foods = Food.objects.all().order_by('food_name')
        data = []
        for food in foods:
            data.append({
                'id': food.id,
                'name': food.food_name,
                'image': food.food_image.url if food.food_image else '/static/images/no-food.png'
            })
        
        return JsonResponse({
            'success': True,
            'foods': data
        })

class FoodUpdateView(LoginRequiredMixin, UserPassesTestMixin, View):
    
    def test_func(self):
        return self.request.user.is_staff
    
    def post(self, request):
        food_id = request.POST.get("food_id")
        food_name = request.POST.get("food_name")
        food_image = request.FILES.get("food_image")
        
        if not food_id:
            return JsonResponse({
                "success": False,
                "message": "شناسه غذا ارسال نشده است."
            })
        
        try:
            food = Food.objects.get(id=food_id)
        except Food.DoesNotExist:
            return JsonResponse({
                "success": False,
                "message": "غذا یافت نشد."
            })
        
        if not food_name or not food_name.strip():
            return JsonResponse({
                "success": False,
                "message": "نام غذا الزامی است."
            })
        
        food_name = food_name.strip()
        
        if Food.objects.exclude(id=food_id).filter(food_name__iexact=food_name).exists():
            return JsonResponse({
                "success": False,
                "message": "این نام غذا قبلاً توسط غذای دیگری استفاده شده است."
            })
        
        food.food_name = food_name
        
        if food_image:
            if food_image.size > 2 * 1024 * 1024:
                return JsonResponse({
                    "success": False,
                    "message": "حجم تصویر نباید بیشتر از 2 مگابایت باشد."
                })
            
            allowed_extensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp']
            ext = os.path.splitext(food_image.name)[1].lower()
            if ext not in allowed_extensions:
                return JsonResponse({
                    "success": False,
                    "message": "فرمت تصویر مجاز نیست. فقط JPEG, PNG, GIF, WEBP پشتیبانی می‌شوند."
                })
            
            if food.food_image:
                try:
                    os.remove(food.food_image.path)
                except:
                    pass 
            
            food.food_image = food_image
        
        food.save()
        
        return JsonResponse({
            "success": True,
            "message": "غذا با موفقیت ویرایش شد.",
            "food": {
                "id": food.id,
                "name": food.food_name,
                "image": food.food_image.url if food.food_image else ""
            }
        })