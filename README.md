# MEAN Stack CRUD Application — Docker & CI/CD Deployment

A full-stack CRUD application built with **MongoDB, Express, Angular, and Node.js**, containerized with Docker and deployed to AWS EC2 via GitHub Actions CI/CD pipeline.

---

## 📁 Project Structure

```
project/
├── .github/
│   └── workflows/
│       └── deploy.yml          # GitHub Actions CI/CD pipeline
├── frontend/
│   ├── Dockerfile              # Angular + Nginx multi-stage build
│   └── src/
├── backend/
│   ├── Dockerfile              # Node.js backend
│   ├── .env                    # Environment variables (not committed)
│   └── server.js
└── docker-compose.yml          # Multi-container orchestration
```

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Angular 15, Nginx |
| Backend | Node.js, Express |
| Database | MongoDB |
| Containerization | Docker, Docker Compose |
| CI/CD | GitHub Actions |
| Cloud | AWS EC2 (Ubuntu) |
| Reverse Proxy | Nginx |

---

## ⚙️ Local Setup & Development

### Prerequisites

- Docker Desktop installed
- Node.js 20+
- Git

### 1. Clone the repository

```bash
git clone https://github.com/purvjoshi04/crud-dd-task-mean-app.git
cd your-repo
```

### 2. Create backend environment file

```bash
# backend/.env
MONGODB_URL=mongodb://admin:Admin1234@mongodb:27017/mydb?authSource=admin
```

### 3. Run with Docker Compose

```bash
docker compose up -d --build
```

### 4. Access the application

| Service | URL |
|---|---|
| Frontend | http://localhost:8081 |
| Backend API | http://localhost:8080/api |
| MongoDB | localhost:27017 |

---

## 🐳 Docker Configuration

### Frontend Dockerfile (Multi-stage)

```dockerfile
# Stage 1 - Build Angular app
FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# Stage 2 - Serve with Nginx
FROM nginx:alpine
COPY --from=build /app/dist/angular-15-crud /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

### Backend Dockerfile

```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
EXPOSE 8080
CMD ["npm", "start"]
```

### Docker Compose

```yaml
services:
  frontend:
    image: ${DOCKER_USERNAME}/projects:frontend
    container_name: frontend
    ports:
      - "8081:80"
    depends_on:
      - backend

  backend:
    image: ${DOCKER_USERNAME}/projects:backend
    container_name: backend
    ports:
      - "8080:8080"
    env_file:
      - ./backend/.env
    depends_on:
      - mongodb

  mongodb:
    image: mongo:latest
    container_name: mongodb
    ports:
      - "27017:27017"
    environment:
      MONGO_INITDB_ROOT_USERNAME: admin
      MONGO_INITDB_ROOT_PASSWORD: Admin1234
      MONGO_INITDB_DATABASE: mydb
    volumes:
      - mongodb_data:/data/db

volumes:
  mongodb_data:
```

---

## 🚀 CI/CD Pipeline (GitHub Actions)

The pipeline triggers on every push to the `main` branch and performs two jobs:

### Job 1: Build & Push Docker Images
- Checks out code
- Logs in to Docker Hub
- Builds and pushes `frontend` and `backend` images to Docker Hub

### Job 2: Deploy to AWS EC2
- Copies `docker-compose.yml` to EC2 via SCP
- SSHs into EC2 and:
  - Creates `.env` files dynamically from GitHub Secrets
  - Logs into Docker Hub
  - Pulls latest images
  - Restarts containers with `docker compose up -d`
  - Prunes old images

### Pipeline Flow

```
Push to main
     │
     ▼
Build & Push Job
├── Checkout code
├── Login to Docker Hub
├── Build & push frontend image
└── Build & push backend image
     │
     ▼
Deploy Job (runs after Build & Push)
├── Checkout code
├── Copy docker-compose.yml to EC2
└── SSH into EC2
    ├── Create .env files
    ├── Docker login
    ├── docker compose pull
    ├── docker compose up -d
    └── docker image prune
```

---

## 🔐 GitHub Secrets Setup

Go to your GitHub repo → **Settings → Secrets and variables → Actions** and add:

| Secret Name | Description |
|---|---|
| `DOCKER_USERNAME` | Your Docker Hub username |
| `DOCKER_PASSWORD` | Your Docker Hub password or access token |
| `EC2_HOST` | EC2 public IP address |
| `EC2_USER` | EC2 username (e.g., `ubuntu`) |
| `EC2_SSH_KEY` | Contents of your `.pem` private key file |
| `MONGO_USER` | MongoDB username (`admin`) |
| `MONGO_PASSWORD` | MongoDB password |

---

## ☁️ AWS EC2 Setup

### 1. Launch EC2 Instance

- AMI: Ubuntu 22.04 LTS
- Instance type: t2.micro (free tier)
- Key pair: Download `.pem` file

### 2. Configure Security Group Inbound Rules

| Type | Port | Source |
|---|---|---|
| SSH | 22 | Your IP |
| HTTP | 80 | 0.0.0.0/0 |
| HTTPS | 443 | 0.0.0.0/0 |
| Custom TCP | 8080 | 0.0.0.0/0 |
| Custom TCP | 8081 | 0.0.0.0/0 |

### 3. Install Docker on EC2

```bash
sudo apt update
sudo apt install -y docker.io docker-compose-plugin
sudo systemctl start docker
sudo systemctl enable docker
sudo usermod -aG docker $USER
newgrp docker
```

### 4. Verify installation

```bash
docker --version
docker compose version
```

---

## 🌐 Nginx Setup (Reverse Proxy)

### Install Nginx

```bash
sudo apt update
sudo apt install -y nginx
sudo systemctl start nginx
sudo systemctl enable nginx
```

### Configure Nginx

```bash
sudo nano /etc/nginx/sites-available/myapp
```

```nginx
server {
    listen 80;
    server_name _;

    # Frontend
    location / {
        proxy_pass http://localhost:8081;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # Backend API
    location /api/ {
        proxy_pass http://localhost:8080/api/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### Enable and reload

```bash
sudo ln -s /etc/nginx/sites-available/myapp /etc/nginx/sites-enabled/
sudo rm /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl reload nginx
```

### Allow through firewall

```bash
sudo ufw allow ssh
sudo ufw allow 'Nginx Full'
sudo ufw status
```

---

## 🐳 Docker Hub

Images are stored in a single Docker Hub repository with separate tags:

| Image | Tag |
|---|---|
| Frontend | `purvjoshi4/projects:frontend` |
| Backend | `purvjoshi4/projects:backend` |

---

## 📸 Screenshots

> Add screenshots to a `/screenshots` folder and reference them below.

### CI/CD Pipeline Execution
![CI/CD Pipeline](./screenshots/cicd-pipeline.png)

### Docker Image Build & Push
![Docker Build](./screenshots/docker-build-1.png)
![Docker Build](./screenshots/docker-build-2.png)
![Docker Build](./screenshots/docker-build-3.png)
![Docker Build](./screenshots/docker-build-4.png)

### Docker Hub Repository
![Docker Hub](./screenshots/docker-hub.png)

### Application UI
![Application](./screenshots/app-ui.png)

### Nginx Configuration
![Nginx](./screenshots/nginx-config.png)

---

## 🔧 Troubleshooting

**MongoDB connection refused**
- Check that `@` in password is URL-encoded as `%40` in the connection string

**Frontend not loading**
- Verify Nginx config with `sudo nginx -t`
- Check containers are running: `sudo docker ps`

**CI/CD deploy fails**
- Ensure Docker is running on EC2: `sudo systemctl status docker`
- Verify all GitHub Secrets are set correctly

**API calls going to localhost**
- Update Angular environment file to use relative path `/api` instead of `http://localhost:8080`