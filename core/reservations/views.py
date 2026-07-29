from django.shortcuts import render

# Create your views here.
def reservation(request):
    return render(request,"index.html")

def adminreservation(request):
    return render(request,"admin.html")
