# 1. Java 17 mühitini quraşdırırıq (Stabil və yüngül versiya)
FROM eclipse-temurin:17-jdk-alpine

# 2. İşçi qovluğu yaradırıq (Bütün fayllar burada toplanacaq)
WORKDIR /app

# 3. Layihənin bütün fayllarını konteynerə kopyalayırıq
COPY . .

# 4. Gradle faylına icazə veririk və proqramı yığırıq (Build)
RUN chmod +x gradlew
RUN ./gradlew build -x test

# 5. Render-in istifadə etdiyi portu açırıq
EXPOSE 8080

# 6. Proqramı işə salırıq (Fayl adından asılı olmayaraq *.jar ilə tapırıq)
ENTRYPOINT ["sh", "-c", "java -jar build/libs/*.jar"]
