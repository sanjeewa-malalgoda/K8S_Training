# Lab 15 - Develop and Deploy a Custom Java Mediator for WSO2 MI

This lab adds a custom Java mediator to the MI deployment from Lab 14.

You build a Maven JAR, load it into the running MI pods, update the existing
`/citizen` API, and call a new endpoint that invokes your mediator.

Complete this first:

| Previous lab | Required state |
|---|---|
| Lab 14 | `cloud-citizen-info-mi` deployment exists in `minikube-demo` |

This lab assumes the Lab 12 direct Synapse ConfigMap path is still used after
Lab 14. If Lab 14 HPA still has multiple replicas, that is OK. The custom
mediator JAR and API ConfigMap are mounted into every MI pod during rollout.

---

# 1. What You Build

```text
curl pod
  -> Kubernetes Service: cloud-citizen-info-mi
  -> WSO2 MI pod
  -> /citizen/audit/{id}
  -> Java class mediator
  -> JSON audit response
```

This lab uses:

| Need | Resource |
|---|---|
| Namespace | `minikube-demo` |
| Existing deployment | `cloud-citizen-info-mi` |
| Maven project | `mediator/citizen-audit-mediator` |
| Java class | `com.example.mi.mediator.CitizenAuditMediator` |
| Built JAR | `citizen-audit-mediator-1.0.0.jar` |
| MI JAR path | `/home/wso2carbon/wso2mi-4.6.0/lib` |
| API endpoint | `GET /citizen/audit/{id}` |

---

# 2. Prerequisites

Run commands from the repository root.

Required:

```text
Docker Desktop is running
minikube is running with the Docker driver
kubectl works
Helm release citizen-info-mi exists
JDK 21 is installed
Maven works
```

## Install Maven if Needed

Skip this subsection if `mvn -version` already works.

### Windows PowerShell

Run PowerShell as a normal user:

```powershell
$MavenVersion = "3.9.16"
$InstallRoot = "C:\Tools"
$MavenHome = "$InstallRoot\apache-maven-$MavenVersion"
$Zip = "$env:TEMP\apache-maven-$MavenVersion-bin.zip"
$Url = "https://dlcdn.apache.org/maven/maven-3/$MavenVersion/binaries/apache-maven-$MavenVersion-bin.zip"

New-Item -ItemType Directory -Path $InstallRoot -Force
Invoke-WebRequest -Uri $Url -OutFile $Zip
Expand-Archive -Path $Zip -DestinationPath $InstallRoot -Force

[Environment]::SetEnvironmentVariable("MAVEN_HOME", $MavenHome, "User")

$UserPath = [Environment]::GetEnvironmentVariable("Path", "User")
$CleanPath = ($UserPath -split ";" | Where-Object { $_ -notlike "*apache-maven-*" }) -join ";"

if ($CleanPath -notlike "*apache-maven-$MavenVersion\bin*") {
  [Environment]::SetEnvironmentVariable("Path", "$CleanPath;$MavenHome\bin", "User")
}

$env:MAVEN_HOME = $MavenHome
$env:Path = "$MavenHome\bin;$env:Path"

mvn -version
```

Expected output includes:

```text
Apache Maven 3.9.16
```

If `Invoke-WebRequest` returns `Not Found`, check the current Maven version on
the official download page and update `$MavenVersion`:

```text
https://maven.apache.org/download.cgi
```

### macOS Terminal

If Homebrew is installed, use:

```bash
brew install maven
mvn -version
```

Expected output includes:

```text
Apache Maven
```

If Homebrew is not installed, use the Apache binary archive:

```bash
MAVEN_VERSION="3.9.16"
MAVEN_HOME="$HOME/tools/apache-maven-$MAVEN_VERSION"
ARCHIVE="$HOME/Downloads/apache-maven-$MAVEN_VERSION-bin.tar.gz"
URL="https://dlcdn.apache.org/maven/maven-3/$MAVEN_VERSION/binaries/apache-maven-$MAVEN_VERSION-bin.tar.gz"

mkdir -p "$HOME/tools"
curl -L "$URL" -o "$ARCHIVE"
tar -xzf "$ARCHIVE" -C "$HOME/tools"

grep -qxF "export MAVEN_HOME=\"$MAVEN_HOME\"" "$HOME/.zshrc" || echo "export MAVEN_HOME=\"$MAVEN_HOME\"" >> "$HOME/.zshrc"
grep -qxF 'export PATH="$MAVEN_HOME/bin:$PATH"' "$HOME/.zshrc" || echo 'export PATH="$MAVEN_HOME/bin:$PATH"' >> "$HOME/.zshrc"

export MAVEN_HOME="$MAVEN_HOME"
export PATH="$MAVEN_HOME/bin:$PATH"

mvn -version
```

Expected output includes:

```text
Apache Maven 3.9.16
```

Validate:

```powershell
kubectl get deployment cloud-citizen-info-mi -n minikube-demo
kubectl get hpa cloud-citizen-info-mi -n minikube-demo
java -version
mvn -version
```

Expected output includes:

```text
cloud-citizen-info-mi
Java version 21
Apache Maven
```

If HPA was disabled at the end of Lab 14, the `kubectl get hpa` command may
return `NotFound`. That is OK for this lab.

---

# 3. Build the Custom Mediator JAR

The mediator reads the citizen ID from the URI, calculates a demo risk score,
sets Synapse message properties, and returns control to the API sequence.

The first Maven run downloads the Maven compiler plugin and a few compile-time
JARs. It should not take 30 minutes. If Maven appears to download a very large
number of WSO2 runtime JARs, stop it with `Ctrl+C`, pull the latest lab files,
and rerun the command below.

## Windows PowerShell

```powershell
$REPO = (Get-Location).Path
$MEDIATOR = "$REPO\labs\15-wso2-mi-custom-java-mediator\mediator\citizen-audit-mediator"

mvn -f "$MEDIATOR\pom.xml" clean package -DskipTests -ntp
Test-Path "$MEDIATOR\target\citizen-audit-mediator-1.0.0.jar"
```

Expected output includes:

```text
BUILD SUCCESS
True
```

## macOS Terminal

```bash
REPO="$(pwd)"
MEDIATOR="$REPO/labs/15-wso2-mi-custom-java-mediator/mediator/citizen-audit-mediator"

mvn -f "$MEDIATOR/pom.xml" clean package -DskipTests -ntp
test -f "$MEDIATOR/target/citizen-audit-mediator-1.0.0.jar" && echo "mediator jar found"
```

Expected output includes:

```text
BUILD SUCCESS
mediator jar found
```

---

# 4. Create the Mediator JAR ConfigMap

The MI pod needs the JAR at startup. This ConfigMap stores the built JAR so it
can be mounted into the MI runtime.

## Windows PowerShell

```powershell
$REPO = (Get-Location).Path
$JAR = "$REPO\labs\15-wso2-mi-custom-java-mediator\mediator\citizen-audit-mediator\target\citizen-audit-mediator-1.0.0.jar"

kubectl create configmap citizen-audit-mediator-jar `
  -n minikube-demo `
  --from-file=citizen-audit-mediator-1.0.0.jar=$JAR `
  --dry-run=client `
  -o yaml | kubectl apply -f -
```

Expected output:

```text
configmap/citizen-audit-mediator-jar created
```

If it already exists, `configured` is also OK.

## macOS Terminal

```bash
REPO="$(pwd)"
JAR="$REPO/labs/15-wso2-mi-custom-java-mediator/mediator/citizen-audit-mediator/target/citizen-audit-mediator-1.0.0.jar"

kubectl create configmap citizen-audit-mediator-jar \
  -n minikube-demo \
  --from-file=citizen-audit-mediator-1.0.0.jar="$JAR" \
  --dry-run=client \
  -o yaml | kubectl apply -f -
```

Expected output:

```text
configmap/citizen-audit-mediator-jar created
```

---

# 5. Update the MI API ConfigMap

This replaces the Lab 12 API XML with a version that keeps the old endpoints and
adds:

```text
GET /citizen/audit/{id}
```

## Windows PowerShell

```powershell
$REPO = (Get-Location).Path
$API_XML = "$REPO\labs\15-wso2-mi-custom-java-mediator\artifacts\synapse-configs\default\api\citizen-info-api-with-mediator.xml"

kubectl create configmap citizen-info-api-synapse `
  -n minikube-demo `
  --from-file=citizen-info-api.xml=$API_XML `
  --dry-run=client `
  -o yaml | kubectl apply -f -
```

Expected output:

```text
configmap/citizen-info-api-synapse configured
```

## macOS Terminal

```bash
REPO="$(pwd)"
API_XML="$REPO/labs/15-wso2-mi-custom-java-mediator/artifacts/synapse-configs/default/api/citizen-info-api-with-mediator.xml"

kubectl create configmap citizen-info-api-synapse \
  -n minikube-demo \
  --from-file=citizen-info-api.xml="$API_XML" \
  --dry-run=client \
  -o yaml | kubectl apply -f -
```

Expected output:

```text
configmap/citizen-info-api-synapse configured
```

---

# 6. Mount the API XML and JAR, Then Restart MI Pods

Lab 15 uses the direct Synapse API XML mount from Lab 12, even if your current
MI pod also has the Lab 13 `carbonapps` PVC. Apply both patches before the
restart.

The JAR patch mounts the custom mediator JAR into:

```text
/home/wso2carbon/wso2mi-4.6.0/lib
```

## Windows PowerShell

```powershell
$REPO = (Get-Location).Path

kubectl patch deployment cloud-citizen-info-mi `
  -n minikube-demo `
  --type strategic `
  --patch-file "$REPO\labs\15-wso2-mi-custom-java-mediator\k8s\mi-custom-mediator-jar-mount-patch.yaml"

kubectl patch deployment cloud-citizen-info-mi `
  -n minikube-demo `
  --type strategic `
  --patch-file "$REPO\labs\12-wso2-mi-scaling\k8s\mi-citizen-api-configmap-mount-patch.yaml"

kubectl rollout restart deployment/cloud-citizen-info-mi -n minikube-demo
kubectl rollout status deployment/cloud-citizen-info-mi -n minikube-demo --timeout=5m
```

Expected output:

```text
deployment.apps/cloud-citizen-info-mi patched
deployment.apps/cloud-citizen-info-mi patched
deployment.apps/cloud-citizen-info-mi restarted
deployment "cloud-citizen-info-mi" successfully rolled out
```

## macOS Terminal

```bash
REPO="$(pwd)"

kubectl patch deployment cloud-citizen-info-mi \
  -n minikube-demo \
  --type strategic \
  --patch-file "$REPO/labs/15-wso2-mi-custom-java-mediator/k8s/mi-custom-mediator-jar-mount-patch.yaml"

kubectl patch deployment cloud-citizen-info-mi \
  -n minikube-demo \
  --type strategic \
  --patch-file "$REPO/labs/12-wso2-mi-scaling/k8s/mi-citizen-api-configmap-mount-patch.yaml"

kubectl rollout restart deployment/cloud-citizen-info-mi -n minikube-demo
kubectl rollout status deployment/cloud-citizen-info-mi -n minikube-demo --timeout=5m
```

Expected output:

```text
deployment.apps/cloud-citizen-info-mi patched
deployment.apps/cloud-citizen-info-mi patched
deployment.apps/cloud-citizen-info-mi restarted
deployment "cloud-citizen-info-mi" successfully rolled out
```

---

# 7. Validate the JAR and API Are Loaded

Check that the JAR is visible inside the MI pod:

```powershell
kubectl exec -n minikube-demo deployment/cloud-citizen-info-mi -- ls -l /home/wso2carbon/wso2mi-4.6.0/lib/citizen-audit-mediator-1.0.0.jar
kubectl exec -n minikube-demo deployment/cloud-citizen-info-mi -- grep -n "audit" /home/wso2carbon/wso2mi-4.6.0/repository/deployment/server/synapse-configs/default/api/citizen-info-api.xml
```

Expected output includes:

```text
citizen-audit-mediator-1.0.0.jar
uri-template="/audit/{id}"
```

Check startup logs:

```powershell
kubectl logs -n minikube-demo deployment/cloud-citizen-info-mi --tail=300 | Select-String "CitizenInfoAPI|CitizenAuditMediator|ERROR"
```

Expected output includes:

```text
Initializing API: CitizenInfoAPI
```

The `CitizenAuditMediator` log appears after the first `/citizen/audit` call.

---

# 8. Invoke the API That Uses the Mediator

## Health check first

```powershell
kubectl run mi-health-check -n minikube-demo --rm -i --restart=Never --image=curlimages/curl:8.10.1 -- -v -k -sS -w "`nHTTP %{http_code}`n" https://cloud-citizen-info-mi:8253/citizen/health
```

Expected response:

```json
{
  "service": "citizen-info-mi",
  "status": "UP",
  "pod": "cloud-citizen-info-mi-xxxxxxxxxx-xxxxx"
}
HTTP 200
```

## Call the custom mediator endpoint

```powershell
kubectl run mi-audit-check -n minikube-demo --rm -i --restart=Never --image=curlimages/curl:8.10.1 -- -v -k -sS -w "`nHTTP %{http_code}`n" https://cloud-citizen-info-mi:8253/citizen/audit/CIT-1001
```

Expected response:

```json
{
  "citizenId": "CIT-1001",
  "agency": "BT-CITIZEN-SERVICES",
  "auditDecision": "REVIEW_REQUIRED",
  "riskScore": "73",
  "handledByPod": "cloud-citizen-info-mi-xxxxxxxxxx-xxxxx",
  "mediator": "com.example.mi.mediator.CitizenAuditMediator"
}
HTTP 200
```

The exact `riskScore`, `auditDecision`, and pod name can vary by citizen ID and
running pod.

Check the mediator log:

```powershell
kubectl logs -n minikube-demo deployment/cloud-citizen-info-mi --tail=300 | Select-String "CitizenAuditMediator enriched request"
```

Expected output includes:

```text
CitizenAuditMediator enriched request for CIT-1001
```

---

# 9. Cleanup

Warning: this restores the original Lab 12 API XML. The custom mediator JAR
ConfigMap is left in place because the deployment still references it after the
manual patch. It is harmless when the API no longer calls the mediator.

## Windows PowerShell

```powershell
$REPO = (Get-Location).Path
$API_XML = "$REPO\labs\12-wso2-mi-scaling\artifacts\synapse-configs\default\api\citizen-info-api.xml"

kubectl create configmap citizen-info-api-synapse `
  -n minikube-demo `
  --from-file=citizen-info-api.xml=$API_XML `
  --dry-run=client `
  -o yaml | kubectl apply -f -

kubectl rollout restart deployment/cloud-citizen-info-mi -n minikube-demo
kubectl rollout status deployment/cloud-citizen-info-mi -n minikube-demo --timeout=5m
```

## macOS Terminal

```bash
REPO="$(pwd)"
API_XML="$REPO/labs/12-wso2-mi-scaling/artifacts/synapse-configs/default/api/citizen-info-api.xml"

kubectl create configmap citizen-info-api-synapse \
  -n minikube-demo \
  --from-file=citizen-info-api.xml="$API_XML" \
  --dry-run=client \
  -o yaml | kubectl apply -f -

kubectl rollout restart deployment/cloud-citizen-info-mi -n minikube-demo
kubectl rollout status deployment/cloud-citizen-info-mi -n minikube-demo --timeout=5m
```

Expected output includes:

```text
configmap/citizen-info-api-synapse configured
deployment.apps/cloud-citizen-info-mi restarted
deployment "cloud-citizen-info-mi" successfully rolled out
```

Validation:

```powershell
kubectl run mi-audit-cleanup-check -n minikube-demo --rm -i --restart=Never --image=curlimages/curl:8.10.1 -- -v -k -sS -w "`nHTTP %{http_code}`n" https://cloud-citizen-info-mi:8253/citizen/audit/CIT-1001
```

Expected output:

```text
HTTP 404
```

---

# Troubleshooting

| Error | Meaning | Fix | Validation |
|---|---|---|---|
| `mvn` is not recognized | Maven is not installed or not on PATH | Run the Maven install steps in section 2, reopen the terminal, and rerun section 3 | `mvn -version` shows Apache Maven |
| `invalid target release: 21` | Maven is using an older JDK | Set `JAVA_HOME` to JDK 21 and reopen the terminal | `java -version` and `mvn -version` show JDK 21 |
| Maven keeps downloading many WSO2 runtime JARs | The old POM used the full MI runtime dependency instead of the smaller Synapse compile dependency | Stop Maven with `Ctrl+C`, pull the latest lab files, and rerun section 3 with `-ntp` | Build reaches `BUILD SUCCESS` after a short dependency download |
| Maven cannot download dependencies | The laptop cannot reach Maven Central or WSO2 Maven repository | Check internet, proxy settings, and access to `https://maven.wso2.org` | `mvn -f ... clean package` shows `BUILD SUCCESS` |
| `ClassNotFoundException: com.example.mi.mediator.CitizenAuditMediator` | The JAR was mounted to the wrong path, or MI did not restart after the mount | Re-run sections 4 and 6 with the latest lab patch | `kubectl exec ... ls -l /home/wso2carbon/wso2mi-4.6.0/lib/citizen-audit-mediator-1.0.0.jar` shows the JAR |
| `/citizen/audit/CIT-1001` returns `HTTP 404` | The updated API XML was not loaded, often because the Lab 12 API ConfigMap mount patch was not applied after Lab 13 or Lab 14 | Re-run sections 5 and 6 | `grep -n "audit" .../citizen-info-api.xml` shows the audit resource and the endpoint returns `HTTP 200` |
| Existing `/citizen/health` stops working | The API ConfigMap was replaced with a bad XML file | Restore the Lab 12 API XML using section 9, then reapply sections 5 and 6 carefully | `/citizen/health` returns `HTTP 200` |

---

# Notes

- This lab uses a plain Java class mediator JAR, not a CAR file.
- The Maven dependencies are `provided` because MI already provides the runtime
  libraries.
- MI must restart after the JAR is mounted because the Java class must be on the
  runtime classpath when the API loads.
- Commands in this lab were drafted for the same minikube and Helm setup used
  by Labs 12-14.
