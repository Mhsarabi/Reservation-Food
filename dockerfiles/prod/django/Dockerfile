# pull official base image
FROM python:3.10-slim-buster

# maintainers info
LABEL maintainer="mohsen.sarabi81@gmail.com"

# set work directory
WORKDIR /usr/src/app

# install dependencies
COPY ./requirements.txt .
RUN pip install --upgrade pip && pip install -r requirements.txt


# Set up Gunicorn
COPY ./core .

# Configure Nginx
COPY ./default.conf /etc/nginx/nginx.conf

# exposing nginx port
EXPOSE 80


# copy entrypoint
COPY ./dockerfiles/prod/django/entrypoint.sh .

# make our entrypoint.sh executable
RUN chmod +x ./entrypoint.sh

# execute our entrypoint.sh file
CMD ["./entrypoint.sh"]