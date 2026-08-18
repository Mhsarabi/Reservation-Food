FROM python:3.12-slim

LABEL maintainer="mohsen.sarabi81@gmail.com"

WORKDIR /usr/src/app

# Install Nginx
RUN apt-get update && \
    apt-get install -y nginx && \
    rm -rf /var/lib/apt/lists/*

# Python dependencies
COPY requirements.txt .

RUN pip install --upgrade pip && \
    pip install -r requirements.txt

# Django project
COPY core .

# Nginx configuration
COPY default.conf /etc/nginx/conf.d/default.conf

# Static files
RUN python manage.py collectstatic --noinput

EXPOSE 80

CMD ["sh", "-c", "gunicorn core.wsgi:application --bind 127.0.0.1:8000 & nginx -g 'daemon off;'"]