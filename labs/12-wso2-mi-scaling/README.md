# Lab 12 - Deploy a WSO2 MI CApp, Autoscale It, and Expose It Through APIM

You have a WSO2 Micro Integrator CApp/CAR file and you need to run it on Kubernetes.

By the end of this lab, you will have:

| Outcome | What you prove |
|---|---|
| MI runs from the official WSO2 Helm chart | You are not hand-writing the MI Deployment |
| The CApp is loaded from a shared `carbonapps` volume | Every MI pod sees the same `.car` file |
| HPA scales MI from 1 pod up to 3 pods | Scaling is based on real Kubernetes metrics |
| A load test triggers autoscaling | You can watch HPA react to load |
| APIM exposes the MI backend | Clients call APIM, APIM calls MI inside Kubernetes |

The working path is:

```text
Place .car file
  -> create shared CApp volume
  -> deploy MI using official WSO2 Helm chart
  -> mount the shared volume into MI carbonapps directory
  -> test the MI API
  -> enable metrics-server and HPA
  -> generate load and watch scale-out
  -> expose the MI API through APIM
```

This lab uses these resources:

| Area | Resource used |
|---|---|
| MI runtime deployment | Official WSO2 MI Helm chart |
| MI runtime image | Official `wso2/wso2mi:4.6.0` image |
| CApp format | WSO2 `.car` CApp artifact |
| CApp hot deployment path | WSO2 MI `carbonapps` directory |
| Autoscaling | Kubernetes HPA |
| Metrics | minikube `metrics-server` add-on |
| Load generation | Kubernetes Job |

The lab-specific piece is the PVC mount into `carbonapps`:

```text
PVC: mi-carbonapps-pvc
  -> mounted into /home/wso2carbon/wso2mi-4.6.0/repository/deployment/server/carbonapps
```

Lab 07 APIM is needed only for the final APIM exposure sections. You can complete the MI deployment, CApp loading, and autoscaling sections without APIM.

---

# 1. Target architecture

By the end of the lab, requests follow this path:

```text
External client
  -> WSO2 API Manager Gateway from Lab 07
  -> Kubernetes Service: cloud-citizen-info-mi
  -> One of the WSO2 MI pods
  -> CApp deployed from the shared carbonapps volume
```

The artifact flow is:

```text
CitizenInfoCompositeExporter_1.0.0.car
  -> PersistentVolumeClaim: mi-carbonapps-pvc
  -> Mounted into every MI pod at the MI carbonapps hot-deployment directory
  -> MI deploys the CApp
```

Inside Kubernetes, MI exposes this backend endpoint:

```text
https://cloud-citizen-info-mi.minikube-demo.svc.cluster.local:8253/citizen
```

API Manager exposes it outside the cluster as:

```text
https://gw.wso2.com:8243/mi/citizen/1.0.0
```

---

# 2. CApp delivery design

WSO2 CApps are deployed as `.car` files. The runtime deployment directory is:

```text
<MI_HOME>/repository/deployment/server/carbonapps
```

For the WSO2 MI 4.6.0 Docker image, this lab uses:

```text
/home/wso2carbon/wso2mi-4.6.0/repository/deployment/server/carbonapps
```

Before MI can serve the API, every MI pod must receive the same CApp:

```text
CitizenInfoCompositeExporter_1.0.0.car
  -> visible inside every MI pod
  -> deployed by MI
  -> API becomes available
```

This lab answers it with a shared Kubernetes volume.

| Approach | Artifact format | Update behavior | Best for |
|---|---|---|---|
| Shared volume, used in this lab | `.car` | Copy a new CApp into the shared volume and MI hot-deploys it | Local CApp deployment and autoscaling practice |
| Custom image | `.car` baked into image | Build and roll out a new image | Immutable release pipelines |
| Init container | `.car` downloaded before MI starts | Restart pods to pick up a new CApp | Pulling artifacts from Nexus, Git, S3, or similar |
| Sidecar syncer | `.car` continuously synced | Runtime sync | Advanced production pattern with extra operational risk |

Do not treat this as a production storage recommendation without checking your cluster.

```text
minikube is a single-node cluster, so a ReadWriteOnce PVC can be mounted by all local MI pods on that node.
Real multi-node clusters normally need ReadWriteMany storage for this shared-volume pattern.
Examples: NFS, Azure Files, Amazon EFS, CephFS, or another RWX-capable storage class.
```

---

# 3. HPA requires metrics-server

HPA needs CPU or memory metrics before it can scale pods.

For CPU and memory autoscaling, Kubernetes normally reads pod metrics from the `metrics.k8s.io` API. In minikube, that API is provided by the `metrics-server` add-on.

The correct flow is:

```text
Enable metrics-server
Verify kubectl top works
Enable HPA
Generate load
Watch HPA scale the MI deployment
```

If `metrics-server` is missing, HPA may show:

```text
<unknown>
```

Do not test HPA while it shows `<unknown>`. Fix metrics-server first.

---

# 4. Prerequisites

Required:

```text
Docker Desktop is running
minikube is running with the Docker driver
kubectl works
Helm works
You have a WSO2 MI CApp/CAR file
```

Recommended minikube resources when APIM, MI, metrics-server, and load testing run together:

```text
CPUs: 6 or more
Memory: 12288 MB or more
Disk: 50 GB or more
```

If you are starting a new minikube cluster for the full APIM + MI + HPA path:

## Windows PowerShell / macOS Terminal

```bash
minikube start --driver=docker --cpus=6 --memory=12288 --disk-size=50g
```

Expected output includes:

```text
Done! kubectl is now configured to use "minikube" cluster
```

Check tools:

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

# 5. Lab files

| File | Purpose |
|---|---|
| `values-mi-minikube-working.yaml` | Local override for the official WSO2 MI Helm chart |
| `k8s/mi-carbonapps-shared-volume.yaml` | PVC and helper pod for the shared CApp volume |
| `k8s/mi-load-generator.yaml` | Load generator Job used to trigger HPA |
| `citizen-info-openapi.yaml` | OpenAPI file to import into WSO2 API Manager |
| `artifacts/synapse-configs/default/api/citizen-info-api.xml` | Source API XML used to build/export a matching demo CApp |
| `capps/README.md` | Where to place the exported `.car` file |

The expected CApp should expose:

| Method | MI path | Purpose |
|---|---|---|
| GET | `/citizen/health` | Health check and pod identity |
| GET | `/citizen/profile/{id}` | Demo citizen profile |
| POST | `/citizen/verify` | Demo verification request |

---

# 6. Prepare the CApp file

Before you continue, get the CApp/CAR file you want to deploy.

For the commands below, use this file name:

```text
CitizenInfoCompositeExporter_1.0.0.car
```

Place it here:

```text
labs/12-wso2-mi-scaling/capps/CitizenInfoCompositeExporter_1.0.0.car
```

If your CApp uses a different file name, update the file name in the copy commands before you continue.

If your CApp exposes different API paths, update the MI test URLs, OpenAPI file, and APIM endpoint paths before you test.

If you are building the demo API, export this source artifact from WSO2 Integration Studio as a CApp:

```text
artifacts/synapse-configs/default/api/citizen-info-api.xml
```

Expected local file:

## Windows PowerShell

```powershell
Test-Path .\labs\12-wso2-mi-scaling\capps\CitizenInfoCompositeExporter_1.0.0.car
```

Expected output:

```text
True
```

If the output is `False`, stop here and export or copy the CApp before continuing.

## macOS Terminal

```bash
test -f labs/12-wso2-mi-scaling/capps/CitizenInfoCompositeExporter_1.0.0.car && echo "CApp found"
```

Expected output:

```text
CApp found
```

If this command prints nothing, stop here and export or copy the CApp before continuing.

---

# 7. Enable metrics-server before HPA

Run this before testing autoscaling.

## Windows / macOS

```bash
minikube addons enable metrics-server
```

Expected output:

```text
The 'metrics-server' addon is enabled
```

Wait for metrics-server:

```bash
kubectl rollout status deployment/metrics-server -n kube-system --timeout=5m
```

Expected output:

```text
deployment "metrics-server" successfully rolled out
```

Wait one or two minutes, then check metrics:

```bash
kubectl top nodes
```

Expected output:

```text
NAME       CPU(cores)   CPU%   MEMORY(bytes)   MEMORY%
minikube   ...          ...    ...             ...
```

If `kubectl top nodes` fails, do not continue to the HPA section yet.

---

# 8. Download the official WSO2 MI Helm chart

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

# 9. Copy the lab values file next to the official chart

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

## macOS Terminal

Run from the repository root:

```bash
cp labs/12-wso2-mi-scaling/values-mi-minikube-working.yaml ~/Downloads/helm-mi-4.6.x/mi/values-mi-minikube-working.yaml
```

Then go back to the official chart folder:

```bash
cd ~/Downloads/helm-mi-4.6.x/mi
```

Important values:

```yaml
containerRegistry: ""

wso2:
  deployment:
    replicas: 1
    image:
      repository: "wso2/wso2mi"
      tag: "4.6.0"
      pullPolicy: IfNotPresent
    hpa:
      enabled: false
      minReplicas: 1
      maxReplicas: 3
      cpuUtilizationPercentage: 10
```

Why:

| Value | Reason |
|---|---|
| `repository: "wso2/wso2mi"` | Use the official MI runtime image |
| `pullPolicy: IfNotPresent` | Pull the official image if minikube does not already have it |
| `hpa.enabled: false` | Install MI first, then explicitly enable HPA after metrics-server works |
| `cpuUtilizationPercentage: 10` | Low demo target so learners can observe scale-out under local load |
| `ingress.enabled: false` | External access is through Lab 07 APIM |
| `gatewayAPI.enabled: false` | Do not require Gateway API CRDs for this lab |

---

# 10. Create the shared CApp volume

Create the namespace if it does not already exist:

## Windows / macOS

```bash
kubectl create namespace minikube-demo --dry-run=client -o yaml | kubectl apply -f -
```

Expected output:

```text
namespace/minikube-demo created
```

If the namespace already exists, the output may be:

```text
namespace/minikube-demo configured
```

Run from the repository root:

## Windows / macOS

```bash
kubectl apply -f labs/12-wso2-mi-scaling/k8s/mi-carbonapps-shared-volume.yaml
```

Expected output:

```text
persistentvolumeclaim/mi-carbonapps-pvc created
pod/mi-capp-loader created
```

Wait for the helper pod:

```bash
kubectl wait --for=condition=Ready pod/mi-capp-loader -n minikube-demo --timeout=2m
```

Expected output:

```text
pod/mi-capp-loader condition met
```

Validate the PVC:

```bash
kubectl get pvc mi-carbonapps-pvc -n minikube-demo
```

Expected output:

```text
NAME                 STATUS   VOLUME                                     CAPACITY   ACCESS MODES
mi-carbonapps-pvc    Bound    pvc-xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx   1Gi        RWO
```

---

# 11. Upload the CApp into the shared volume

The helper pod mounts the shared volume at:

```text
/carbonapps
```

Copy the CApp into that folder.

## Windows PowerShell

Run from the repository root:

```powershell
$CAPP = ".\labs\12-wso2-mi-scaling\capps\CitizenInfoCompositeExporter_1.0.0.car"
kubectl cp $CAPP minikube-demo/mi-capp-loader:/carbonapps/CitizenInfoCompositeExporter_1.0.0.car
```

## macOS Terminal

Run from the repository root:

```bash
CAPP="labs/12-wso2-mi-scaling/capps/CitizenInfoCompositeExporter_1.0.0.car"
kubectl cp "$CAPP" minikube-demo/mi-capp-loader:/carbonapps/CitizenInfoCompositeExporter_1.0.0.car
```

Validate:

```bash
kubectl exec -n minikube-demo mi-capp-loader -- ls -l /carbonapps
```

Expected output:

```text
CitizenInfoCompositeExporter_1.0.0.car
```

---

# 12. Check the official chart before installing

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
image: "wso2/wso2mi:4.6.0"
kind: Service
name: cloud-citizen-info-mi
```

---

# 13. Install MI with Helm

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

Patch the MI deployment so every MI pod mounts the shared CApp volume:

```bash
kubectl set volume deployment/cloud-citizen-info-mi -n minikube-demo --add --overwrite --name=mi-carbonapps --type=persistentVolumeClaim --claim-name=mi-carbonapps-pvc --mount-path=/home/wso2carbon/wso2mi-4.6.0/repository/deployment/server/carbonapps
```

Expected output:

```text
deployment.apps/cloud-citizen-info-mi volume updated
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

Check that the CApp is visible inside MI:

```bash
kubectl exec -n minikube-demo deployment/cloud-citizen-info-mi -- ls -l /home/wso2carbon/wso2mi-4.6.0/repository/deployment/server/carbonapps
```

Expected output:

```text
CitizenInfoCompositeExporter_1.0.0.car
```

Check MI logs:

## Windows PowerShell

```powershell
kubectl logs -n minikube-demo deployment/cloud-citizen-info-mi --tail=200 | Select-String "CApp|Carbon Application|Citizen|Deployed"
```

## macOS Terminal

```bash
kubectl logs -n minikube-demo deployment/cloud-citizen-info-mi --tail=200 | grep -E "CApp|Carbon Application|Citizen|Deployed"
```

Expected output includes a message showing that the CApp or its artifacts were deployed.

---

# 14. Test MI inside the Kubernetes cluster

The official chart service exposes MI on the HTTPS passthrough port:

```text
https://cloud-citizen-info-mi:8253
```

Health check:

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

# 15. Enable HPA for MI

Run from the official `mi` chart folder.

This enables HPA and keeps the demo target low so autoscaling is visible in minikube.

```bash
helm upgrade citizen-info-mi . --namespace minikube-demo -f values_local.yaml -f values-mi-minikube-working.yaml --set wso2.deployment.hpa.enabled=true --set wso2.deployment.hpa.minReplicas=1 --set wso2.deployment.hpa.maxReplicas=3 --set wso2.deployment.hpa.cpuUtilizationPercentage=10 --set wso2.deployment.resources.requests.cpu=100m --set wso2.deployment.resources.limits.cpu=1000m
```

Expected output:

```text
Release "citizen-info-mi" has been upgraded. Happy Helming!
STATUS: deployed
```

Important:

```text
Helm upgrades render the Deployment again.
Run the volume patch again after Helm upgrades so the shared CApp volume remains mounted.
```

Patch the shared volume again:

```bash
kubectl set volume deployment/cloud-citizen-info-mi -n minikube-demo --add --overwrite --name=mi-carbonapps --type=persistentVolumeClaim --claim-name=mi-carbonapps-pvc --mount-path=/home/wso2carbon/wso2mi-4.6.0/repository/deployment/server/carbonapps
```

Wait for rollout:

```bash
kubectl rollout status deployment/cloud-citizen-info-mi -n minikube-demo --timeout=10m
```

Check HPA:

```bash
kubectl get hpa -n minikube-demo
```

Expected output:

```text
NAME                    REFERENCE                          TARGETS       MINPODS   MAXPODS   REPLICAS
cloud-citizen-info-mi   Deployment/cloud-citizen-info-mi   2%/10%        1         3         1
```

If `TARGETS` shows `<unknown>`, stop and fix metrics-server before continuing.

Check pod metrics:

```bash
kubectl top pods -n minikube-demo
```

Expected output:

```text
NAME                                     CPU(cores)   MEMORY(bytes)
cloud-citizen-info-mi-xxxxxxxxxx-xxxxx   ...          ...
```

---

# 16. Generate load and watch HPA scale

Run from the repository root:

```bash
kubectl delete job mi-load-generator -n minikube-demo --ignore-not-found
kubectl apply -f labs/12-wso2-mi-scaling/k8s/mi-load-generator.yaml
```

Expected output:

```text
job.batch "mi-load-generator" deleted
job.batch/mi-load-generator created
```

If the Job did not exist before, the delete command may print:

```text
job.batch "mi-load-generator" not found
```

Watch HPA:

```bash
kubectl get hpa cloud-citizen-info-mi -n minikube-demo --watch
```

Expected behavior after one or more HPA sync periods:

```text
NAME                    REFERENCE                          TARGETS    MINPODS   MAXPODS   REPLICAS
cloud-citizen-info-mi   Deployment/cloud-citizen-info-mi   35%/10%    1         3         2
cloud-citizen-info-mi   Deployment/cloud-citizen-info-mi   42%/10%    1         3         3
```

Open a second terminal and check pods:

```bash
kubectl get pods -n minikube-demo -l deployment=cloud-citizen-info-mi
```

Expected output after scale-out:

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

Check that every replica still sees the CApp:

## Windows PowerShell

```powershell
kubectl get pods -n minikube-demo -l deployment=cloud-citizen-info-mi -o name | ForEach-Object {
  kubectl exec -n minikube-demo $_ -- ls /home/wso2carbon/wso2mi-4.6.0/repository/deployment/server/carbonapps
}
```

## macOS Terminal

```bash
for pod in $(kubectl get pods -n minikube-demo -l deployment=cloud-citizen-info-mi -o name); do
  kubectl exec -n minikube-demo "$pod" -- ls /home/wso2carbon/wso2mi-4.6.0/repository/deployment/server/carbonapps
done
```

Expected output:

```text
CitizenInfoCompositeExporter_1.0.0.car
CitizenInfoCompositeExporter_1.0.0.car
CitizenInfoCompositeExporter_1.0.0.car
```

Stop watching with `Ctrl+C` after you observe scale-out.

Clean up the load generator:

```bash
kubectl delete job mi-load-generator -n minikube-demo
```

Expected output:

```text
job.batch "mi-load-generator" deleted
```

HPA scale-down can take several minutes. That delay is normal.

---

# 17. Prove service routing across scaled MI workers

Send repeated requests:

```bash
kubectl run mi-routing-check -n minikube-demo --rm -i --restart=Never --image=curlimages/curl:8.10.1 -- sh -c "for i in 1 2 3 4 5 6 7 8; do curl -k -s https://cloud-citizen-info-mi:8253/citizen/health; echo; done"
```

Expected result:

```text
Responses should show the same service name.
The pod value may change between requests.
```

Example:

```json
{"service":"citizen-info-mi","status":"UP","pod":"cloud-citizen-info-mi-xxxxxxxxxx-aaaaa"}
{"service":"citizen-info-mi","status":"UP","pod":"cloud-citizen-info-mi-xxxxxxxxxx-bbbbb"}
{"service":"citizen-info-mi","status":"UP","pod":"cloud-citizen-info-mi-xxxxxxxxxx-ccccc"}
```

If all responses show one pod, run the command again. Service load balancing can reuse connections.

---

# 18. Verify APIM can reach MI

Only do this section after completing Lab 07.

Check APIM:

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

# 19. Create the MI-backed API in API Manager

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

# 20. Subscribe and generate a token

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

# 21. Invoke MI through API Manager

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

# 22. Useful operations

Show Helm release:

```bash
helm list -n minikube-demo
```

Show current values:

```bash
helm get values citizen-info-mi -n minikube-demo
```

Show HPA:

```bash
kubectl describe hpa cloud-citizen-info-mi -n minikube-demo
```

Show pod metrics:

```bash
kubectl top pods -n minikube-demo
```

Show MI logs:

```bash
kubectl logs -n minikube-demo deployment/cloud-citizen-info-mi -f
```

Show MI resources:

```bash
kubectl get deployment,svc,endpoints,pods,hpa -n minikube-demo -l app.kubernetes.io/instance=citizen-info-mi
```

Disable HPA and keep one replica:

```bash
helm upgrade citizen-info-mi . --namespace minikube-demo -f values_local.yaml -f values-mi-minikube-working.yaml --set wso2.deployment.replicas=1 --set wso2.deployment.hpa.enabled=false
kubectl set volume deployment/cloud-citizen-info-mi -n minikube-demo --add --overwrite --name=mi-carbonapps --type=persistentVolumeClaim --claim-name=mi-carbonapps-pvc --mount-path=/home/wso2carbon/wso2mi-4.6.0/repository/deployment/server/carbonapps
```

---

# Troubleshooting

| Error | Meaning | Fix | Validation |
|---|---|---|---|
| `TARGETS <unknown>` in HPA | metrics-server is missing or not ready | Enable metrics-server and wait until `kubectl top nodes` works | `kubectl get hpa` shows `2%/10%` or similar |
| HPA does not scale | Load is too small, CPU request is too high, or metrics have not refreshed | Run the load generator again, lower the demo CPU target, or wait 1-3 minutes | `kubectl describe hpa` shows recent metrics and scaling events |
| Pod stays `Pending` after HPA scale-out | Not enough CPU or memory in minikube | Use fewer max replicas or restart minikube with more resources | New pods become `Running` |
| CApp is not visible inside MI pods | Shared volume was not patched into the Deployment after Helm install or upgrade | Re-run the `kubectl set volume` command | `kubectl exec deployment/cloud-citizen-info-mi -- ls .../carbonapps` shows the `.car` |
| API returns 404 | CApp did not deploy, wrong CApp, or wrong API path | Check MI logs and verify the CApp contains `/citizen` resources | `/citizen/health` returns JSON |
| `kubectl cp` fails | Helper pod is not ready or local CApp path is wrong | Check `mi-capp-loader` and confirm the `.car` exists locally | `kubectl exec mi-capp-loader -- ls -l /carbonapps` shows the `.car` |
| Chart creates Gateway API or Ingress resources | Gateway API or metrics Ingress was left enabled | Use `values_local.yaml` first, then `values-mi-minikube-working.yaml` | `kubectl get svc -n minikube-demo` shows `cloud-citizen-info-mi` |
| `curl` fails with certificate warning | MI backend uses HTTPS with a local certificate | Use `curl -k` for local testing | Health check returns JSON |
| APIM endpoint test fails | APIM cannot reach MI or endpoint URL is wrong | Use the full Kubernetes DNS HTTPS endpoint from this lab | `apim-mi-check` returns MI health JSON |
| Gateway returns `401` or `403` | Missing, expired, or wrong access token | Generate a new token in Developer Portal | Curl includes `Authorization: Bearer <token>` |
| Gateway cannot connect | Lab 07 gateway port-forward or hosts entry is missing | Restart Lab 07 port-forward and verify `gw.wso2.com` hosts entry | `curl -k https://gw.wso2.com:8243` reaches APIM |

---

# Cleanup

Run from the official `mi` chart folder.

Delete the load generator if it is still running:

```bash
kubectl delete job mi-load-generator -n minikube-demo --ignore-not-found
```

Remove MI:

```bash
helm uninstall citizen-info-mi -n minikube-demo
```

Expected output:

```text
release "citizen-info-mi" uninstalled
```

Remove the shared volume helper and PVC:

```bash
kubectl delete -f labs/12-wso2-mi-scaling/k8s/mi-carbonapps-shared-volume.yaml
```

Expected output:

```text
persistentvolumeclaim "mi-carbonapps-pvc" deleted
pod "mi-capp-loader" deleted
```

Validate:

```bash
kubectl get deployment,svc,pods,hpa -n minikube-demo -l app.kubernetes.io/instance=citizen-info-mi
```

Expected output:

```text
No resources found in minikube-demo namespace.
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
- WSO2 MI exporting artifacts as CApp/CAR: `https://mi.docs.wso2.com/en/4.2.0/develop/exporting-artifacts/`
- WSO2 CApp deployment process and hot deployment directory: `https://wso2docs.atlassian.net/wiki/spaces/Carbon420/pages/15269895/C-App+Deployment+Process`
- WSO2 MI Kubernetes exporter: `https://mi.docs.wso2.com/en/4.2.0/develop/create-kubernetes-project/`
- Kubernetes HPA: `https://kubernetes.io/docs/concepts/workloads/autoscaling/horizontal-pod-autoscale/`
- Kubernetes `kubectl top`: `https://kubernetes.io/docs/reference/kubectl/generated/kubectl_top/`
- Minikube metrics-server add-on: `https://minikube.sigs.k8s.io/docs/handbook/addons/yakd-kubernetes-dashboard/`
