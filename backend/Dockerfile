FROM eclipse-temurin:17-jdk-alpine
WORKDIR /app
COPY . .
RUN chmod +x gradlew
RUN ./gradlew bootJar -x test
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "build/libs/premium-reklam-backend-1.0.0.jar"]
