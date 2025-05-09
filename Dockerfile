# Use Eclipse Temurin OpenJDK as base image
FROM eclipse-temurin:17-jdk

# 작업 디렉토리 설정
WORKDIR /app

# 애플리케이션 JAR 복사
ARG JAR_FILE=build/libs/*.jar
COPY ${JAR_FILE} app.jar

# 포트 노출
EXPOSE 8080

# 애플리케이션 실행
ENTRYPOINT ["java", "-jar", "app.jar"]
