# Multi-stage Dockerfile for Spring Boot application
# Builder stage using Gradle
FROM gradle:8.5-jdk17 AS builder
WORKDIR /app
# Copy source files
COPY . .
# Build the jar (bootJar task)
RUN ./gradlew bootJar --no-daemon

# Runtime stage using Eclipse Temurin JDK
FROM eclipse-temurin:17-jdk
WORKDIR /app
# Copy the built jar from builder stage
COPY --from=builder /app/build/libs/*.jar app.jar
# Expose application port
EXPOSE 8080
# Run the application
ENTRYPOINT ["java", "-jar", "app.jar"]
