# Lab 12 - Deploy a WSO2 MI CApp, Autoscale It, and Expose It Through APIM

You have a WSO2 Micro Integrator `.car` file. This lab deploys it to Kubernetes with the official WSO2 MI Helm chart, loads it into every MI pod through a shared `carbonapps` volume, proves HPA scale-out under load, and exposes it through the APIM gateway from Lab 07.

The commands use a `REPO` variable for the tutorial folder:

```text
Windows default: %USERPROFILE%\Downloads\K8S_Training
macOS default:   ~/Downloads/K8S_Training
```

If your folder is somewhere else, set `REPO` to your actual `K8S_Training` path.

You do not need to switch into the lab folder or the Helm chart folder.

---

# 1. What You Build

```text
Client
  -> APIM Gateway from Lab 07
  -> Kubernetes Service: cloud-citizen-info-mi
  -> WSO2 MI pod
  -> CApp mounted from shared carbonapps PVC
```

This lab uses:

| Need | Resource |
|---|---|
| MI deployment | Official WSO2 MI Helm chart |
| MI image | Official `wso2/wso2mi:4.6.0` |
| Artifact | Your WSO2 `.car` CApp |
| Shared artifact location | Kubernetes PVC mounted into MI `carbonapps` |
| Autoscaling | Kubernetes HPA |
| Metrics | minikube `metrics-server` add-on |
| Load test | Kubernetes Job |

The shared CApp mount path is:

```text
/home/wso2carbon/wso2mi-4.6.0/repository/deployment/server/carbonapps
```

For real multi-node clusters, use storage that supports the access mode your replicas need, usually `ReadWriteMany`. This minikube lab uses a `ReadWriteOnce` PVC because minikube is single-node.

---

# 2. Prerequisites

Required:

```text
Docker Desktop is running
minikube is running with the Docker driver
kubectl works
Helm works
You have a WSO2 MI .car file
```

Recommended minikube resources:

```text
CPUs: 6 or more
Memory: 12288 MB or more
Disk: 50 GB or more
```

Start minikube if needed:

```powershell
minikube start --driver=docker --cpus=6 --memory=12288 --disk-size=50g
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

# 3. Put the CApp in the Lab Folder

Use this file name for the commands below:

```text
CitizenInfoCompositeExporter_1.0.0.car
```

Place it here:

```text
labs/12-wso2-mi-scaling/capps/CitizenInfoCompositeExporter_1.0.0.car
```

Validate:

## Windows PowerShell

```powershell
$REPO = "$env:USERPROFILE\Downloads\K8S_Training"
Test-Path "$REPO\labs\12-wso2-mi-scaling\capps\CitizenInfoCompositeExporter_1.0.0.car"
```

Expected output:

```text
True
```

## macOS Terminal

```bash
REPO="$HOME/Downloads/K8S_Training"
test -f "$REPO/labs/12-wso2-mi-scaling/capps/CitizenInfoCompositeExporter_1.0.0.car" && echo "CApp found"
```

Expected output:

```text
CApp found
```

If your CApp has a different file name or API path, update the copy command, MI test URLs, OpenAPI file, and APIM endpoint values before continuing.

---

# 4. Download the Official WSO2 MI Helm Chart

## Windows PowerShell

```powershell
$REPO = "$env:USERPROFILE\Downloads\K8S_Training"
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
REPO="$HOME/Downloads/K8S_Training"
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

# 5. Prepare Kubernetes Support Resources

This step enables metrics, creates the shared CApp PVC, starts the helper pod, and copies the `.car` file into the shared volume.

## Windows PowerShell

```powershell
$REPO = "$env:USERPROFILE\Downloads\K8S_Training"
$CAPP = "$REPO\labs\12-wso2-mi-scaling\capps\CitizenInfoCompositeExporter_1.0.0.car"

kubectl create namespace minikube-demo --dry-run=client -o yaml | kubectl apply -f -
minikube addons enable metrics-server
kubectl rollout status deployment/metrics-server -n kube-system --timeout=5m
kubectl apply -f "$REPO\labs\12-wso2-mi-scaling\k8s\mi-carbonapps-shared-volume.yaml"
kubectl wait --for=condition=Ready pod/mi-capp-loader -n minikube-demo --timeout=2m
kubectl cp $CAPP minikube-demo/mi-capp-loader:/carbonapps/CitizenInfoCompositeExporter_1.0.0.car
kubectl exec -n minikube-demo mi-capp-loader -- ls -l /carbonapps
```

## macOS Terminal

```bash
REPO="$HOME/Downloads/K8S_Training"
CAPP="$REPO/labs/12-wso2-mi-scaling/capps/CitizenInfoCompositeExporter_1.0.0.car"

kubectl create namespace minikube-demo --dry-run=client -o yaml | kubectl apply -f -
minikube addons enable metrics-server
kubectl rollout status deployment/metrics-server -n kube-system --timeout=5m
kubectl apply -f "$REPO/labs/12-wso2-mi-scaling/k8s/mi-carbonapps-shared-volume.yaml"
kubectl wait --for=condition=Ready pod/mi-capp-loader -n minikube-demo --timeout=2m
kubectl cp "$CAPP" minikube-demo/mi-capp-loader:/carbonapps/CitizenInfoCompositeExporter_1.0.0.car
kubectl exec -n minikube-demo mi-capp-loader -- ls -l /carbonapps
```

Expected output includes:

```text
deployment "metrics-server" successfully rolled out
persistentvolumeclaim/mi-carbonapps-pvc created
pod/mi-capp-loader created
pod/mi-capp-loader condition met
CitizenInfoCompositeExporter_1.0.0.car
```

Wait one or two minutes, then verify metrics:

```powershell
kubectl top nodes
```

Expected output:

```text
NAME       CPU(cores)   CPU%   MEMORY(bytes)   MEMORY%
minikube   ...          ...    ...             ...
```

Do not continue to HPA testing until `kubectl top nodes` works.

---

# 6. Deploy MI with the Official Helm Chart

## Windows PowerShell

```powershell
$REPO = "$env:USERPROFILE\Downloads\K8S_Training"
$CHART = "$env:USERPROFILE\Downloads\helm-mi-4.6.x\mi"
$VALUES = "$REPO\labs\12-wso2-mi-scaling\values-mi-minikube-working.yaml"

helm lint $CHART -f "$CHART\values_local.yaml" -f $VALUES
helm upgrade --install citizen-info-mi $CHART --namespace minikube-demo --create-namespace -f "$CHART\values_local.yaml" -f $VALUES
& "$REPO\labs\12-wso2-mi-scaling\scripts\patch-mi-carbonapps-volume.ps1"
```

## macOS Terminal

```bash
REPO="$HOME/Downloads/K8S_Training"
CHART="$HOME/Downloads/helm-mi-4.6.x/mi"
VALUES="$REPO/labs/12-wso2-mi-scaling/values-mi-minikube-working.yaml"

helm lint "$CHART" -f "$CHART/values_local.yaml" -f "$VALUES"
helm upgrade --install citizen-info-mi "$CHART" --namespace minikube-demo --create-namespace -f "$CHART/values_local.yaml" -f "$VALUES"
bash "$REPO/labs/12-wso2-mi-scaling/scripts/patch-mi-carbonapps-volume.sh"
```

Expected output includes:

```text
1 chart(s) linted, 0 chart(s) failed
STATUS: deployed
deployment.apps/cloud-citizen-info-mi patched
deployment "cloud-citizen-info-mi" successfully rolled out
CitizenInfoCompositeExporter_1.0.0.car
```

Check MI logs for CApp deployment:

## Windows PowerShell

```powershell
kubectl logs -n minikube-demo deployment/cloud-citizen-info-mi --tail=200 | Select-String "CApp|Carbon Application|Citizen|Deployed"
```

## macOS Terminal

```bash
kubectl logs -n minikube-demo deployment/cloud-citizen-info-mi --tail=200 | grep -E "CApp|Carbon Application|Citizen|Deployed"
```

---

# 7. Test the MI API

These commands assume the CApp exposes `/citizen`.

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

If the response is `HTTP 404`, MI is reachable but the CApp did not deploy the `/citizen/health` API. Check the mounted CApp and MI deployment logs:

```powershell
kubectl exec -n minikube-demo deployment/cloud-citizen-info-mi -- ls -l /home/wso2carbon/wso2mi-4.6.0/repository/deployment/server/carbonapps
kubectl logs -n minikube-demo deployment/cloud-citizen-info-mi --tail=300 | Select-String "CApp|Carbon Application|Deployed|ERROR|WARN|Exception|Citizen"
```

The `.car` file must be visible in `carbonapps`, and the logs must show that MI deployed the CApp or its API resources. If the `.car` is visible but the API is still 404, the CApp probably does not contain an API with context `/citizen`.
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

# 8. Enable HPA and Generate Load

## Windows PowerShell

```powershell
$REPO = "$env:USERPROFILE\Downloads\K8S_Training"
$CHART = "$env:USERPROFILE\Downloads\helm-mi-4.6.x\mi"
$VALUES = "$REPO\labs\12-wso2-mi-scaling\values-mi-minikube-working.yaml"

helm upgrade citizen-info-mi $CHART --namespace minikube-demo -f "$CHART\values_local.yaml" -f $VALUES --set wso2.deployment.hpa.enabled=true --set wso2.deployment.hpa.minReplicas=1 --set wso2.deployment.hpa.maxReplicas=3 --set wso2.deployment.hpa.cpuUtilizationPercentage=10 --set wso2.deployment.resources.requests.cpu=100m --set wso2.deployment.resources.limits.cpu=1000m
& "$REPO\labs\12-wso2-mi-scaling\scripts\patch-mi-carbonapps-volume.ps1"
kubectl get hpa -n minikube-demo
kubectl delete job mi-load-generator -n minikube-demo --ignore-not-found
kubectl apply -f "$REPO\labs\12-wso2-mi-scaling\k8s\mi-load-generator.yaml"
```

## macOS Terminal

```bash
REPO="$HOME/Downloads/K8S_Training"
CHART="$HOME/Downloads/helm-mi-4.6.x/mi"
VALUES="$REPO/labs/12-wso2-mi-scaling/values-mi-minikube-working.yaml"

helm upgrade citizen-info-mi "$CHART" --namespace minikube-demo -f "$CHART/values_local.yaml" -f "$VALUES" --set wso2.deployment.hpa.enabled=true --set wso2.deployment.hpa.minReplicas=1 --set wso2.deployment.hpa.maxReplicas=3 --set wso2.deployment.hpa.cpuUtilizationPercentage=10 --set wso2.deployment.resources.requests.cpu=100m --set wso2.deployment.resources.limits.cpu=1000m
bash "$REPO/labs/12-wso2-mi-scaling/scripts/patch-mi-carbonapps-volume.sh"
kubectl get hpa -n minikube-demo
kubectl delete job mi-load-generator -n minikube-demo --ignore-not-found
kubectl apply -f "$REPO/labs/12-wso2-mi-scaling/k8s/mi-load-generator.yaml"
```

Expected output includes:

```text
STATUS: deployed
deployment.apps/cloud-citizen-info-mi patched
deployment "cloud-citizen-info-mi" successfully rolled out
job.batch/mi-load-generator created
```

Watch HPA:

```powershell
kubectl get hpa cloud-citizen-info-mi -n minikube-demo --watch
```

Expected behavior after one or more HPA sync periods:

```text
NAME                    REFERENCE                          TARGETS    MINPODS   MAXPODS   REPLICAS
cloud-citizen-info-mi   Deployment/cloud-citizen-info-mi   35%/10%    1         3         2
cloud-citizen-info-mi   Deployment/cloud-citizen-info-mi   42%/10%    1         3         3
```

Stop watching with `Ctrl+C` after you observe scale-out.

Verify pods and endpoints:

```powershell
kubectl get pods -n minikube-demo -l deployment=cloud-citizen-info-mi
kubectl get endpoints cloud-citizen-info-mi -n minikube-demo -o wide
```

Expected:

```text
MI has multiple Running pods.
The Service endpoint list shows multiple pod IP addresses.
```

Clean up the load generator:

```powershell
kubectl delete job mi-load-generator -n minikube-demo --ignore-not-found
```

HPA scale-down can take several minutes.

---

# 9. Expose MI Through APIM

Complete Lab 07 first.

APIM must be running:

```powershell
kubectl get pods -n wso2
```

Expected:

```text
apim-wso2am-all-in-one-am-deployment-1-xxxxx   1/1   Running
```

APIM gateway port-forward from Lab 07 must be running:

```text
kubectl port-forward -n wso2 svc/apim-wso2am-all-in-one-am-service 443:9443 8243:8243
```

Hosts file entries from Lab 07 must exist:

```text
127.0.0.1 am.wso2.com
127.0.0.1 gw.wso2.com
```

Check APIM can reach MI:

```powershell
kubectl run apim-mi-check -n wso2 --rm -i --restart=Never --image=curlimages/curl:8.10.1 -- -k -sS https://cloud-citizen-info-mi.minikube-demo.svc.cluster.local:8253/citizen/health
```

Expected response:

```json
{
  "service": "citizen-info-mi",
  "status": "UP",
  "pod": "cloud-citizen-info-mi-xxxxxxxxxx-xxxxx"
}
```

Create the API in Publisher:

```text
https://am.wso2.com/publisher/
```

Use:

| Field | Value |
|---|---|
| API type | REST API |
| Create method | Import OpenAPI Definition |
| OpenAPI file | `labs/12-wso2-mi-scaling/citizen-info-openapi.yaml` |
| Name | `Citizen Information Integration` |
| Context | `/mi/citizen` |
| Version | `1.0.0` |
| Production endpoint | `https://cloud-citizen-info-mi.minikube-demo.svc.cluster.local:8253/citizen` |

Then:

```text
Deployments -> Deploy
Lifecycle -> Publish
```

Subscribe in Developer Portal:

```text
https://am.wso2.com/devportal/
```

Use `DefaultApplication`, generate a production access token, and invoke through the gateway.

## Windows PowerShell

```powershell
$TOKEN = "paste-access-token-here"
curl.exe -k -H "Authorization: Bearer $TOKEN" https://gw.wso2.com:8243/mi/citizen/1.0.0/health
curl.exe -k -H "Authorization: Bearer $TOKEN" https://gw.wso2.com:8243/mi/citizen/1.0.0/profile/CIT-1001
curl.exe -k -X POST https://gw.wso2.com:8243/mi/citizen/1.0.0/verify `
  -H "Authorization: Bearer $TOKEN" `
  -H "Content-Type: application/json" `
  -d "{\"reference\":\"CIT-1001\"}"
```

## macOS Terminal

```bash
TOKEN="paste-access-token-here"
curl -k -H "Authorization: Bearer $TOKEN" https://gw.wso2.com:8243/mi/citizen/1.0.0/health
curl -k -H "Authorization: Bearer $TOKEN" https://gw.wso2.com:8243/mi/citizen/1.0.0/profile/CIT-1001
curl -k -X POST https://gw.wso2.com:8243/mi/citizen/1.0.0/verify \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"reference":"CIT-1001"}'
```

---

# 10. Cleanup

## Windows PowerShell

```powershell
$REPO = "$env:USERPROFILE\Downloads\K8S_Training"
$CHART = "$env:USERPROFILE\Downloads\helm-mi-4.6.x\mi"
$VALUES = "$REPO\labs\12-wso2-mi-scaling\values-mi-minikube-working.yaml"

kubectl delete job mi-load-generator -n minikube-demo --ignore-not-found
helm upgrade citizen-info-mi $CHART --namespace minikube-demo -f "$CHART\values_local.yaml" -f $VALUES --set wso2.deployment.replicas=1 --set wso2.deployment.hpa.enabled=false
helm uninstall citizen-info-mi -n minikube-demo
kubectl delete -f "$REPO\labs\12-wso2-mi-scaling\k8s\mi-carbonapps-shared-volume.yaml"
```

## macOS Terminal

```bash
REPO="$HOME/Downloads/K8S_Training"
CHART="$HOME/Downloads/helm-mi-4.6.x/mi"
VALUES="$REPO/labs/12-wso2-mi-scaling/values-mi-minikube-working.yaml"

kubectl delete job mi-load-generator -n minikube-demo --ignore-not-found
helm upgrade citizen-info-mi "$CHART" --namespace minikube-demo -f "$CHART/values_local.yaml" -f "$VALUES" --set wso2.deployment.replicas=1 --set wso2.deployment.hpa.enabled=false
helm uninstall citizen-info-mi -n minikube-demo
kubectl delete -f "$REPO/labs/12-wso2-mi-scaling/k8s/mi-carbonapps-shared-volume.yaml"
```

Expected output includes:

```text
release "citizen-info-mi" uninstalled
persistentvolumeclaim "mi-carbonapps-pvc" deleted
pod "mi-capp-loader" deleted
```

Do not delete the `wso2` namespace unless you also want to remove Lab 07 APIM.

---

# Troubleshooting

| Error | Meaning | Fix | Validation |
|---|---|---|---|
| `values_local.yaml` not found | The official WSO2 chart was not downloaded or `CHART` points to the wrong folder | Re-run section 4 from the repo root | `Test-Path "$CHART\values_local.yaml"` returns `True` |
| `TARGETS <unknown>` in HPA | metrics-server is missing or not ready | Run `minikube addons enable metrics-server`, wait for rollout, then run `kubectl top nodes` | HPA shows a real percentage like `2%/10%` |
| HPA does not scale | Load is too small, CPU request is too high, or metrics have not refreshed | Re-run the load generator and wait 1-3 minutes | `kubectl describe hpa cloud-citizen-info-mi -n minikube-demo` shows metrics and scale events |
| CApp is not visible inside MI pods | Shared volume was not mounted after Helm install or upgrade | Re-run `patch-mi-carbonapps-volume.ps1` or `patch-mi-carbonapps-volume.sh` from sections 6 or 8 | MI pod shows the `.car` under `carbonapps` |
| API returns 404 | MI is reachable, but no API is deployed at that path | Verify the `.car` is visible under `carbonapps`, check MI logs for CApp deployment errors, and confirm the CApp has context `/citizen` | `/citizen/health` or your actual API path returns `HTTP 200` |
| Pod stays `Pending` | minikube does not have enough CPU or memory | Lower max replicas or restart minikube with more resources | Pods become `Running` |
| Gateway returns `401` or `403` | Missing or expired APIM token | Generate a new token in Developer Portal | Curl includes `Authorization: Bearer <token>` |

---

# Official References

- WSO2 MI Helm chart configuration: `https://mi.docs.wso2.com/en/latest/install-and-setup/setup/deployment/configuring-helm-charts/`
- WSO2 MI Helm chart repository: `https://github.com/wso2/helm-mi`
- WSO2 MI Docker image: `https://hub.docker.com/r/wso2/wso2mi`
- WSO2 MI exporting artifacts as CApp/CAR: `https://mi.docs.wso2.com/en/4.2.0/develop/exporting-artifacts/`
- WSO2 CApp deployment process and hot deployment directory: `https://wso2docs.atlassian.net/wiki/spaces/Carbon420/pages/15269895/C-App+Deployment+Process`
- Kubernetes HPA: `https://kubernetes.io/docs/concepts/workloads/autoscaling/horizontal-pod-autoscale/`
- Kubernetes `kubectl top`: `https://kubernetes.io/docs/reference/kubectl/generated/kubectl_top/`
- Minikube add-ons: `https://minikube.sigs.k8s.io/docs/handbook/addons/`
