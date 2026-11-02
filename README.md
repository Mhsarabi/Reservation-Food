# Reservation-Food

A food reservation management system developed with **Django and PostgreSQL**, with a containerized deployment setup using Docker Compose.

The project is designed for a food reservation service and includes a structured backend environment, database persistence, and web server configuration.

## Project Overview

Reservation-Food is a Django-based web application project focused on food reservation management. It uses PostgreSQL for data storage and Docker Compose to orchestrate the application and its supporting services.

The repository also includes separate Docker configurations for development and production-oriented deployment.

## Tech Stack

- **Language:** Python
- **Backend Framework:** Django 5.2
- **Database:** PostgreSQL 15
- **Containerization:** Docker and Docker Compose
- **Web Server:** Nginx
- **Application Server:** Gunicorn
- **Static File Handling:** WhiteNoise
- **Persian Calendar Support:** django-jalali
- **Image Processing:** Pillow
- **Environment Configuration:** python-decouple

## Key Technical Features

- **Django Backend:** A Python-based backend built with Django.
- **PostgreSQL Integration:** Persistent relational database storage.
- **Dockerized Environment:** Application and database services configured through Docker Compose.
- **Separate Deployment Configurations:** Dedicated Compose files for different environments.
- **Nginx Integration:** Web server configuration for the application and its static and media files.
- **Persian Calendar Support:** Dependencies for working with Jalali dates.
- **Environment-Based Configuration:** Application settings can be supplied through environment files.

## Project Structure

```text
Reservation-Food/
├── core/                       # Django project source
├── dockerfiles/                # Docker build configurations
├── envs/                       # Environment configuration files
├── default.conf                # Nginx configuration
├── docker-compose.yml          # Main Compose configuration
├── docker-compose-stage.yml    # Stage/development configuration
├── requirements.txt            # Python dependencies
└── .gitignore
```

## Getting Started

### Prerequisites

Make sure the following tools are installed:

- Git
- Docker
- Docker Compose

### 1. Clone the Repository

```bash
git clone https://github.com/Mhsarabi/Reservation-Food.git
cd Reservation-Food
```

### 2. Configure Environment Variables

Review the `envs/` directory and configure the required environment variables for Django and PostgreSQL.

Ensure that database credentials, connection settings, and other required configuration values are consistent across the application and database services.

**Important:** Do not commit real passwords, secret keys, or other sensitive environment values to version control.

### 3. Start the Application

Build and start the services using Docker Compose:

```bash
docker compose up --build -d
```

The main Compose configuration maps port `80` on the host to the backend container and port `5432` to PostgreSQL.

Once the services are running, check the container logs:

```bash
docker compose logs -f
```

### 4. Stop the Application

```bash
docker compose down
```

Database files are configured to persist in the local `postgres/data/` directory. Avoid deleting this directory if you need to preserve the database contents.

## Deployment Configuration

The repository includes two Docker Compose configurations:

| File | Purpose |
|---|---|
| `docker-compose.yml` | Main application and database configuration |
| `docker-compose-stage.yml` | Separate configuration with Django, PostgreSQL, and Nginx services |

The stage configuration also defines shared Docker volumes for static and media files and mounts the Django source code into the backend container.

Review the corresponding Dockerfiles and environment settings before deploying to a production server.

## Configuration and Security

Before deploying the application:

- Replace default database credentials with secure values.
- Configure Django's secret key and allowed hosts appropriately.
- Keep `DEBUG` disabled in production.
- Store secrets in environment variables rather than source code.
- Configure database access and network exposure according to your deployment requirements.

## Author

**Mohsen Sarabi**

- GitHub: [@Mhsarabi](https://github.com/Mhsarabi)
