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
| **Ingress** | `am.wso2.com`, `gw.wso2.com` | HTTP routing for APIM services |
| **ConfigMap** | APIM configuration | Database, cache, API settings |
| **PersistentVolume** | H2 embedded database | Stores API definitions, user data |

### Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    Your Browser                                 │
│                                                                  │
│  Publisher:   https://am.wso2.com/publisher                    │
│  DevPortal:   https://am.wso2.com/devportal                    │
│  Gateway:     https://gw.wso2.com/                             │
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
        │  │ (gw.wso2.com → Gateway Service)     │ │
        │  └────────────┬────────────────────────┘ │
        │               │                          │
        │               ↓                          │
        │  ┌─────────────────────────────────────┐ │
        │  │  WSO2 APIM All-in-One Pod (Running) │ │
        │  │  - Publisher                        │ │
        │  │  - DevPortal                        │ │
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

## Prerequisites (Already Covered in Docs)

Before starting, ensure you've completed:

✓ [Docs 01](../../docs/01-prerequisites.md) - Docker Desktop running
✓ [Docs 04](../../docs/04-start-minikube.md) - minikube cluster running
✓ [Docs 06](../../docs/06-addons.md) - Ingress addon enabled
✓ [Docs 08](../../docs/08-helm.md) - Helm installed and working
✓ [Labs 01-06](../) - Kubernetes fundamentals

**Resource Requirements:**
- **Minimum 16 GB RAM** (APIM needs 4 GB + minikube overhead)
- **Minimum 40 GB disk**
- **4 CPU cores**

Verify your current minikube:

```bash
minikube status
kubectl get nodes
```

---

## Apply: Install WSO2 APIM

### Step 1: Clone the official WSO2 Helm chart

```bash
git clone https://github.com/wso2/helm-apim.git
cd helm-apim
git checkout tags/all-in-one-4.6.0-2
cd all-in-one
```

Verify files exist:

```bash
ls Chart.yaml values.yaml
```

✓ Both files should be present.

### Step 2: Create `values-local.yaml`

Copy the `values-local.yaml` from this lab folder into the `all-in-one` directory:

```bash
# From the all-in-one directory
cp <path-to-lab>/values-local.yaml .
```

Or create it manually with the content in `values-local.yaml` (this overrides defaults to use public images and embedded H2 database).

### Step 3: Install APIM via Helm

**Windows (PowerShell):**

```powershell
helm install apim . `
  --namespace wso2 `
  --create-namespace `
  --dependency-update `
  -f values-local.yaml
```

**macOS (Terminal):**

```bash
helm install apim . \
  --namespace wso2 \
  --create-namespace \
  --dependency-update \
  -f values-local.yaml
```

Expected output:

```
NAME: apim
NAMESPACE: wso2
STATUS: deployed
REVISION: 1
```

✓ Helm has submitted the manifests. APIM is now starting up.

---

## Verify: APIM is Running

### Step 1: Monitor pod startup (takes 3-8 minutes)

**Windows (PowerShell):**

```powershell
kubectl get pods -n wso2 -w
```

**macOS (Terminal):**

```bash
kubectl get pods -n wso2 -w
```

Watch for status transitions:
- `Pending` → Pulling ~2GB image (first time is slow)
- `Init:0/1` → Init containers running
- `PodInitializing` → Main container starting
- `Running 0/1` → JVM booting
- `Running 1/1` → Ready ✓

Stop watching with **Ctrl+C** once you see `1/1 Running`.

### Step 2: Verify resources deployed

```bash
kubectl get all -n wso2
```

You should see:
- Deployment `apim`
- Pod `apim-xxxxx`
- Service `apim-wso2apim` (ClusterIP)
- Ingress `apim-wso2apim` (for `am.wso2.com` and `gw.wso2.com`)

### Step 3: Get minikube IP

```bash
minikube ip
```

Example output: `192.168.49.2`

### Step 4: Map hostnames

Add these hostnames to your hosts file so your browser can reach APIM.

**Windows (Notepad as Administrator):**

Edit: `C:\Windows\System32\drivers\etc\hosts`

Add:

```
192.168.49.2   am.wso2.com   gw.wso2.com
```

**macOS (Terminal):**

```bash
sudo nano /etc/hosts
```

Add:

```
192.168.49.2   am.wso2.com   gw.wso2.com
```

Save: **Ctrl+O**, Enter, **Ctrl+X**

### Step 5: (Windows only) Start minikube tunnel

If you're on Windows with Docker driver, you need a tunnel for direct IP access.

**Open a new PowerShell window** and run:

```powershell
minikube tunnel
```

**Update your hosts file** to use `127.0.0.1` instead of minikube IP:

```
127.0.0.1   am.wso2.com   gw.wso2.com
```

Leave this tunnel window open while using APIM.

(macOS users skip this — direct IP access works.)

### Step 6: Verify hostname resolution

**Windows (PowerShell):**

```powershell
ping am.wso2.com
```

**macOS (Terminal):**

```bash
ping am.wso2.com
```

Should resolve to your minikube IP (or `127.0.0.1` on Windows with tunnel).

### Step 7: Access APIM in Browser

Open these URLs (accept self-signed certificate warnings):

| Component | URL |
|-----------|-----|
| **Publisher** | https://am.wso2.com/publisher |
| **Developer Portal** | https://am.wso2.com/devportal |
| **Admin Console** | https://am.wso2.com/admin |
| **Gateway** | https://gw.wso2.com/ |

**Login credentials:** `admin` / `admin`

✓ **Success:** WSO2 APIM is running!

---

## Quick Test: Create and invoke an API

### Step 1: Login to Publisher

Open: https://am.wso2.com/publisher

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

- Open: https://am.wso2.com/devportal
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
curl.exe -k -H "Authorization: Bearer $token" https://gw.wso2.com/test/1.0.0/
```

**macOS (Terminal):**

```bash
TOKEN="paste-your-access-token-here"
curl -k -H "Authorization: Bearer $TOKEN" https://gw.wso2.com/test/1.0.0/
```

Expected response: JSON from httpbin ✓

---

## Operations

### Pause cluster (keeps state)

```bash
minikube stop
```

### Resume

```bash
minikube start
kubectl get pods -n wso2 -w
```

(Windows: also restart `minikube tunnel` in separate window)

### Upgrade APIM (after editing `values-local.yaml`)

```bash
helm upgrade apim . -n wso2 -f values-local.yaml --atomic
```

### Rollback to previous version

```bash
helm history apim -n wso2
helm rollback apim <revision-number> -n wso2
```

### View logs

```bash
kubectl logs -n wso2 deployment/apim -f
```

---

## Cleanup

### Remove APIM

```bash
helm uninstall apim -n wso2
kubectl delete namespace wso2
```

### Remove hostnames from hosts file

Remove these lines:

**Windows:** `C:\Windows\System32\drivers\etc\hosts`
```
192.168.49.2   am.wso2.com   gw.wso2.com
```

**macOS:** `/etc/hosts`
```
192.168.49.2   am.wso2.com   gw.wso2.com
```

### Stop minikube

```bash
minikube stop
```

---

## Troubleshooting

### Pod stuck in `Pending`

Check resources:

```bash
kubectl describe pod -n wso2
```

**Solution:** Restart minikube with more memory:

```bash
minikube delete
minikube start --cpus=4 --memory=10240 --disk-size=40g --driver=docker
```

### Image pull timeout

First image pull is ~2 GB, can take 10-15 minutes. Be patient or:

```bash
docker pull docker.io/wso2/wso2am:4.6.0
```

Then retry helm install.

### `helm install` says "release already exists"

```bash
helm uninstall apim -n wso2
helm install apim . -n wso2 -f values-local.yaml --create-namespace
```

### Browser can't reach `am.wso2.com`

**Windows with tunnel:** Confirm `minikube tunnel` is running in separate window AND hosts file uses `127.0.0.1`

**macOS:** Confirm hosts file uses minikube IP (e.g. `192.168.49.2`)

Verify:

```bash
ping am.wso2.com
```

### 502/503 Gateway errors

Pod might not be ready yet:

```bash
kubectl get pods -n wso2
kubectl get endpoints -n wso2
```

Wait until pod shows `1/1 Running`.

### Unable to access Publisher/DevPortal

Accept self-signed certificate warning:
1. Click **Advanced**
2. Click **Proceed to ...** (or similar)

This is safe for local development.

---

## Reference

- **WSO2 APIM Helm Chart:** https://github.com/wso2/helm-apim/releases/tag/all-in-one-4.6.0-2
- **WSO2 APIM Documentation:** https://apim.docs.wso2.com/en/latest/
- **Helm Documentation:** https://helm.sh/docs/
