#!/bin/bash
# Helper script to start infrastructure for AiDiary

echo "🚀 Starting AiDiary Infrastructure..."

# 1. Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "⚠️ Docker is not running. Attempting to start (Mac/Colima)..."
    if command -v colima > /dev/null; then
        colima start
    else
        open -a Docker
        echo "Waiting for Docker to start..."
        until docker info > /dev/null 2>&1; do
            sleep 5
            echo "."
        done
    fi
fi

# 2. Start services using Docker Compose
echo "Starting containers (mariadb, redis, rabbitmq)..."
docker-compose up -d mariadb redis rabbitmq

echo "✅ Infrastructure is up and running!"
echo "Database: localhost:3307"
echo "Redis: localhost:6379"
echo "RabbitMQ: localhost:15672 (Management UI: guest/guest)"
