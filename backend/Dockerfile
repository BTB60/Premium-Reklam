FROM eclipse-temurin:17-jre-alpine
WORKDIR /app
COPY build/libs/*.jar app.jar
EXPOSE 8080
ENTRYPOINT ["java","-Dspring.profiles.active=production","-Dserver.port=${PORT:-8080}","-jar","app.jar"]