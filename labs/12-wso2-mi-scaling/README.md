# Lab 12 - Deploy WSO2 MI with Helm and a Direct Synapse API

This lab is the simple working path.

You deploy one WSO2 Micro Integrator pod with the official Helm chart, mount a
demo Synapse API XML through a Kubernetes ConfigMap, and call the API from
inside minikube.

Use this lab before trying:

| Next lab | Purpose |
|---|---|
| Lab 13 | Replace the direct XML mount with a WSO2 CApp/CAR exported from WSO2 tooling |
| Lab 14 | Enable HPA, generate load, and watch MI scale out |

---

# 1. What You Build

```text
curl pod
  -> Kubernetes Service: cloud-citizen-info-mi
  -> WSO2 MI pod
  -> Synapse API XML mounted from ConfigMap
```

This lab uses:

| Need | Resource |
|---|---|
| Namespace | `minikube-demo` |
| MI deployment | Official WSO2 MI Helm chart |
| MI image | `docker.io/wso2/wso2mi:4.6.0` |
| API artifact | `artifacts/synapse-configs/default/api/citizen-info-api.xml` |
| API mount | Kubernetes ConfigMap |
| Replicas | 1 |

The Synapse API is mounted into:

```text
/home/wso2carbon/wso2mi-4.6.0/repository/deployment/server/synapse-configs/default/api
```

---

# 2. Prerequisites

Run commands from the repository root:

```powershell
cd C:\Users\sanje\Downloads\Training-Bhuthan\K8S_Training
```

Required:

```text
Docker Desktop is running
minikube is running with the Docker driver
kubectl works
Helm works
```

Validate:

```powershell
docker version
minikube status
kubectl get nodes
helm version
```

Expected node output:

```text
NAME       STATUS   ROLES           AGE   VERSION
minikube   Ready    control-plane   ...   ...
```

---

# 3. Download the Official WSO2 MI Helm Chart

## Windows PowerShell

```powershell
$REPO = (Get-Location).Path
$BRANCH = "4.6.x"
$ZIP = "$env:USERPROFILE\Downloads\helm-mi-$BRANCH.zip"
$URL = "https://github.com/wso2/helm-mi/archive/refs/heads/$BRANCH.zip"
$CHART = "$env:USERPROFILE\Downloads\helm-mi-4.6.x\mi"
$VALUES = "$REPO\labs\12-wso2-mi-scaling\values-mi-minikube-working.yaml"

Invoke-WebRequest -Uri $URL -OutFile $ZIP
Expand-Archive -Path $ZIP -DestinationPath "$env:USERPROFILE\Downloads" -Force

Test-Path "$CHART\Chart.yaml"
Test-Path "$CHART\values_local.yaml"
Test-Path $VALUES
```

Expected output:

```text
True
True
True
```

## macOS Terminal

```bash
REPO="$(pwd)"
BRANCH="4.6.x"
ZIP="$HOME/Downloads/helm-mi-$BRANCH.zip"
URL="https://github.com/wso2/helm-mi/archive/refs/heads/$BRANCH.zip"
CHART="$HOME/Downloads/helm-mi-4.6.x/mi"
VALUES="$REPO/labs/12-wso2-mi-scaling/values-mi-minikube-working.yaml"

curl -L "$URL" -o "$ZIP"
unzip -o "$ZIP" -d "$HOME/Downloads"

test -f "$CHART/Chart.yaml" && echo "Chart.yaml found"
test -f "$CHART/values_local.yaml" && echo "values_local.yaml found"
test -f "$VALUES" && echo "lab values found"
```

Expected output:

```text
Chart.yaml found
values_local.yaml found
lab values found
```

---

# 4. Create the API ConfigMap

## Windows PowerShell

```powershell
$REPO = (Get-Location).Path
$API_XML = "$REPO\labs\12-wso2-mi-scaling\artifacts\synapse-configs\default\api\citizen-info-api.xml"

Test-Path $API_XML

kubectl create namespace minikube-demo --dry-run=client -o yaml | kubectl apply -f -
kubectl create configmap citizen-info-api-synapse `
  -n minikube-demo `
  --from-file=citizen-info-api.xml=$API_XML `
  --dry-run=client `
  -o yaml | kubectl apply -f -
```

Expected output includes:

```text
True
namespace/minikube-demo created
configmap/citizen-info-api-synapse created
```

If the namespace or ConfigMap already exists, `configured` or `unchanged` is also OK.

## macOS Terminal

```bash
REPO="$(pwd)"
API_XML="$REPO/labs/12-wso2-mi-scaling/artifacts/synapse-configs/default/api/citizen-info-api.xml"

test -f "$API_XML" && echo "API XML found"

kubectl create namespace minikube-demo --dry-run=client -o yaml | kubectl apply -f -
kubectl create configmap citizen-info-api-synapse \
  -n minikube-demo \
  --from-file=citizen-info-api.xml="$API_XML" \
  --dry-run=client \
  -o yaml | kubectl apply -f -
```

Expected output includes:

```text
API XML found
namespace/minikube-demo created
configmap/citizen-info-api-synapse created
```

---

# 5. Deploy One MI Pod

First confirm that this minikube cluster can pull the MI image. Your laptop may
already have the image cached, but a participant's laptop might need to download
it from Docker Hub for the first time.

## Windows PowerShell

```powershell
minikube image pull docker.io/wso2/wso2mi:4.6.0
```

Expected output:

```text
The command completes without an image pull error.
```

## macOS Terminal

```bash
minikube image pull docker.io/wso2/wso2mi:4.6.0
minikube image ls | grep -i wso2mi
```

Expected output:

```text
docker.io/wso2/wso2mi:4.6.0
```

On Apple Silicon Macs, such as M1, M2, M3, or M4, use this fallback if the
image pull command exits but the image is not visible in minikube:

```bash
docker pull --platform linux/amd64 wso2/wso2mi:4.6.0
minikube image load wso2/wso2mi:4.6.0
minikube image ls | grep -i wso2mi
```

Expected output:

```text
docker.io/wso2/wso2mi:4.6.0
```

If this command fails, fix the image pull problem before running Helm.

## Windows PowerShell

```powershell
$REPO = (Get-Location).Path
$CHART = "$env:USERPROFILE\Downloads\helm-mi-4.6.x\mi"
$VALUES = "$REPO\labs\12-wso2-mi-scaling\values-mi-minikube-working.yaml"

helm lint $CHART -f "$CHART\values_local.yaml" -f $VALUES

helm upgrade --install citizen-info-mi $CHART `
  --namespace minikube-demo `
  --create-namespace `
  -f "$CHART\values_local.yaml" `
  -f $VALUES `
  --set wso2.deployment.replicas=1 `
  --set wso2.deployment.hpa.enabled=false
```

Expected output includes:

```text
1 chart(s) linted, 0 chart(s) failed
STATUS: deployed
```

## macOS Terminal

```bash
REPO="$(pwd)"
CHART="$HOME/Downloads/helm-mi-4.6.x/mi"
VALUES="$REPO/labs/12-wso2-mi-scaling/values-mi-minikube-working.yaml"

helm lint "$CHART" -f "$CHART/values_local.yaml" -f "$VALUES"

helm upgrade --install citizen-info-mi "$CHART" \
  --namespace minikube-demo \
  --create-namespace \
  -f "$CHART/values_local.yaml" \
  -f "$VALUES" \
  --set wso2.deployment.replicas=1 \
  --set wso2.deployment.hpa.enabled=false
```

Expected output includes:

```text
1 chart(s) linted, 0 chart(s) failed
STATUS: deployed
```

---

# 6. Patch MI to Mount the API XML

The Helm chart creates the MI deployment. This patch mounts the ConfigMap into
the Synapse API deployment directory.

## Windows PowerShell

```powershell
$REPO = (Get-Location).Path

kubectl patch deployment cloud-citizen-info-mi `
  -n minikube-demo `
  --type strategic `
  --patch-file "$REPO\labs\12-wso2-mi-scaling\k8s\mi-citizen-api-configmap-mount-patch.yaml"

kubectl rollout status deployment/cloud-citizen-info-mi -n minikube-demo --timeout=5m
```

Expected output:

```text
deployment.apps/cloud-citizen-info-mi patched
deployment "cloud-citizen-info-mi" successfully rolled out
```

## macOS Terminal

```bash
REPO="$(pwd)"

kubectl patch deployment cloud-citizen-info-mi \
  -n minikube-demo \
  --type strategic \
  --patch-file "$REPO/labs/12-wso2-mi-scaling/k8s/mi-citizen-api-configmap-mount-patch.yaml"

kubectl rollout status deployment/cloud-citizen-info-mi -n minikube-demo --timeout=5m
```

Expected output:

```text
deployment.apps/cloud-citizen-info-mi patched
deployment "cloud-citizen-info-mi" successfully rolled out
```

Validate the mount:

```powershell
kubectl exec -n minikube-demo deployment/cloud-citizen-info-mi -- ls -l /home/wso2carbon/wso2mi-4.6.0/repository/deployment/server/synapse-configs/default/api
```

Expected output includes:

```text
citizen-info-api.xml
```

Check startup logs:

```powershell
kubectl logs -n minikube-demo deployment/cloud-citizen-info-mi --tail=120 | Select-String "Initializing API|CitizenInfoAPI|ERROR"
```

Expected output:

```text
Initializing API: CitizenInfoAPI
```

---

# 7. Test the MI API

Health:

```powershell
kubectl run mi-health-check -n minikube-demo --rm -i --restart=Never --image=curlimages/curl:8.10.1 -- -k -sS -w "`nHTTP %{http_code}`n" https://cloud-citizen-info-mi:8253/citizen/health
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

Profile:

```powershell
kubectl run mi-profile-check -n minikube-demo --rm -i --restart=Never --image=curlimages/curl:8.10.1 -- -k -sS https://cloud-citizen-info-mi:8253/citizen/profile/CIT-1001
```

Expected response:

```json
{
  "citizenId": "CIT-1001",
  "fullName": "Karma Dorji",
  "district": "Thimphu",
  "verificationStatus": "VERIFIED",
  "handledByPod": "cloud-citizen-info-mi-xxxxxxxxxx-xxxxx"
}
```

POST verify:

## Windows PowerShell

```powershell
kubectl run mi-verify-check -n minikube-demo --rm -i --restart=Never --image=curlimages/curl:8.10.1 -- -k -sS -X POST https://cloud-citizen-info-mi:8253/citizen/verify -H "Content-Type: application/json" -d "{\"reference\":\"CIT-1001\"}"
```

## macOS Terminal

```bash
kubectl run mi-verify-check -n minikube-demo --rm -i --restart=Never --image=curlimages/curl:8.10.1 -- -k -sS -X POST https://cloud-citizen-info-mi:8253/citizen/verify -H "Content-Type: application/json" -d '{"reference":"CIT-1001"}'
```

Expected response:

```json
{
  "reference": "CIT-1001",
  "verificationStatus": "ACCEPTED",
  "nextStep": "Manual officer review is not required for this demo request.",
  "handledByPod": "cloud-citizen-info-mi-xxxxxxxxxx-xxxxx"
}
```

---

# 8. Cleanup

Warning: this removes the Lab 12 MI deployment.

## Windows PowerShell

```powershell
helm uninstall citizen-info-mi -n minikube-demo
kubectl delete configmap citizen-info-api-synapse -n minikube-demo --ignore-not-found
```

## macOS Terminal

```bash
helm uninstall citizen-info-mi -n minikube-demo
kubectl delete configmap citizen-info-api-synapse -n minikube-demo --ignore-not-found
```

Expected output includes:

```text
release "citizen-info-mi" uninstalled
configmap "citizen-info-api-synapse" deleted
```

---

# Troubleshooting

| Error | Meaning | Fix | Validation |
|---|---|---|---|
| `values_local.yaml` not found | The official WSO2 chart was not downloaded or `CHART` points to the wrong folder | Re-run section 3 from the repository root | `Test-Path "$CHART\values_local.yaml"` returns `True` |
| `ImagePullBackOff` or `ErrImagePull` | minikube cannot download `docker.io/wso2/wso2mi:4.6.0`; the trainer machine may already have it cached, but the participant machine does not | Run `minikube image pull docker.io/wso2/wso2mi:4.6.0`. If it fails, check Docker Desktop internet access, proxy settings, Docker Hub rate limits, or Docker Hub login | `kubectl get pods -n minikube-demo` shows the MI pod moving from `ImagePullBackOff` to `Running` |
| `ImagePullBackOff` on Apple Silicon macOS | Docker/minikube pulled or cached the wrong platform image, or the image pull did not load into minikube | Run `docker pull --platform linux/amd64 wso2/wso2mi:4.6.0`, then `minikube image load wso2/wso2mi:4.6.0` | `minikube image ls | grep -i wso2mi` shows `docker.io/wso2/wso2mi:4.6.0` |
| `HTTP 404` for `/citizen/health` | MI is running, but the Synapse API was not deployed | Re-run section 6 and check logs | Logs show `Initializing API: CitizenInfoAPI` |
| `citizen-info-api.xml` is not visible in the pod | The ConfigMap mount patch was not applied, or Helm replaced the deployment after patching | Re-run section 6 after every Helm upgrade | `kubectl exec ... ls -l .../api` shows `citizen-info-api.xml` |
| Pod stays `Pending` | minikube does not have enough CPU or memory | Restart minikube with more resources or lower MI memory settings | Pod becomes `Running` |

---

# Notes

- This lab does not use the CAR file.
- The response comes from `citizen-info-api.xml`.
- Lab 13 covers CAR-based deployment.
- Lab 14 covers scaling and load testing.
