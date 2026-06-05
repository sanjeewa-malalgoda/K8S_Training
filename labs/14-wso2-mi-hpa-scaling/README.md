# Lab 14 - Scale WSO2 MI with HPA and Load

This lab is the scaling path.

You start from a working MI API, enable `metrics-server`, turn on HPA in the
official MI Helm chart, generate load, and watch MI scale out.

Complete one of these first:

| Previous lab | Artifact mode |
|---|---|
| Lab 12 | Direct Synapse API ConfigMap mount |
| Lab 13 | CApp/CAR mounted from shared `carbonapps` PVC |

The commands below assume the Lab 12 direct Synapse ConfigMap path. If you are
using the Lab 13 CApp path, use the CApp patch script after each Helm upgrade
instead of the direct ConfigMap patch.

---

# 1. Confirm the API Works

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

Do not continue until this returns `HTTP 200`.

---

# 2. Enable metrics-server

```powershell
minikube addons enable metrics-server
kubectl rollout status deployment/metrics-server -n kube-system --timeout=5m
kubectl top nodes
```

Expected output includes:

```text
deployment "metrics-server" successfully rolled out
NAME       CPU(cores)   CPU%   MEMORY(bytes)   MEMORY%
minikube   ...          ...    ...             ...
```

Do not continue until `kubectl top nodes` shows metrics.

---

# 3. Enable HPA in the MI Helm Release

## Windows PowerShell

```powershell
$REPO = (Get-Location).Path
$CHART = "$env:USERPROFILE\Downloads\helm-mi-4.6.x\mi"
$VALUES = "$REPO\labs\14-wso2-mi-hpa-scaling\values-mi-minikube-working.yaml"

helm upgrade citizen-info-mi $CHART `
  --namespace minikube-demo `
  -f "$CHART\values_local.yaml" `
  -f $VALUES `
  --set wso2.deployment.hpa.enabled=true `
  --set wso2.deployment.hpa.minReplicas=1 `
  --set wso2.deployment.hpa.maxReplicas=3 `
  --set wso2.deployment.hpa.cpuUtilizationPercentage=50 `
  --set wso2.deployment.resources.requests.cpu=100m `
  --set wso2.deployment.resources.limits.cpu=1000m
```

Expected output includes:

```text
STATUS: deployed
```

## macOS Terminal

```bash
REPO="$(pwd)"
CHART="$HOME/Downloads/helm-mi-4.6.x/mi"
VALUES="$REPO/labs/14-wso2-mi-hpa-scaling/values-mi-minikube-working.yaml"

helm upgrade citizen-info-mi "$CHART" \
  --namespace minikube-demo \
  -f "$CHART/values_local.yaml" \
  -f "$VALUES" \
  --set wso2.deployment.hpa.enabled=true \
  --set wso2.deployment.hpa.minReplicas=1 \
  --set wso2.deployment.hpa.maxReplicas=3 \
  --set wso2.deployment.hpa.cpuUtilizationPercentage=50 \
  --set wso2.deployment.resources.requests.cpu=100m \
  --set wso2.deployment.resources.limits.cpu=1000m
```

Expected output includes:

```text
STATUS: deployed
```

---

# 4. Reapply the Artifact Mount Patch

Helm may replace manual deployment patches. Reapply the patch for the artifact
mode you are using.

## If You Completed Lab 12

### Windows PowerShell

```powershell
$REPO = (Get-Location).Path

kubectl patch deployment cloud-citizen-info-mi `
  -n minikube-demo `
  --type strategic `
  --patch-file "$REPO\labs\12-wso2-mi-scaling\k8s\mi-citizen-api-configmap-mount-patch.yaml"

kubectl rollout status deployment/cloud-citizen-info-mi -n minikube-demo --timeout=5m
```

### macOS Terminal

```bash
REPO="$(pwd)"

kubectl patch deployment cloud-citizen-info-mi \
  -n minikube-demo \
  --type strategic \
  --patch-file "$REPO/labs/12-wso2-mi-scaling/k8s/mi-citizen-api-configmap-mount-patch.yaml"

kubectl rollout status deployment/cloud-citizen-info-mi -n minikube-demo --timeout=5m
```

## If You Completed Lab 13

### Windows PowerShell

```powershell
$REPO = (Get-Location).Path

& "$REPO\labs\13-wso2-mi-capp-deployment\scripts\patch-mi-carbonapps-volume.ps1"
```

### macOS Terminal

```bash
REPO="$(pwd)"

bash "$REPO/labs/13-wso2-mi-capp-deployment/scripts/patch-mi-carbonapps-volume.sh"
```

---

# 5. Confirm HPA Exists

```powershell
kubectl get hpa -n minikube-demo
```

Expected output:

```text
NAME                    REFERENCE                          TARGETS       MINPODS   MAXPODS   REPLICAS
cloud-citizen-info-mi   Deployment/cloud-citizen-info-mi   .../50%       1         3         1
```

This lab uses a `50%` CPU target by default.
Earlier drafts used `10%`, but MI can idle above `10%` after startup or load.
When idle CPU stays above the target, HPA correctly refuses to scale down.

If `TARGETS` shows `<unknown>`, wait one or two minutes and run:

```powershell
kubectl describe hpa cloud-citizen-info-mi -n minikube-demo
kubectl top pods -n minikube-demo
```

---

# 6. Generate Load

```powershell
$REPO = (Get-Location).Path

kubectl delete job mi-load-generator -n minikube-demo --ignore-not-found
kubectl apply -f "$REPO\labs\14-wso2-mi-hpa-scaling\k8s\mi-load-generator.yaml"
```

Expected output includes:

```text
job.batch/mi-load-generator created
```

---

# 7. Watch Scale-Out

```powershell
kubectl get hpa cloud-citizen-info-mi -n minikube-demo --watch
```

Expected behavior after one or more HPA sync periods:

```text
NAME                    REFERENCE                          TARGETS    MINPODS   MAXPODS   REPLICAS
cloud-citizen-info-mi   Deployment/cloud-citizen-info-mi   70%/50%    1         3         2
cloud-citizen-info-mi   Deployment/cloud-citizen-info-mi   85%/50%    1         3         3
```

Stop watching with `Ctrl+C` after you observe scale-out.

Verify pods and service endpoints:

```powershell
kubectl get pods -n minikube-demo -l deployment=cloud-citizen-info-mi
kubectl get endpoints cloud-citizen-info-mi -n minikube-demo -o wide
```

Expected:

```text
MI has multiple Running pods.
The Service endpoint list shows multiple pod IP addresses.
```

---

# 8. Clean Up the Load Test

```powershell
kubectl delete job mi-load-generator -n minikube-demo --ignore-not-found
```

Expected output:

```text
job.batch "mi-load-generator" deleted
```

HPA scale-down can take several minutes.
With the default `50%` CPU target, replicas should normally return toward `1`
after CPU drops below target for the HPA scale-down window.

---

# 9. Disable HPA

Run this only when you want to return to one MI pod.

## Windows PowerShell

```powershell
$REPO = (Get-Location).Path
$CHART = "$env:USERPROFILE\Downloads\helm-mi-4.6.x\mi"
$VALUES = "$REPO\labs\14-wso2-mi-hpa-scaling\values-mi-minikube-working.yaml"

helm upgrade citizen-info-mi $CHART `
  --namespace minikube-demo `
  -f "$CHART\values_local.yaml" `
  -f $VALUES `
  --set wso2.deployment.replicas=1 `
  --set wso2.deployment.hpa.enabled=false
```

## macOS Terminal

```bash
REPO="$(pwd)"
CHART="$HOME/Downloads/helm-mi-4.6.x/mi"
VALUES="$REPO/labs/14-wso2-mi-hpa-scaling/values-mi-minikube-working.yaml"

helm upgrade citizen-info-mi "$CHART" \
  --namespace minikube-demo \
  -f "$CHART/values_local.yaml" \
  -f "$VALUES" \
  --set wso2.deployment.replicas=1 \
  --set wso2.deployment.hpa.enabled=false
```

After the Helm upgrade, reapply the Lab 12 or Lab 13 artifact mount patch.

---

# Troubleshooting

| Error | Meaning | Fix | Validation |
|---|---|---|---|
| `TARGETS <unknown>` in HPA | metrics-server is missing, not ready, or metrics have not refreshed yet | Re-run section 2 and wait one or two minutes | `kubectl top pods -n minikube-demo` shows CPU and memory |
| HPA does not scale | Load is too small, CPU request is too high, or metrics have not refreshed | Re-run the load generator and wait 1-3 minutes | `kubectl describe hpa cloud-citizen-info-mi -n minikube-demo` shows scale events |
| HPA does not scale down after 15-25 minutes | CPU target is still exceeded, or an old `10%` target is still active | Use the `50%` CPU target in section 3, delete the load job, and wait for scale-down | `kubectl get hpa` shows CPU below `50%` and replicas return toward `1` |
| Helm upgrade fails with `.spec.replicas` conflict | HPA currently owns deployment replica count through the scale subresource | Delete the HPA first, then scale the deployment or rerun Helm with HPA disabled | `kubectl get hpa -n minikube-demo` no longer shows `cloud-citizen-info-mi` |
| API returns `HTTP 404` after Helm upgrade | Helm replaced the manual artifact mount patch | Re-run section 4 | `/citizen/health` returns `HTTP 200` |
| New pods do not serve the API | The artifact mount patch was not applied after enabling HPA | Re-run section 4 and wait for rollout | All MI pods become `Running`, and service endpoint calls return `HTTP 200` |
