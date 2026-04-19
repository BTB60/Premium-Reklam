FROM maven:3.9.6-eclipse-temurin-17-alpine AS builder
WORKDIR /app
COPY . .
# UTF-8 BOM breaks javac; some editors save .java with BOM on Windows
RUN printf '\357\273\277' > /tmp/bom.ref && \
    for f in $(find src -name "*.java" 2>/dev/null); do \
      head -c3 "$f" 2>/dev/null | cmp -s - /tmp/bom.ref 2>/dev/null && \
        tail -c +4 "$f" > "$f.tmp" && mv "$f.tmp" "$f" || true; \
    done && rm -f /tmp/bom.ref
RUN mvn clean package -DskipTests

FROM eclipse-temurin:17-jre-alpine
WORKDIR /app
COPY --from=builder /app/target/*.jar app.jar

# Ensure Postgres/JPA production config is always used in this image (Render UI env overrides if set).
ENV SPRING_PROFILES_ACTIVE=production

# Render sets PORT, DATABASE_URL, etc. as container environment variables; the JVM inherits them.
# No need for -Dspring.datasource.url — use DatabaseUrlBootstrap / PostgresDatasourceUrlSupport instead.
EXPOSE 8080

# Bind all interfaces so Render detects an open PORT (if the JVM reaches Tomcat startup).
ENTRYPOINT ["sh", "-c", "exec java -Dserver.port=${PORT:-8080} -Dserver.address=0.0.0.0 -jar app.jar"]
