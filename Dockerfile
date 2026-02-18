# Multi-stage Dockerfile for Spring Boot application

# 1. Frontend Build Stage (React)
FROM node:18 AS frontend-builder
WORKDIR /app
COPY aidiary/package*.json ./
# [FIX] corrupted lockfile causing 404
RUN rm -f package-lock.json
RUN npm install
COPY aidiary/ ./
RUN npm run build

# 2. Backend Build Stage (Gradle)
FROM gradle:8.5-jdk17 AS builder
WORKDIR /app
# 1. 의존성 설치 (캐시 활용)
COPY gradlew .
COPY gradle gradle
COPY build.gradle .
COPY settings.gradle .
RUN chmod +x ./gradlew
RUN ./gradlew dependencies --no-daemon || return 0

# 2. 소스 복사 및 빌드
COPY src src

# [CRITICAL] Copy Frontend Build Output to Spring Boot Static Resources
COPY --from=frontend-builder /app/build src/main/resources/static

RUN ./gradlew bootJar -x test --no-daemon

# 3. Runtime Stage
FROM eclipse-temurin:17-jdk
WORKDIR /app
# Copy the built jar from builder stage
COPY --from=builder /app/build/libs/*.jar app.jar
# Expose application port
EXPOSE 8080
# Run the application
ENTRYPOINT ["java", "-jar", "app.jar"]
