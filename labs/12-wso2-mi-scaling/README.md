# Lab 12 - Deploy and Scale WSO2 Micro Integrator with Helm

This lab deploys **WSO2 Micro Integrator 4.6.0** on minikube using the official WSO2 MI Helm chart.

You will:

| Step | What you will do |
|---|---|
| 1 | Build a custom MI image with a working integration artifact |
| 2 | Download the official WSO2 MI Helm chart |
| 3 | Deploy MI with Helm and a local values override |
| 4 | Scale MI workers horizontally |
| 5 | Expose the MI API through the WSO2 API Manager from Lab 07 |

Important:

```text
This lab does not copy the official WSO2 MI Helm chart into this repository.
Users download the official chart from WSO2, then apply the lab override values file.
Lab 07 APIM is only required for the final API Manager exposure section.
```

---

# 1. Prerequisites

Required for MI:

```text
Docker Desktop is running
minikube is running with the Docker driver
kubectl works
Helm works
```

Check:

## Windows PowerShell

```powershell
docker version
minikube status
kubectl get nodes
helm version
```

## macOS Terminal

```bash
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

Recommended minikube resources when Lab 07 APIM is also running:

```text
CPUs: 4 or more
Memory: 8192 MB or more
Disk: 40 GB or more
```

For the APIM section, complete Lab 07 first.

Lab 07 APIM must be running:

```bash
kubectl get pods -n wso2
```

Expected:

```text
apim-wso2am-all-in-one-am-deployment-1-xxxxx   1/1   Running
```

Lab 07 port-forward must still be running:

```text
kubectl port-forward -n wso2 svc/apim-wso2am-all-in-one-am-service 443:9443 8243:8243
```

Hosts file entries from Lab 07 must exist:

```text
127.0.0.1 am.wso2.com
127.0.0.1 gw.wso2.com
```

---

# 2. What this lab provides

| File | Purpose |
|---|---|
| `Dockerfile` | Builds a custom image from `wso2/wso2mi:4.6.0` |
| `artifacts/synapse-configs/default/api/citizen-info-api.xml` | Working MI REST API artifact |
| `values-mi-minikube-working.yaml` | Local override for the official WSO2 MI Helm chart |
| `citizen-info-openapi.yaml` | OpenAPI file to import into WSO2 API Manager |

The MI artifact exposes:

| Method | MI path | Purpose |
|---|---|---|
| GET | `/citizen/health` | Health check and pod identity |
| GET | `/citizen/profile/{id}` | Demo citizen profile |
| POST | `/citizen/verify` | Demo verification request |

---

# 3. Build the MI image inside minikube

Run from the repository root:

## Windows / macOS

```bash
minikube image build -t wso2mi-citizen:1.0.0 labs/12-wso2-mi-scaling
```

Expected output includes:

```text
Successfully tagged wso2mi-citizen:1.0.0
```

Validate:

## Windows PowerShell

```powershell
minikube image ls | Select-String "wso2mi-citizen"
```

## macOS Terminal

```bash
minikube image ls | grep wso2mi-citizen
```

Expected output:

```text
docker.io/library/wso2mi-citizen:1.0.0
```

---

# 4. Download the official WSO2 MI Helm chart

Use the official WSO2 Helm chart repository:

```text
https://github.com/wso2/helm-mi
```

This lab uses the `4.6.x` chart branch.

## Windows PowerShell

```powershell
cd $env:USERPROFILE\Downloads

$BRANCH = "4.6.x"
$ZIP = "helm-mi-$BRANCH.zip"
$URL = "https://github.com/wso2/helm-mi/archive/refs/heads/$BRANCH.zip"

Invoke-WebRequest -Uri $URL -OutFile $ZIP
Expand-Archive -Path $ZIP -DestinationPath . -Force
```

Go to the chart folder:

```powershell
cd "$env:USERPROFILE\Downloads\helm-mi-4.6.x\mi"
```

If your extracted folder is different, go to the folder that contains `Chart.yaml`.

Check:

```powershell
dir
```

Expected files include:

```text
Chart.yaml
values.yaml
values_local.yaml
values_full.yaml
templates
```

## macOS Terminal

```bash
cd ~/Downloads

BRANCH="4.6.x"
ZIP="helm-mi-$BRANCH.zip"
URL="https://github.com/wso2/helm-mi/archive/refs/heads/$BRANCH.zip"

curl -L "$URL" -o "$ZIP"
unzip -o "$ZIP"
```

Go to the chart folder:

```bash
cd ~/Downloads/helm-mi-4.6.x/mi
```

If your extracted folder is different, go to the folder that contains `Chart.yaml`.

Check:

```bash
ls
```

Expected files include:

```text
Chart.yaml
values.yaml
values_local.yaml
values_full.yaml
templates
```

---

# 5. Copy the lab values file next to the official chart

Copy the lab override file into the official chart folder.

## Windows PowerShell

Run from the repository root:

```powershell
Copy-Item .\labs\12-wso2-mi-scaling\values-mi-minikube-working.yaml "$env:USERPROFILE\Downloads\helm-mi-4.6.x\mi\values-mi-minikube-working.yaml"
```

Then go back to the official chart folder:

```powershell
cd "$env:USERPROFILE\Downloads\helm-mi-4.6.x\mi"
```

Verify:

```powershell
Get-Content .\values-mi-minikube-working.yaml
```

## macOS Terminal

Run from the repository root:

```bash
cp labs/12-wso2-mi-scaling/values-mi-minikube-working.yaml ~/Downloads/helm-mi-4.6.x/mi/values-mi-minikube-working.yaml
```

Then go back to the official chart folder:

```bash
cd ~/Downloads/helm-mi-4.6.x/mi
```

Verify:

```bash
cat values-mi-minikube-working.yaml
```

Important values:

```yaml
containerRegistry: ""

wso2:
  ingress:
    enabled: false
  gatewayAPI:
    enabled: false
  deployment:
    replicas: 1
    image:
      repository: "wso2mi-citizen"
      tag: "1.0.0"
      pullPolicy: Never
```

Why:

| Value | Reason |
|---|---|
| `containerRegistry: ""` | Use the local image built inside minikube |
| `pullPolicy: Never` | Do not pull the lab image from Docker Hub |
| `gatewayAPI.enabled: false` | Do not require Gateway API CRDs for this lab |
| `ingress.enabled: false` | External access is through Lab 07 APIM |
| `ingress.metrics: null` | Do not create a metrics Ingress in this local lab |

---

# 6. Check the official chart before installing

Run from the official `mi` chart folder:

## Windows / macOS

```bash
helm lint . -f values_local.yaml -f values-mi-minikube-working.yaml
```

Expected output:

```text
1 chart(s) linted, 0 chart(s) failed
```

Render the Kubernetes resources:

```bash
helm template citizen-info-mi . --namespace minikube-demo -f values_local.yaml -f values-mi-minikube-working.yaml
```

Expected output includes:

```text
kind: Deployment
name: cloud-citizen-info-mi
image: "wso2mi-citizen:1.0.0"
kind: Service
name: cloud-citizen-info-mi
```

---

# 7. Install MI with Helm

Run from the official `mi` chart folder:

## Windows / macOS

```bash
helm upgrade --install citizen-info-mi . --namespace minikube-demo --create-namespace -f values_local.yaml -f values-mi-minikube-working.yaml
```

Expected output:

```text
Release "citizen-info-mi" does not exist. Installing it now.
NAME: citizen-info-mi
NAMESPACE: minikube-demo
STATUS: deployed
```

Wait until MI is ready:

```bash
kubectl rollout status deployment/cloud-citizen-info-mi -n minikube-demo --timeout=10m
```

Expected output:

```text
deployment "cloud-citizen-info-mi" successfully rolled out
```

Check pods:

```bash
kubectl get pods -n minikube-demo -l deployment=cloud-citizen-info-mi
```

Expected output:

```text
NAME                                     READY   STATUS    RESTARTS   AGE
cloud-citizen-info-mi-xxxxxxxxxx-xxxxx   1/1     Running   0          ...
```

Check service:

```bash
kubectl get svc cloud-citizen-info-mi -n minikube-demo
```

Expected output:

```text
NAME                    TYPE        CLUSTER-IP   EXTERNAL-IP   PORT(S)                    AGE
cloud-citizen-info-mi   ClusterIP   ...          <none>        8253/TCP,9201/TCP,9164/TCP ...
```

---

# 8. Test MI inside the Kubernetes cluster

The official chart service exposes MI on the HTTPS passthrough port:

```text
https://cloud-citizen-info-mi:8253
```

Health check:

## Windows / macOS

```bash
kubectl run mi-health-check -n minikube-demo --rm -i --restart=Never --image=curlimages/curl:8.10.1 -- curl -k -s https://cloud-citizen-info-mi:8253/citizen/health
```

Expected response:

```json
{
  "service": "citizen-info-mi",
  "status": "UP",
  "pod": "cloud-citizen-info-mi-xxxxxxxxxx-xxxxx"
}
```

Profile check:

```bash
kubectl run mi-profile-check -n minikube-demo --rm -i --restart=Never --image=curlimages/curl:8.10.1 -- curl -k -s https://cloud-citizen-info-mi:8253/citizen/profile/CIT-1001
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

Verification request:

## Windows PowerShell

```powershell
kubectl run mi-verify-check -n minikube-demo --rm -i --restart=Never --image=curlimages/curl:8.10.1 -- curl -k -s -X POST https://cloud-citizen-info-mi:8253/citizen/verify -H "Content-Type: application/json" -d "{\"reference\":\"CIT-1001\"}"
```

## macOS Terminal

```bash
kubectl run mi-verify-check -n minikube-demo --rm -i --restart=Never --image=curlimages/curl:8.10.1 -- curl -k -s -X POST https://cloud-citizen-info-mi:8253/citizen/verify -H "Content-Type: application/json" -d '{"reference":"CIT-1001"}'
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

# 9. Scale MI workers horizontally with Helm

Scale from 1 replica to 3 replicas:

## Windows / macOS

```bash
helm upgrade citizen-info-mi . --namespace minikube-demo -f values_local.yaml -f values-mi-minikube-working.yaml --set wso2.deployment.replicas=3
```

Expected output:

```text
Release "citizen-info-mi" has been upgraded. Happy Helming!
STATUS: deployed
```

Wait for the rollout:

```bash
kubectl rollout status deployment/cloud-citizen-info-mi -n minikube-demo --timeout=10m
```

Expected output:

```text
deployment "cloud-citizen-info-mi" successfully rolled out
```

Check replicas:

```bash
kubectl get pods -n minikube-demo -l deployment=cloud-citizen-info-mi
```

Expected output:

```text
NAME                                     READY   STATUS    RESTARTS   AGE
cloud-citizen-info-mi-xxxxxxxxxx-aaaaa   1/1     Running   0          ...
cloud-citizen-info-mi-xxxxxxxxxx-bbbbb   1/1     Running   0          ...
cloud-citizen-info-mi-xxxxxxxxxx-ccccc   1/1     Running   0          ...
```

Check Service endpoints:

```bash
kubectl get endpoints cloud-citizen-info-mi -n minikube-demo -o wide
```

Expected output includes multiple pod IP addresses:

```text
NAME                    ENDPOINTS                                      AGE
cloud-citizen-info-mi   10.244.0.10:8253,10.244.0.11:8253,10.244.0.12:8253 ...
```

Send repeated requests:

```bash
kubectl run mi-load-check -n minikube-demo --rm -i --restart=Never --image=curlimages/curl:8.10.1 -- sh -c "for i in 1 2 3 4 5 6 7 8; do curl -k -s https://cloud-citizen-info-mi:8253/citizen/health; echo; done"
```

Expected result:

```text
Responses should show the same service name and different pod names over repeated calls.
```

Example:

```json
{"service":"citizen-info-mi","status":"UP","pod":"cloud-citizen-info-mi-xxxxxxxxxx-aaaaa"}
{"service":"citizen-info-mi","status":"UP","pod":"cloud-citizen-info-mi-xxxxxxxxxx-bbbbb"}
{"service":"citizen-info-mi","status":"UP","pod":"cloud-citizen-info-mi-xxxxxxxxxx-ccccc"}
```

If all responses show one pod, run the command again. Service load balancing can reuse connections.

---

# 10. Optional: enable HPA with the official chart

This section shows the official chart's HPA option.

For a predictable beginner lab, manual Helm scaling in section 9 is easier to observe.

To enable HPA:

## Windows / macOS

```bash
helm upgrade citizen-info-mi . --namespace minikube-demo -f values_local.yaml -f values-mi-minikube-working.yaml --set wso2.deployment.hpa.enabled=true --set wso2.deployment.hpa.minReplicas=1 --set wso2.deployment.hpa.maxReplicas=3
```

Check:

```bash
kubectl get hpa -n minikube-demo
```

Expected output:

```text
NAME                    REFERENCE                          MINPODS   MAXPODS
cloud-citizen-info-mi   Deployment/cloud-citizen-info-mi   1         3
```

If metrics are unavailable in minikube, HPA may show:

```text
<unknown>
```

That means the metrics server is not available or has not reported CPU/memory yet. Manual Helm scaling from section 9 still works.

Disable HPA before continuing:

```bash
helm upgrade citizen-info-mi . --namespace minikube-demo -f values_local.yaml -f values-mi-minikube-working.yaml --set wso2.deployment.replicas=3 --set wso2.deployment.hpa.enabled=false
```

---

# 11. Verify APIM can reach MI

Only do this section after completing Lab 07.

Check APIM:

## Windows / macOS

```bash
kubectl get pods -n wso2
```

Expected:

```text
apim-wso2am-all-in-one-am-deployment-1-xxxxx   1/1   Running
```

Check APIM-to-MI reachability:

```bash
kubectl run apim-mi-check -n wso2 --rm -i --restart=Never --image=curlimages/curl:8.10.1 -- curl -k -s https://cloud-citizen-info-mi.minikube-demo.svc.cluster.local:8253/citizen/health
```

Expected response:

```json
{
  "service": "citizen-info-mi",
  "status": "UP",
  "pod": "cloud-citizen-info-mi-xxxxxxxxxx-xxxxx"
}
```

Backend endpoint for APIM:

```text
https://cloud-citizen-info-mi.minikube-demo.svc.cluster.local:8253/citizen
```

---

# 12. Create the MI-backed API in API Manager

Open Publisher:

```text
https://am.wso2.com/publisher/
```

Login:

```text
admin / admin
```

Create the API:

1. Click **Create API**.
2. Select **REST API**.
3. Select **Import OpenAPI Definition**.
4. Upload:

```text
labs/12-wso2-mi-scaling/citizen-info-openapi.yaml
```

Use these values:

| Field | Value |
|---|---|
| Name | `Citizen Information Integration` |
| Context | `/mi/citizen` |
| Version | `1.0.0` |
| Endpoint type | `HTTP/REST endpoint` |
| Production endpoint | `https://cloud-citizen-info-mi.minikube-demo.svc.cluster.local:8253/citizen` |

Save the API.

Check resources in Publisher:

```text
GET /health
GET /profile/{id}
POST /verify
```

Then click:

```text
Deployments -> Deploy
Lifecycle -> Publish
```

Expected:

```text
Citizen Information Integration is published.
```

---

# 13. Subscribe and generate a token

Open Developer Portal:

```text
https://am.wso2.com/devportal/
```

Login:

```text
admin / admin
```

Subscribe:

1. Open **Citizen Information Integration**.
2. Click **Subscribe**.
3. Select `DefaultApplication`.
4. Click **Subscribe**.

Generate a token:

1. Open **Applications**.
2. Open `DefaultApplication`.
3. Open **Production Keys**.
4. Click **Generate Keys**.
5. Copy the access token.

Expected:

```text
An access token is generated for DefaultApplication.
```

---

# 14. Invoke MI through API Manager

These commands use the Lab 07 gateway:

```text
https://gw.wso2.com:8243
```

Health through APIM:

## Windows PowerShell

```powershell
$TOKEN = "paste-access-token-here"
curl.exe -k -H "Authorization: Bearer $TOKEN" https://gw.wso2.com:8243/mi/citizen/1.0.0/health
```

## macOS Terminal

```bash
TOKEN="paste-access-token-here"
curl -k -H "Authorization: Bearer $TOKEN" https://gw.wso2.com:8243/mi/citizen/1.0.0/health
```

Expected response:

```json
{
  "service": "citizen-info-mi",
  "status": "UP",
  "pod": "cloud-citizen-info-mi-xxxxxxxxxx-xxxxx"
}
```

Profile through APIM:

## Windows PowerShell

```powershell
curl.exe -k -H "Authorization: Bearer $TOKEN" https://gw.wso2.com:8243/mi/citizen/1.0.0/profile/CIT-1001
```

## macOS Terminal

```bash
curl -k -H "Authorization: Bearer $TOKEN" https://gw.wso2.com:8243/mi/citizen/1.0.0/profile/CIT-1001
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

Verification through APIM:

## Windows PowerShell

```powershell
curl.exe -k -X POST https://gw.wso2.com:8243/mi/citizen/1.0.0/verify `
  -H "Authorization: Bearer $TOKEN" `
  -H "Content-Type: application/json" `
  -d "{\"reference\":\"CIT-1001\"}"
```

## macOS Terminal

```bash
curl -k -X POST https://gw.wso2.com:8243/mi/citizen/1.0.0/verify \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"reference":"CIT-1001"}'
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

# 15. Prove APIM routes to scaled MI workers

Run several gateway requests.

## Windows PowerShell

```powershell
1..8 | ForEach-Object {
  curl.exe -k -s -H "Authorization: Bearer $TOKEN" https://gw.wso2.com:8243/mi/citizen/1.0.0/health
  ""
}
```

## macOS Terminal

```bash
for i in 1 2 3 4 5 6 7 8; do
  curl -k -s -H "Authorization: Bearer $TOKEN" https://gw.wso2.com:8243/mi/citizen/1.0.0/health
  echo
done
```

Expected result:

```text
The responses continue to succeed while MI has multiple Running pods.
The pod value may change between requests.
```

This proves:

```text
Outside client -> APIM Gateway from Lab 07 -> Kubernetes Service -> scaled MI workers
```

---

# 16. Useful operations

Show Helm release:

```bash
helm list -n minikube-demo
```

Show current values:

```bash
helm get values citizen-info-mi -n minikube-demo
```

Show MI logs:

```bash
kubectl logs -n minikube-demo deployment/cloud-citizen-info-mi -f
```

Show MI resources:

```bash
kubectl get deployment,svc,endpoints,pods -n minikube-demo -l app.kubernetes.io/instance=citizen-info-mi
```

Scale back to 1 replica:

```bash
helm upgrade citizen-info-mi . --namespace minikube-demo -f values_local.yaml -f values-mi-minikube-working.yaml --set wso2.deployment.replicas=1
```

---

# Troubleshooting

| Error | Meaning | Fix | Validation |
|---|---|---|---|
| `ErrImageNeverPull` | The custom MI image was not built inside minikube | Run `minikube image build -t wso2mi-citizen:1.0.0 labs/12-wso2-mi-scaling` | `minikube image ls` shows `wso2mi-citizen` |
| Chart creates Gateway API or Ingress resources | Gateway API or metrics Ingress was left enabled | Use `values_local.yaml` first, then `values-mi-minikube-working.yaml` | `kubectl get svc -n minikube-demo` shows `cloud-citizen-info-mi` |
| Pod stays `Pending` | Not enough CPU or memory | Use 1 or 2 replicas, or restart minikube with more memory | Pods become `Running` |
| Rollout times out | MI is still starting or image/artifact failed | Check `kubectl logs -n minikube-demo deployment/cloud-citizen-info-mi --tail=200` | Health check returns JSON |
| `curl` fails with certificate warning | MI backend uses HTTPS with a local certificate | Use `curl -k` for local testing | Health check returns JSON |
| APIM endpoint test fails | APIM cannot reach MI or endpoint URL is wrong | Use the full Kubernetes DNS HTTPS endpoint from this lab | `apim-mi-check` returns MI health JSON |
| Gateway returns `401` or `403` | Missing, expired, or wrong access token | Generate a new token in Developer Portal | Curl includes `Authorization: Bearer <token>` |
| Gateway cannot connect | Lab 07 gateway port-forward or hosts entry is missing | Restart Lab 07 port-forward and verify `gw.wso2.com` hosts entry | `curl -k https://gw.wso2.com:8243` reaches APIM |
| HPA shows `<unknown>` | Metrics server is missing or not ready | Use manual Helm scaling for this lab, or enable metrics server separately | Manual replica scaling still works |

---

# Cleanup

Run from the official `mi` chart folder.

Remove MI:

## Windows / macOS

```bash
helm uninstall citizen-info-mi -n minikube-demo
```

Expected output:

```text
release "citizen-info-mi" uninstalled
```

Validate:

```bash
kubectl get deployment,svc,pods -n minikube-demo -l app.kubernetes.io/instance=citizen-info-mi
```

Expected output:

```text
No resources found in minikube-demo namespace.
```

Optional image cleanup:

```bash
minikube image rm wso2mi-citizen:1.0.0
```

Expected output:

```text
Image removed
```

If you created the API in APIM, delete it from Publisher:

1. Open `https://am.wso2.com/publisher/`.
2. Open **Citizen Information Integration**.
3. Retire the API if required.
4. Delete the API.

Do not delete the `wso2` namespace unless you also want to remove Lab 07 APIM.

---

# Official references

- WSO2 MI Helm chart configuration: `https://mi.docs.wso2.com/en/latest/install-and-setup/setup/deployment/configuring-helm-charts/`
- WSO2 MI Helm chart repository: `https://github.com/wso2/helm-mi`
- WSO2 MI Docker image: `https://hub.docker.com/r/wso2/wso2mi`
