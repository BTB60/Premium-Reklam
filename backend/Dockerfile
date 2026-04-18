FROM gradle:8.5-jdk17-alpine AS builder
WORKDIR /app
COPY . .
RUN ./gradlew clean bootJar -x test --no-daemon --no-build-cache

FROM eclipse-temurin:17-jre-alpine
WORKDIR /app
COPY --from=builder /app/build/libs/*.jar app.jar
EXPOSE 8080
ENTRYPOINT ["java","-Dspring.profiles.active=production","-Dserver.port=${PORT:-8080}","-jar","app.jar"]