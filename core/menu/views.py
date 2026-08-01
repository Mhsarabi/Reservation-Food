from django.shortcuts import render
from django.views.generic import TemplateView
from django.contrib.auth.mixins import LoginRequiredMixin, UserPassesTestMixin
from .models import DailyMenu,Food
from reservations.models import Reservation
from django.views import View
from django.http import JsonResponse
from django.utils import timezone
from datetime import datetime, timedelta
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


class SaveDailyFoodView(LoginRequiredMixin, UserPassesTestMixin, View):
    """ذخیره غذای روز در تقویم"""
    
    def test_func(self):
        return self.request.user.is_staff
    
    def post(self, request):
        try:
            food_id = request.POST.get('food_id')
            food_date = request.POST.get('food_date')  
            
            if not food_id or not food_date:
                return JsonResponse({
                    'success': False,
                    'message': 'لطفاً غذا و تاریخ را انتخاب کنید.'
                })
            

            try:
                food = Food.objects.get(id=food_id)
            except Food.DoesNotExist:
                return JsonResponse({
                    'success': False,
                    'message': 'غذای انتخاب شده وجود ندارد.'
                })
            

            daily_menu, created = DailyMenu.objects.update_or_create(
                food_date=food_date,
                defaults={'food': food}
            )
            
            return JsonResponse({
                'success': True,
                'message': 'غذا با موفقیت برای روز مورد نظر ثبت شد.',
                'data': {
                    'food_date': food_date,
                    'food_name': food.food_name,
                    'food_image': food.food_image.url if food.food_image else None,
                    'created': created
                }
            })
            
        except Exception as e:
            return JsonResponse({
                'success': False,
                'message': f'خطا در ثبت غذا: {str(e)}'
            })


class DeleteDailyFoodView(LoginRequiredMixin, UserPassesTestMixin, View):
    """حذف غذای روز از تقویم"""
    
    def test_func(self):
        return self.request.user.is_staff
    
    def post(self, request):
        try:
            food_date = request.POST.get('food_date')
            
            if not food_date:
                return JsonResponse({
                    'success': False,
                    'message': 'تاریخ ارسال نشده است.'
                })
            

            today = timezone.now().date()
            if food_date < str(today):
                return JsonResponse({
                    'success': False,
                    'message': 'امکان حذف غذا برای روزهای گذشته وجود ندارد.'
                })
            
            deleted_count, _ = DailyMenu.objects.filter(food_date=food_date).delete()
            
            if deleted_count > 0:
                return JsonResponse({
                    'success': True,
                })
            else:
                return JsonResponse({
                    'success': False,
                })
                
        except Exception as e:
            return JsonResponse({
                'success': False,
                'message': f'خطا در حذف غذا: {str(e)}'
            })


class DailyMenusAPIView(LoginRequiredMixin, View):    
    def get(self, request):        
        menus = DailyMenu.objects.select_related('food').all()
        
        reserved_ids = set(
            Reservation.objects.filter(
                user=request.user
            ).values_list('menu_id', flat=True)
        )        
        data = {}
        for menu in menus:
            key = menu.food_date.strftime('%Y-%m-%d')
            data[key] = {
                'foodId': menu.food.id,
                'foodName': menu.food.food_name,
                'image': menu.food.food_image.url if menu.food.food_image else '/static/images/no-food.png',
                'reserved': menu.id in reserved_ids,  
            }
        
        return JsonResponse(data)


class SaveWeeklyFoodView(LoginRequiredMixin, UserPassesTestMixin, View):

    def test_func(self):
        return self.request.user.is_staff
    
    def post(self, request):
        try:
            from_date = request.POST.get('from_date')
            to_date = request.POST.get('to_date')
            food_id = request.POST.get('food_id')
            weekdays = request.POST.getlist('weekdays')
            
            print("=" * 50)
            print("📅 from_date:", from_date)
            print("📅 to_date:", to_date)
            print("🍽️ food_id:", food_id)
            print("📆 weekdays (خام):", weekdays)
            print("=" * 50)
            
            if not from_date or not to_date or not food_id or not weekdays:
                return JsonResponse({
                    'success': False,
                    'message': 'لطفاً تمام فیلدها را پر کنید.'
                })
            
            try:
                from_date_obj = datetime.strptime(from_date, '%Y-%m-%d').date()
                to_date_obj = datetime.strptime(to_date, '%Y-%m-%d').date()
            except ValueError:
                return JsonResponse({
                    'success': False,
                    'message': 'فرمت تاریخ نامعتبر است.'
                })
            
            if from_date_obj > to_date_obj:
                return JsonResponse({
                    'success': False,
                    'message': 'تاریخ شروع نباید از تاریخ پایان بزرگتر باشد.'
                })
            
            try:
                food = Food.objects.get(id=food_id)
            except Food.DoesNotExist:
                return JsonResponse({
                    'success': False,
                    'message': 'غذای انتخاب شده وجود ندارد.'
                })
            
            weekdays = [int(w) for w in weekdays if w]
            print(f"📆 weekdays (پس از تبدیل): {weekdays}")
            
            created_count = 0
            current_date = from_date_obj
            
            print("\n📅 شروع بررسی روزها:")
            print("-" * 50)
            
            while current_date <= to_date_obj:
                python_weekday = current_date.weekday()
                persian_weekday = (python_weekday + 2) % 7
                
                print(f"📅 {current_date}: python_weekday={python_weekday}, persian_weekday={persian_weekday}, in weekdays={persian_weekday in weekdays}")
                
                if persian_weekday in weekdays:
                    date_str = current_date.strftime('%Y-%m-%d')
                    _, created = DailyMenu.objects.update_or_create(
                        food_date=date_str,
                        defaults={'food': food}
                    )
                    if created:
                        created_count += 1
                        print(f"   ✅ ثبت شد: {date_str}")
                
                current_date += timedelta(days=1)
            
            print("-" * 50)
            print(f"✅ تعداد روزهای جدید ثبت شده: {created_count}")
            
            return JsonResponse({
                'success': True,
                'message': f'برنامه هفتگی با موفقیت ثبت شد. {created_count} روز جدید اضافه شد.',
                'created_count': created_count
            })
            
        except Exception as e:
            print(f"❌ خطا: {str(e)}")
            return JsonResponse({
                'success': False,
                'message': f'خطا در ثبت برنامه هفتگی: {str(e)}'
            })