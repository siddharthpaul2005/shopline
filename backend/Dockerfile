# --- Build stage: compile and package the runnable jar ---
FROM maven:3.9.9-eclipse-temurin-21 AS build
WORKDIR /app
COPY pom.xml .
RUN mvn -B -q dependency:go-offline
COPY src ./src
RUN mvn -B -q package -DskipTests

# --- Run stage: just a JRE and the jar ---
FROM eclipse-temurin:21-jre
WORKDIR /app
COPY --from=build /app/target/shopline-backend.jar app.jar
RUN useradd --system --no-create-home shopline
USER shopline
# Most hosts (Render, Railway, Fly) pass the port to listen on in $PORT; the app reads it.
EXPOSE 8080
ENTRYPOINT ["java", "-XX:MaxRAMPercentage=75", "-jar", "app.jar"]
