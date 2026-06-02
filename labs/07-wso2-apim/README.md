# Lab 07 - WSO2 API Manager 4.6.0 (All-in-One) on Kubernetes

## What is WSO2 API Manager?

**WSO2 API Manager (APIM)** is an enterprise API management platform. It provides:

- **API Publisher** - Developers design and publish APIs
- **Developer Portal** - API consumers discover and use APIs
- **API Gateway** - Routes, authenticates, and throttles API requests
- **Key Manager** - Manages OAuth tokens and credentials
- **Traffic Manager** - Monitors and controls API traffic

### Real-world example

Imagine a bank:
- **Internal service** - Account balance microservice
- **Problem** - Need to expose it securely to mobile apps, partners, third-party developers
- **Solution** - Use APIM:
  - Publisher: Bank team publishes "Get Account Balance" API
  - DevPortal: Mobile app developers discover and subscribe to the API
  - Gateway: Routes requests, checks OAuth tokens, enforces rate limits
  - Traffic Manager: Monitors traffic spikes

---

## What You'll Deploy

This lab installs the **complete WSO2 APIM stack** using Helm:

| Resource | Name | Purpose |
|----------|------|---------|
| **Namespace** | `wso2` | Isolates APIM resources |
| **Helm Release** | `apim` | WSO2 APIM All-in-One 4.6.0 |
| **Deployment** | APIM pods | Publisher, DevPortal, Gateway, KM, TM |
| **Service** | ClusterIP + Ingress | Exposes APIM to browser |
| **Ingress** | `am.wso2.com` | HTTP routing for APIM services |
| **ConfigMap** | APIM configuration | Database, cache, API settings |
| **PersistentVolume** | H2 embedded database | Stores API definitions, user data |

### Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    Your Browser                                 │
│                                                                  │
│  Publisher:   https://am.wso2.com/publisher/                   │
│  DevPortal:   https://am.wso2.com/devportal/                   │
│  Admin:       https://am.wso2.com/admin/                        │
└──────────────────────────┬──────────────────────────────────────┘
                           │
                           │ HTTP/HTTPS
                           ↓
        ┌──────────────────────────────────────────┐
        │      Minikube Cluster (wso2 namespace)   │
        │                                          │
        │  ┌─────────────────────────────────────┐ │
        │  │ NGINX Ingress Controller            │ │
        │  │ (am.wso2.com → APIM Service)        │ │
        │  └────────────┬────────────────────────┘ │
        │               │                          │
        │               ↓                          │
        │  ┌─────────────────────────────────────┐ │
        │  │  WSO2 APIM All-in-One Pod (Running) │ │
        │  │  - Publisher                        │ │
        │  │  - DevPortal                        │ │
        │  │  - Admin Console                    │ │
        │  │  - Gateway                          │ │
        │  │  - Key Manager                      │ │
        │  │  - Traffic Manager                  │ │
        │  │  - H2 Embedded Database             │ │
        │  └─────────────────────────────────────┘ │
        │                                          │
        └──────────────────────────────────────────┘
```

### Why Helm?

This lab uses **Helm** to install APIM because:
- **Complex app** - APIM requires 10+ Kubernetes resources (deployments, services, configmaps, ingress)
- **One command** - Instead of writing all YAML, one `helm install` does it
- **Configuration management** - `values-local.yaml` overrides (public images, H2 database)
- **Production standard** - Real deployments use Helm for package management

---

## Prerequisites

This lab is for:

```
Windows / macOS
Docker Desktop
Minikube
PowerShell / Bash
WSO2 APIM Helm chart all-in-one-4.6.0-2
```

Before starting, ensure:

✓ Docker Desktop is installed and running
✓ Minikube is installed
✓ kubectl is installed
✓ Helm is installed

Check versions:

**Windows (PowerShell):**

```powershell
docker version
minikube version
kubectl version --client
helm version
```

**macOS (Terminal):**

```bash
docker version
minikube version
kubectl version --client
helm version
```

**Resource Requirements:**
- **Minimum 16 GB RAM** (APIM needs 4 GB + minikube overhead)
- **Minimum 40 GB disk**
- **4 CPU cores**

---

# 1. Start Minikube with enough resources

WSO2 APIM is heavy. Use enough CPU, memory, and disk.

**Windows (PowerShell):**

```powershell
minikube delete
minikube start --cpus=4 --memory=10240 --disk-size=40g --driver=docker
```

**macOS (Terminal):**

```bash
minikube delete
minikube start --cpus=4 --memory=10240 --disk-size=40g --driver=docker
```

Check node:

```bash
kubectl get nodes
```

Expected:

```
NAME       STATUS   ROLES           VERSION
minikube   Ready    control-plane   ...
```

---

# 2. Enable ingress

Enable Minikube ingress addon:

```powershell
minikube addons enable ingress
```

Wait until ingress controller is running:

```powershell
kubectl get pods -n ingress-nginx -w
```

Expected:

```
ingress-nginx-controller-xxxxx   1/1   Running
```

Stop watching:

```
Ctrl + C
```

---

# 3. Download WSO2 APIM Helm chart

**Windows (PowerShell):**

Go to Downloads:

```powershell
cd $env:USERPROFILE\Downloads
```

Download the WSO2 APIM Helm chart release:

```powershell
$TAG = "all-in-one-4.6.0-2"
$ZIP = "helm-apim-$TAG.zip"
$URL = "https://github.com/wso2/helm-apim/archive/refs/tags/$TAG.zip"

Invoke-WebRequest -Uri $URL -OutFile $ZIP
Expand-Archive -Path $ZIP -DestinationPath . -Force
```

Go to the chart folder:

```powershell
cd "$env:USERPROFILE\Downloads\helm-apim-all-in-one-4.6.0-2\all-in-one"
```

Confirm you are in the correct folder:

```powershell
dir
```

**macOS (Terminal):**

Go to Downloads:

```bash
cd ~/Downloads
```

Download the WSO2 APIM Helm chart release:

```bash
TAG="all-in-one-4.6.0-2"
ZIP="helm-apim-$TAG.zip"
URL="https://github.com/wso2/helm-apim/archive/refs/tags/$TAG.zip"

curl -L -o $ZIP $URL
unzip -q $ZIP
```

Go to the chart folder:

```bash
cd helm-apim-all-in-one-4.6.0-2/all-in-one
```

Confirm you are in the correct folder:

```bash
ls
```

You should see:

```
Chart.yaml
values.yaml
templates
```

---

# 4. Create the working values override file

Create this file inside the `all-in-one` chart folder:

```
values-apim-minikube-windows.yaml
```

**Windows (PowerShell):**

```powershell
@'
wso2:
  apim:
    configurations:
      adminUsername: "admin"
      adminPassword: "admin"

      databases:
        type: "h2"
        jdbc:
          driver: "org.h2.Driver"

        apim_db:
          url: "jdbc:h2:./repository/database/WSO2AM_DB;DB_CLOSE_ON_EXIT=FALSE"
          username: "wso2carbon"
          password: "wso2carbon"

        shared_db:
          url: "jdbc:h2:./repository/database/WSO2SHARED_DB;DB_CLOSE_ON_EXIT=FALSE"
          username: "wso2carbon"
          password: "wso2carbon"

      security:
        truststore:
          name: "client-truststore.jks"
          password: "wso2carbon"

  deployment:
    image:
      imagePullPolicy: IfNotPresent
      digest: "sha256:cd69005240af25042e8cd6eccce8fbe9341732bc887b919395c7aaddb43f8d53"

    startupProbe:
      initialDelaySeconds: 180
      periodSeconds: 10
      failureThreshold: 120

    readinessProbe:
      initialDelaySeconds: 180
      periodSeconds: 10
      failureThreshold: 60

    livenessProbe:
      initialDelaySeconds: 300
      periodSeconds: 10
      failureThreshold: 12
'@ | Set-Content .\values-apim-minikube-windows.yaml
```

Verify file:

```powershell
Get-Content .\values-apim-minikube-windows.yaml
```

**macOS (Terminal):**

```bash
cat > values-apim-minikube-windows.yaml << 'EOF'
wso2:
  apim:
    configurations:
      adminUsername: "admin"
      adminPassword: "admin"

      databases:
        type: "h2"
        jdbc:
          driver: "org.h2.Driver"

        apim_db:
          url: "jdbc:h2:./repository/database/WSO2AM_DB;DB_CLOSE_ON_EXIT=FALSE"
          username: "wso2carbon"
          password: "wso2carbon"

        shared_db:
          url: "jdbc:h2:./repository/database/WSO2SHARED_DB;DB_CLOSE_ON_EXIT=FALSE"
          username: "wso2carbon"
          password: "wso2carbon"

      security:
        truststore:
          name: "client-truststore.jks"
          password: "wso2carbon"

  deployment:
    image:
      imagePullPolicy: IfNotPresent
      digest: "sha256:cd69005240af25042e8cd6eccce8fbe9341732bc887b919395c7aaddb43f8d53"

    startupProbe:
      initialDelaySeconds: 180
      periodSeconds: 10
      failureThreshold: 120

    readinessProbe:
      initialDelaySeconds: 180
      periodSeconds: 10
      failureThreshold: 60

    livenessProbe:
      initialDelaySeconds: 300
      periodSeconds: 10
      failureThreshold: 12
EOF
```

Verify file:

```bash
cat values-apim-minikube-windows.yaml
```

---

# 5. Install WSO2 APIM

Run this from the `all-in-one` folder:

**Windows (PowerShell):**

```powershell
helm upgrade --install apim . `
  --namespace wso2 `
  --create-namespace `
  --dependency-update `
  -f values-local.yaml `
  -f values-apim-minikube-windows.yaml
```

**macOS (Terminal):**

```bash
helm upgrade --install apim . \
  --namespace wso2 \
  --create-namespace \
  --dependency-update \
  -f values-local.yaml \
  -f values-apim-minikube-windows.yaml
```

---

# 6. Patch APIM service

APIM calls its own Key Manager endpoint through the Kubernetes service during startup.
Patch the service so the service can publish pod addresses during startup.

**Windows (PowerShell):**

Create patch file:

```powershell
@'
{"spec":{"publishNotReadyAddresses":true}}
'@ | Set-Content .\svc-patch.json
```

Apply patch:

```powershell
kubectl patch svc -n wso2 apim-wso2am-all-in-one-am-service --type merge --patch-file .\svc-patch.json
```

Restart APIM deployment:

```powershell
kubectl rollout restart deployment -n wso2 apim-wso2am-all-in-one-am-deployment-1
```

**macOS (Terminal):**

Create patch file:

```bash
cat > svc-patch.json << 'EOF'
{"spec":{"publishNotReadyAddresses":true}}
EOF
```

Apply patch:

```bash
kubectl patch svc -n wso2 apim-wso2am-all-in-one-am-service --type merge --patch-file svc-patch.json
```

Restart APIM deployment:

```bash
kubectl rollout restart deployment -n wso2 apim-wso2am-all-in-one-am-deployment-1
```

---

# 7. Watch APIM pod until ready

Run:

```powershell
kubectl get pods -n wso2 -w
```

Wait until the pod becomes:

```
apim-wso2am-all-in-one-am-deployment-1-xxxxx   1/1   Running
```

Do not continue until it is:

```
1/1 Running
```

Stop watching:

```
Ctrl + C
```

---

# 8. Verify APIM generated configuration

**Windows (PowerShell):**

Check the generated `deployment.toml`:

```powershell
kubectl get cm -n wso2 apim-wso2am-all-in-one-am-conf-1 -o jsonpath="{.data.deployment\.toml}" | Select-String -Pattern "\[database.apim_db\]|\[database.shared_db\]|type =|url =|username =|driver =|\[truststore\]|password" -Context 0,1
```

**macOS (Terminal):**

Check the generated `deployment.toml`:

```bash
kubectl get cm -n wso2 apim-wso2am-all-in-one-am-conf-1 -o jsonpath="{.data.deployment\.toml}" | grep -A 5 "apim_db\|shared_db\|truststore"
```

Expected values:

```
type = "h2"
driver = "org.h2.Driver"
password = "wso2carbon"
```

Expected H2 URLs:

```
jdbc:h2:./repository/database/WSO2AM_DB;DB_CLOSE_ON_EXIT=FALSE
jdbc:h2:./repository/database/WSO2SHARED_DB;DB_CLOSE_ON_EXIT=FALSE
```

The URLs must not contain:

```
AUTO_SERVER=TRUE
```

---

# 9. Configure hosts file

**Windows:**

Open **Notepad as Administrator**.

Open this file:

```
C:\Windows\System32\drivers\etc\hosts
```

Add this line:

```
127.0.0.1 am.wso2.com
```

Save the file.

Flush DNS:

```powershell
ipconfig /flushdns
```

**macOS:**

Open Terminal and edit hosts file:

```bash
sudo nano /etc/hosts
```

Add this line:

```
127.0.0.1 am.wso2.com
```

Save: **Ctrl+O**, Enter, **Ctrl+X**

Flush DNS:

```bash
sudo dscacheutil -flushcache
```

---

# 10. Start Minikube tunnel

**Windows:**

Open a new **PowerShell window as Administrator**.

Run:

```powershell
minikube tunnel
```

Keep this PowerShell window open.

Do not close it while using APIM in the browser.

**macOS:**

Open a new **Terminal window**.

Run:

```bash
minikube tunnel
```

Keep this Terminal window open.

Do not close it while using APIM in the browser.

---

# 11. Verify ingress and services

**Windows (PowerShell):**

In another PowerShell window, run:

```powershell
kubectl get pods -n wso2
kubectl get svc -n wso2
kubectl get ingress -n wso2
kubectl get pods -n ingress-nginx
kubectl get svc -n ingress-nginx
```

**macOS (Terminal):**

In another Terminal window, run:

```bash
kubectl get pods -n wso2
kubectl get svc -n wso2
kubectl get ingress -n wso2
kubectl get pods -n ingress-nginx
kubectl get svc -n ingress-nginx
```

Confirm:

```
APIM pod is 1/1 Running
ingress-nginx controller is Running
minikube tunnel is running
hosts file has 127.0.0.1 am.wso2.com
```

---

# 12. Open APIM in browser

Final working access URLs:

```
https://am.wso2.com/publisher/
https://am.wso2.com/devportal/
https://am.wso2.com/admin/
```

Accept the browser certificate warning.

**Login:**

```
admin / admin
```

---

# Quick Test: Create and invoke an API

### Step 1: Login to Publisher

Open: https://am.wso2.com/publisher/

Login: `admin` / `admin`

### Step 2: Create API

- Click **Create → REST API → From Scratch**
- Fill:
  - **Name:** `TestAPI`
  - **Context:** `/test`
  - **Version:** `1.0.0`
  - **Endpoint:** `https://httpbin.org/get`
- Click **Create & Publish**

### Step 3: Subscribe in Developer Portal

- Open: https://am.wso2.com/devportal/
- Find `TestAPI`
- Click **Subscribe**
- Select `DefaultApplication`
- Click **Subscribe**

### Step 4: Generate Access Token

- Click **Subscriptions**
- Under `DefaultApplication`, click **Production Keys**
- Click **Generate Keys**
- Copy the **Access Token**

### Step 5: Invoke the API

**Windows (PowerShell):**

```powershell
$token = "paste-your-access-token-here"
curl.exe -k -H "Authorization: Bearer $token" https://am.wso2.com/test/1.0.0/
```

**macOS (Terminal):**

```bash
TOKEN="paste-your-access-token-here"
curl -k -H "Authorization: Bearer $TOKEN" https://am.wso2.com/test/1.0.0/
```

Expected response: JSON from httpbin ✓

---

# Troubleshooting

## Problem 1 — Helm release name already in use

Error:

```
cannot reuse a name that is still in use
```

Check Helm releases:

**Windows (PowerShell):**

```powershell
helm list --namespace wso2
helm list --namespace wso2 --all
```

Check Kubernetes resources:

```powershell
kubectl get all -n wso2
```

**macOS (Terminal):**

```bash
helm list --namespace wso2
helm list --namespace wso2 --all
```

Check Kubernetes resources:

```bash
kubectl get all -n wso2
```

Use this install command again:

**Windows (PowerShell):**

```powershell
helm upgrade --install apim . `
  --namespace wso2 `
  --create-namespace `
  --dependency-update `
  -f values-local.yaml `
  -f values-apim-minikube-windows.yaml
```

**macOS (Terminal):**

```bash
helm upgrade --install apim . \
  --namespace wso2 \
  --create-namespace \
  --dependency-update \
  -f values-local.yaml \
  -f values-apim-minikube-windows.yaml
```

---

## Problem 2 — `ErrImageNeverPull`

Symptom:

```
ErrImageNeverPull
```

Cause:

```
imagePullPolicy: Never
```

Fix used in override file:

```
imagePullPolicy: IfNotPresent
```

---

## Problem 3 — `InvalidImageName`

Symptom:

```
InvalidImageName
```

Cause:

```
digest: "@sha256:..."
```

Fix:

```
digest: "sha256:cd69005240af25042e8cd6eccce8fbe9341732bc887b919395c7aaddb43f8d53"
```

Do not include `@` in the digest value.

---

## Problem 4 — APIM keeps restarting because of startup probe

Symptoms:

```
CrashLoopBackOff
Startup probe failed
Connection refused on localhost:9443
```

Fix used:

```
startupProbe:
  initialDelaySeconds: 180
  periodSeconds: 10
  failureThreshold: 120

readinessProbe:
  initialDelaySeconds: 180
  periodSeconds: 10
  failureThreshold: 60

livenessProbe:
  initialDelaySeconds: 300
  periodSeconds: 10
  failureThreshold: 12
```

---

## Problem 5 — Truststore password missing

Symptoms in logs:

```
java.lang.NullPointerException
org.wso2.carbon.user.core.internal.Activator.startDeploy
```

Fix used:

```
security:
  truststore:
    name: "client-truststore.jks"
    password: "wso2carbon"
```

---

## Problem 6 — Blank JDBC driver

Symptoms in logs:

```
Unable to load class:
ClassNotFoundException:
```

Cause:

```
JDBC driver value is empty.
```

Fix used:

```
databases:
  type: "h2"
  jdbc:
    driver: "org.h2.Driver"
```

---

## Problem 7 — H2 AUTO_SERVER error

Symptoms in logs:

```
Feature not supported: "AUTO_SERVER=TRUE && DB_CLOSE_ON_EXIT=FALSE"
```

Wrong URL:

```
jdbc:h2:./repository/database/WSO2AM_DB;AUTO_SERVER=TRUE;DB_CLOSE_ON_EXIT=FALSE
```

Correct URL:

```
jdbc:h2:./repository/database/WSO2AM_DB;DB_CLOSE_ON_EXIT=FALSE
```

Correct config:

```
apim_db:
  url: "jdbc:h2:./repository/database/WSO2AM_DB;DB_CLOSE_ON_EXIT=FALSE"

shared_db:
  url: "jdbc:h2:./repository/database/WSO2SHARED_DB;DB_CLOSE_ON_EXIT=FALSE"
```

---

## Problem 8 — APIM self-call to service fails

Symptoms in logs:

```
Connect to apim-wso2am-all-in-one-am-service:9443 failed: Connection refused
Failed retrieving Key Manager Configurations from remote endpoint
```

Fix used:

**Windows (PowerShell):**

```powershell
@'
{"spec":{"publishNotReadyAddresses":true}}
'@ | Set-Content .\svc-patch.json

kubectl patch svc -n wso2 apim-wso2am-all-in-one-am-service --type merge --patch-file .\svc-patch.json

kubectl rollout restart deployment -n wso2 apim-wso2am-all-in-one-am-deployment-1
```

**macOS (Terminal):**

```bash
cat > svc-patch.json << 'EOF'
{"spec":{"publishNotReadyAddresses":true}}
EOF

kubectl patch svc -n wso2 apim-wso2am-all-in-one-am-service --type merge --patch-file svc-patch.json

kubectl rollout restart deployment -n wso2 apim-wso2am-all-in-one-am-deployment-1
```

---

## Problem 9 — Browser cannot reach APIM

Check pod:

**Windows (PowerShell):**

```powershell
kubectl get pods -n wso2
```

**macOS (Terminal):**

```bash
kubectl get pods -n wso2
```

Expected:

```
1/1 Running
```

Check ingress controller:

**Windows (PowerShell):**

```powershell
kubectl get pods -n ingress-nginx
```

**macOS (Terminal):**

```bash
kubectl get pods -n ingress-nginx
```

Expected:

```
1/1 Running
```

Check hosts file contains:

```
127.0.0.1 am.wso2.com
```

Flush DNS:

**Windows (PowerShell):**

```powershell
ipconfig /flushdns
```

**macOS (Terminal):**

```bash
sudo dscacheutil -flushcache
```

Confirm Minikube tunnel is running:

**Windows:**

Open Administrator PowerShell window:

```powershell
minikube tunnel
```

**macOS:**

Open Terminal window:

```bash
minikube tunnel
```

Then open:

```
https://am.wso2.com/publisher/
```

---

# Useful Commands

Commands work on both Windows and macOS. Use PowerShell on Windows and Bash on macOS:

**Equivalent commands:**

```powershell
# Windows PowerShell
kubectl get pods -n wso2
kubectl get all -n wso2
kubectl get svc -n wso2
kubectl get ingress -n wso2
kubectl get pods -n ingress-nginx
kubectl get svc -n ingress-nginx
```

```bash
# macOS Terminal (same commands)
kubectl get pods -n wso2
kubectl get all -n wso2
kubectl get svc -n wso2
kubectl get ingress -n wso2
kubectl get pods -n ingress-nginx
kubectl get svc -n ingress-nginx
```

Check APIM logs:

**Windows (PowerShell):**

```powershell
$POD = kubectl get pods -n wso2 -o jsonpath="{.items[0].metadata.name}"
kubectl logs -n wso2 -f $POD
```

**macOS (Terminal):**

```bash
POD=$(kubectl get pods -n wso2 -o jsonpath="{.items[0].metadata.name}")
kubectl logs -n wso2 -f $POD
```

Check previous crash logs:

**Windows (PowerShell):**

```powershell
$POD = kubectl get pods -n wso2 -o jsonpath="{.items[0].metadata.name}"
kubectl logs -n wso2 $POD --previous --tail=200
```

**macOS (Terminal):**

```bash
POD=$(kubectl get pods -n wso2 -o jsonpath="{.items[0].metadata.name}")
kubectl logs -n wso2 $POD --previous --tail=200
```

Check generated APIM configuration:

```bash
kubectl get cm -n wso2 apim-wso2am-all-in-one-am-conf-1 -o jsonpath="{.data.deployment\.toml}"
```

Check service endpoint:

```bash
kubectl get endpoints -n wso2 apim-wso2am-all-in-one-am-service -o wide
```

---

# Final Working Flow

```
Start Docker Desktop
  ↓
Start Minikube with 4 CPU, 10 GB memory, 40 GB disk
  ↓
Enable ingress addon
  ↓
Download WSO2 helm-apim all-in-one-4.6.0-2 chart
  ↓
Create values-apim-minikube-windows.yaml override file
  ↓
Install with values-local.yaml + values-apim-minikube-windows.yaml
  ↓
Patch APIM service with publishNotReadyAddresses=true
  ↓
Restart APIM deployment
  ↓
Wait for APIM pod 1/1 Running
  ↓
Add 127.0.0.1 am.wso2.com to hosts file
  ↓
Flush DNS cache
  ↓
Run minikube tunnel
  ↓
Open https://am.wso2.com/publisher/
```

---

# Note

This lab works on **Windows and macOS**.

Uses H2 only for local learning.

For production-like deployment, use PostgreSQL or another supported external database instead of H2.
