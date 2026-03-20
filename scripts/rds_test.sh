#!/bin/bash
# RDS connection test script

# Load environment variables if .env.prod exists
if [ -f .env.prod ]; then
    export $(grep -v '^#' .env.prod | xargs)
fi

echo "Testing RDS Connection..."
echo "URL: $DB_URL"
echo "User: $DB_USERNAME"

# Extract host and port from JDBC URL
# e.g., jdbc:mariadb://<endpoint>:3306/ai_diary
DB_HOST=$(echo $DB_URL | sed -e 's/jdbc:mariadb:\/\///' -e 's/:.*//')
DB_PORT=$(echo $DB_URL | sed -e 's/.*://' -e 's/\/.*//')

echo "Host: $DB_HOST"
echo "Port: $DB_PORT"

# 1. TCP Connection Test
echo "--- 1. TCP Port Check ---"
nc -zv $DB_HOST $DB_PORT

# 2. MariaDB Client Test (if installed)
if command -v mariadb &> /dev/null; then
    echo "--- 2. MariaDB Client Login Test ---"
    mariadb -h $DB_HOST -P $DB_PORT -u $DB_USERNAME -p$DB_PASSWORD -e "SELECT 1;"
else
    echo "--- 2. MariaDB Client not found, skipping client test ---"
fi

echo "--- Troubleshooting Tips ---"
echo "1. If TCP check fails: Check RDS Security Group (Inbound 3306 for EC2 IP)."
echo "2. If Login fails: Check DB_USERNAME and DB_PASSWORD in .env.prod."
echo "3. If Database not found: Check if the database 'ai_diary' exists in RDS."
