# Java mühitini quraşdırırıq
FROM openjdk:17-jdk-slim

# İşçi qovluğu yaradırıq
FROM eclipse-temurin:17-jdk-alpine

# Bütün faylları içəri kopyalayırıq
COPY . .

# Proqramı build edirik (Gradle istifadə edirsinizsə)
RUN chmod +x gradlew
RUN ./gradlew build -x test

# Portu təyin edirik (Render adətən 8080 istifadə edir)
EXPOSE 8080

# Proqramı işə salırıq
CMD ["java", "-jar", "build/libs/backandpremiumreklam-0.0.1-SNAPSHOT.jar"]
