# Base image
FROM python:3.12-slim

# Maintainer
LABEL maintainer="mohsen.sarabi81@gmail.com"

# Set work directory
WORKDIR /usr/src/app

# Install dependencies
COPY ./requirements.txt .

RUN pip install --upgrade pip && \
    pip install -r requirements.txt

# Copy Django project
COPY ./core .

# Expose Gunicorn port
EXPOSE 8000

# Start Gunicorn
CMD ["gunicorn", "core.wsgi:application", "--bind", "0.0.0.0:8000"]