# Lab 13 - Deploy WSO2 MI with a CApp/CAR

This lab is the advanced artifact packaging path.

You deploy WSO2 MI with Helm, copy a `.car` file into a shared `carbonapps`
volume, patch the MI deployment to mount that volume, and verify that MI
deploys the CApp.

Complete Lab 12 first. Lab 12 proves the MI Helm deployment and API behavior
with a direct Synapse XML mount. Lab 13 replaces that direct mount with a CApp.

---

# 1. Important Packaging Note

Use a `.car` exported from WSO2 tooling such as WSO2 Integration Studio or MI
for VS Code.

During Windows validation, a hand-built `.car` archive was visible inside MI
but failed deployment with:

```text
Some dependencies were not satisfied in cApp
```

That means the file reached MI, but the CApp metadata was not valid enough for
MI dependency resolution.

For this lab, place your tool-exported CAR here:

```text
labs/13-wso2-mi-capp-deployment/capps/CitizenInfoCompositeExporter_1.0.0.car
```

If your CAR uses another file name or API context, update the copy command and
test URLs.

---

# 2. What You Build

```text
curl pod
  -> Kubernetes Service: cloud-citizen-info-mi
  -> WSO2 MI pod
  -> CApp mounted from shared carbonapps PVC
```

This lab uses:

| Need | Resource |
|---|---|
| Namespace | `minikube-demo` |
| MI deployment | Official WSO2 MI Helm chart |
| Artifact | Tool-exported `.car` |
| Shared artifact storage | `mi-carbonapps-pvc` |
| MI mount path | `/home/wso2carbon/wso2mi-4.6.0/repository/deployment/server/carbonapps` |

For real multi-node clusters, the shared volume must support the access mode
needed by your replicas. Minikube is single-node, so this lab uses a
`ReadWriteOnce` PVC.

---

# 3. Validate the CAR File

Run from the repository root.

## Windows PowerShell

```powershell
$REPO = (Get-Location).Path
$CAPP = ".\labs\13-wso2-mi-capp-deployment\capps\CitizenInfoCompositeExporter_1.0.0.car"

Test-Path $CAPP
```

Expected output:

```text
True
```

## macOS Terminal

```bash
REPO="$(pwd)"
CAPP="$REPO/labs/13-wso2-mi-capp-deployment/capps/CitizenInfoCompositeExporter_1.0.0.car"

test -f "$CAPP" && echo "CApp found"
```

Expected output:

```text
CApp found
```

---

# 4. Create the Shared CApp Volume

## Windows PowerShell

```powershell
$REPO = (Get-Location).Path
$CAPP = ".\labs\13-wso2-mi-capp-deployment\capps\CitizenInfoCompositeExporter_1.0.0.car"

kubectl create namespace minikube-demo --dry-run=client -o yaml | kubectl apply -f -
kubectl apply -f "$REPO\labs\13-wso2-mi-capp-deployment\k8s\mi-carbonapps-shared-volume.yaml"
kubectl wait --for=condition=Ready pod/mi-capp-loader -n minikube-demo --timeout=2m
kubectl cp $CAPP minikube-demo/mi-capp-loader:/carbonapps/CitizenInfoCompositeExporter_1.0.0.car
kubectl exec -n minikube-demo mi-capp-loader -- ls -l /carbonapps
```

Expected output includes:

```text
persistentvolumeclaim/mi-carbonapps-pvc created
pod/mi-capp-loader created
pod/mi-capp-loader condition met
CitizenInfoCompositeExporter_1.0.0.car
```

## macOS Terminal

```bash
REPO="$(pwd)"
CAPP="$REPO/labs/13-wso2-mi-capp-deployment/capps/CitizenInfoCompositeExporter_1.0.0.car"

kubectl create namespace minikube-demo --dry-run=client -o yaml | kubectl apply -f -
kubectl apply -f "$REPO/labs/13-wso2-mi-capp-deployment/k8s/mi-carbonapps-shared-volume.yaml"
kubectl wait --for=condition=Ready pod/mi-capp-loader -n minikube-demo --timeout=2m
kubectl cp "$CAPP" minikube-demo/mi-capp-loader:/carbonapps/CitizenInfoCompositeExporter_1.0.0.car
kubectl exec -n minikube-demo mi-capp-loader -- ls -l /carbonapps
```

---

# 5. Deploy MI with Helm

If Lab 12 is already deployed, uninstall it first:

```powershell
helm uninstall citizen-info-mi -n minikube-demo
```

Then deploy MI without the direct Synapse ConfigMap patch.

## Windows PowerShell

```powershell
$REPO = (Get-Location).Path
$CHART = "$env:USERPROFILE\Downloads\helm-mi-4.6.x\mi"
$VALUES = "$REPO\labs\13-wso2-mi-capp-deployment\values-mi-minikube-working.yaml"

helm upgrade --install citizen-info-mi $CHART `
  --namespace minikube-demo `
  --create-namespace `
  -f "$CHART\values_local.yaml" `
  -f $VALUES `
  --set wso2.deployment.replicas=1 `
  --set wso2.deployment.hpa.enabled=false
```

## macOS Terminal

```bash
REPO="$(pwd)"
CHART="$HOME/Downloads/helm-mi-4.6.x/mi"
VALUES="$REPO/labs/13-wso2-mi-capp-deployment/values-mi-minikube-working.yaml"

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
STATUS: deployed
```

---

# 6. Patch MI to Mount `carbonapps`

## Windows PowerShell

```powershell
$REPO = (Get-Location).Path

& "$REPO\labs\13-wso2-mi-capp-deployment\scripts\patch-mi-carbonapps-volume.ps1"
```

Expected output includes:

```text
deployment.apps/cloud-citizen-info-mi patched
deployment "cloud-citizen-info-mi" successfully rolled out
CitizenInfoCompositeExporter_1.0.0.car
```

## macOS Terminal

```bash
REPO="$(pwd)"

bash "$REPO/labs/13-wso2-mi-capp-deployment/scripts/patch-mi-carbonapps-volume.sh"
```

Expected output includes:

```text
deployment.apps/cloud-citizen-info-mi patched
deployment "cloud-citizen-info-mi" successfully rolled out
CitizenInfoCompositeExporter_1.0.0.car
```

---

# 7. Validate CApp Deployment

Check logs:

## Windows PowerShell

```powershell
kubectl logs -n minikube-demo deployment/cloud-citizen-info-mi --all-containers=true --tail=300
```

Optional filtered view:

```powershell
kubectl logs -n minikube-demo deployment/cloud-citizen-info-mi --all-containers=true --tail=1000 |
  Select-String -Pattern "CApp|Carbon Application|Citizen|Deployed|ERROR|WARN|Exception|dependencies"
```

## macOS Terminal

```bash
kubectl logs -n minikube-demo deployment/cloud-citizen-info-mi --all-containers=true --tail=300
```

Optional filtered view:

```bash
kubectl logs -n minikube-demo deployment/cloud-citizen-info-mi --all-containers=true --tail=1000 | grep -E "CApp|Carbon Application|Citizen|Deployed|ERROR|WARN|Exception|dependencies"
```

Expected healthy result:

```text
Logs show that the CApp or CitizenInfoAPI deployed.
No "Some dependencies were not satisfied in cApp" error appears.
```

Test health:

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

---

# 8. Cleanup

Warning: this removes the Lab 13 MI deployment and CApp helper resources.

## Windows PowerShell

```powershell
$REPO = (Get-Location).Path

helm uninstall citizen-info-mi -n minikube-demo
kubectl delete -f "$REPO\labs\13-wso2-mi-capp-deployment\k8s\mi-carbonapps-shared-volume.yaml"
```

## macOS Terminal

```bash
REPO="$(pwd)"

helm uninstall citizen-info-mi -n minikube-demo
kubectl delete -f "$REPO/labs/13-wso2-mi-capp-deployment/k8s/mi-carbonapps-shared-volume.yaml"
```

Expected output includes:

```text
release "citizen-info-mi" uninstalled
persistentvolumeclaim "mi-carbonapps-pvc" deleted
pod "mi-capp-loader" deleted
```

---

# Troubleshooting

| Error | Meaning | Fix | Validation |
|---|---|---|---|
| `kubectl cp` says `one of src or dest must be a local file specification` | Windows absolute paths such as `C:\...` contain `:`, and `kubectl cp` can mistake them for `pod:path` syntax | Run from the repo root and use the relative `$CAPP` path shown in section 4 | `kubectl exec -n minikube-demo mi-capp-loader -- ls -l /carbonapps` shows the `.car` |
| `Some dependencies were not satisfied in cApp` | The CAR reached MI, but MI could not resolve CApp metadata/dependencies | Export the CAR from WSO2 tooling and replace the file in `capps` | Logs show CApp deployment without dependency errors |
| `HTTP 404` for `/citizen/health` | MI is reachable, but the CApp did not deploy an API with context `/citizen` | Check CApp contents and MI logs | `/citizen/health` returns `HTTP 200` |
| CApp file not visible in MI pod | The PVC was not mounted into MI | Re-run section 6 | MI pod shows the `.car` under `carbonapps` |
