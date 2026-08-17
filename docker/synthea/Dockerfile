# Runs the official, prebuilt Synthea (MITRE's synthetic patient generator) uber-jar — bundles its
# module/demographic data, so no local JDK/Gradle build is needed, just a JRE to run it. Replaces
# the hand-written JSON mock hospitals; see docs/PROGRESS.md decisions log and docs/USAGE.md
# "Hospital data (Synthea + HAPI FHIR)" for how this fits into the pipeline.
FROM eclipse-temurin:17-jre-jammy

WORKDIR /synthea

# curl with retries instead of `ADD <url>` — the jar is ~200MB and ADD doesn't retry on a dropped
# connection, which a single-shot fetch of a file this size hits often enough to be worth avoiding.
RUN apt-get update \
    && apt-get install -y --no-install-recommends curl \
    && rm -rf /var/lib/apt/lists/* \
    && curl -fSL --retry 5 --retry-delay 2 --retry-all-errors \
       -o synthea.jar \
       https://github.com/synthetichealth/synthea/releases/download/v4.0.0/synthea-with-dependencies.jar

ENTRYPOINT ["java", "-jar", "synthea.jar"]
