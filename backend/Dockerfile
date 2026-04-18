FROM gradle:8.5-jdk17-alpine AS builder
WORKDIR /app

# опируем только файлы зависимостей для кэширования слоёв
COPY build.gradle settings.gradle ./
COPY gradle gradle
COPY gradlew ./
RUN chmod +x gradlew
RUN ./gradlew dependencies --no-daemon

# опируем исходный код и собираем JAR
COPY . .
RUN ./gradlew clean bootJar -x test --no-daemon

# антайм-образ
FROM eclipse-temurin:17-jre-alpine
WORKDIR /app
COPY --from=builder /app/build/libs/*.jar app.jar

EXPOSE 8080
ENTRYPOINT ["sh", "-c", "java -Dserver.port=${PORT:-8080} -jar app.jar"]
