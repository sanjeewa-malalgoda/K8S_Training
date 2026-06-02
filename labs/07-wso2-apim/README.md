# Lab 07 — Deploy WSO2 API Manager 4.6.0 All-in-One on Minikube

This guide deploys **WSO2 API Manager 4.6.0 All-in-One** on local Minikube using Helm.

This is the working setup from the lab:

```text
Windows / macOS
Docker Desktop
Minikube with Docker driver
kubectl
Helm
WSO2 APIM Helm chart: all-in-one-4.6.0-2
```

Important:

```text
This working path does NOT use minikube ingress addon.
This working path does NOT use minikube tunnel.
Browser access is done using:
  hosts file + kubectl port-forward 443:9443 and 8243:8243
```

Final browser URLs:

```text
https://am.wso2.com/publisher/
https://am.wso2.com/devportal/
https://am.wso2.com/admin/
```

Gateway invoke base URL:

```text
https://gw.wso2.com:8243
```

Default login:

```text
admin / admin
```

---

# 1. Prerequisites

Install:

```text
Docker Desktop
Minikube
kubectl
Helm
```

Check:

## Windows PowerShell

```powershell
docker version
minikube version
kubectl version --client
helm version
```

## macOS Terminal

```bash
docker version
minikube version
kubectl version --client
helm version
```

Docker Desktop must be running.

---

# 2. Start or verify Minikube

If Minikube is already running and working, you can skip the delete/start step.

Check:

## Windows / macOS

```bash
kubectl get nodes
kubectl get pods -A
```

Expected node status:

```text
minikube   Ready
```

For a fresh Minikube cluster:

## Windows PowerShell

```powershell
minikube delete
minikube start --driver=docker --cpus=4 --memory=7168 --disk-size=40g
```

## macOS Terminal

```bash
minikube delete
minikube start --driver=docker --cpus=4 --memory=8192 --disk-size=40g
```

If Docker Desktop rejects the memory value, reduce `--memory` to a value Docker allows, or increase Docker Desktop resources.

Do not run these for this lab:

```bash
minikube addons enable ingress
minikube tunnel
```

They are not used in this working path.

---

# 3. Get the WSO2 APIM Helm chart

Use the official WSO2 Helm APIM chart release:

```text
all-in-one-4.6.0-2
```

Download from:

```text
https://github.com/wso2/helm-apim/releases
```

You can download and extract the release manually, or use commands below.

## Windows PowerShell

```powershell
cd $env:USERPROFILE\Downloads

$TAG = "all-in-one-4.6.0-2"
$ZIP = "helm-apim-$TAG.zip"
$URL = "https://github.com/wso2/helm-apim/archive/refs/tags/$TAG.zip"

Invoke-WebRequest -Uri $URL -OutFile $ZIP
Expand-Archive -Path $ZIP -DestinationPath . -Force
```

Now go to the final `all-in-one` chart folder.

Usually:

```powershell
cd "$env:USERPROFILE\Downloads\helm-apim-all-in-one-4.6.0-2\all-in-one"
```

If your extracted folder has an extra nested folder, use the folder that contains `Chart.yaml`.

Example from the working laptop:

```powershell
cd C:\Users\sanje\Downloads\helm-apim-all-in-one-4.6.0-2\helm-apim-all-in-one-4.6.0-2\all-in-one
```

Check:

```powershell
dir
```

You must see:

```text
Chart.yaml
values.yaml
values-local.yaml
templates
```

## macOS Terminal

```bash
cd ~/Downloads

TAG="all-in-one-4.6.0-2"
ZIP="helm-apim-$TAG.zip"
URL="https://github.com/wso2/helm-apim/archive/refs/tags/$TAG.zip"

curl -L "$URL" -o "$ZIP"
unzip -o "$ZIP"
```

Go to the chart folder:

```bash
cd ~/Downloads/helm-apim-all-in-one-4.6.0-2/all-in-one
```

If your extracted path is different, go to the folder that contains `Chart.yaml`.

Check:

```bash
ls
```

You must see:

```text
Chart.yaml
values.yaml
values-local.yaml
templates
```

---

# 4. Create one working values file

Do not ask users to patch DB driver, truststore, digest, image pull policy, and probes step-by-step.

Create one final working values file:

```text
values-apim-minikube-working.yaml
```

This file combines the working local image/resource settings and the APIM fixes that were needed during the lab.

## Windows PowerShell

```powershell
@'
# values-apim-minikube-working.yaml
# Working local override for WSO2 APIM 4.6.0 All-In-One on Minikube.
# Access method used by this tutorial:
#   hosts file: am.wso2.com -> 127.0.0.1
#   hosts file: gw.wso2.com -> 127.0.0.1
#   kubectl port-forward local 443 -> APIM service 9443
#   kubectl port-forward local 8243 -> APIM gateway service 8243
#
# This file is for local lab/demo use.

wso2:
  apim:
    configurations:
      adminUsername: "admin"
      adminPassword: "admin"

      oauth_config:
        oauth2JWKSUrl: "https://localhost:9443/oauth2/jwks"

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

      gateway:
        environments:
          - name: "Default"
            type: "hybrid"
            gatewayType: "Regular"
            provider: "wso2"
            visibility:
            displayInApiConsole: true
            description: "This is a hybrid gateway that handles both production and sandbox token traffic."
            showAsTokenEndpointUrl: true
            serviceName: "wso2am-gateway-service"
            servicePort: 9443
            wsHostname: "websocket.wso2.com"
            httpHostname: "gw.wso2.com:8243"
            websubHostname: "websub.wso2.com"

  deployment:
    highAvailability: false

    image:
      imagePullSecrets:
        enabled: false
        username: ""
        password: ""
      registry: "docker.io"
      repository: "wso2/wso2am"
      digest: "sha256:cd69005240af25042e8cd6eccce8fbe9341732bc887b919395c7aaddb43f8d53"
      imagePullPolicy: IfNotPresent

    resources:
      requests:
        memory: "2Gi"
        cpu: "1000m"
      limits:
        memory: "4Gi"
        cpu: "2000m"
      jvm:
        memory:
          xms: "2048m"
          xmx: "2048m"

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

kubernetes:
  openshift:
    enabled: false

  ingressClass: "nginx"
  ingress:
    tlsSecret: ""
    ratelimit:
      enabled: false

    management:
      enabled: true
      hostname: "am.wso2.com"
      annotations:
        nginx.ingress.kubernetes.io/backend-protocol: "HTTPS"
        nginx.ingress.kubernetes.io/affinity: "cookie"
        nginx.ingress.kubernetes.io/session-cookie-name: "route"
        nginx.ingress.kubernetes.io/session-cookie-hash: "sha1"

    gateway:
      enabled: true
      hostname: "gw.wso2.com"
      annotations:
        nginx.ingress.kubernetes.io/backend-protocol: "HTTPS"
        nginx.ingress.kubernetes.io/proxy-buffering: "on"
        nginx.ingress.kubernetes.io/proxy-buffer-size: "8k"

    websocket:
      enabled: true
      hostname: "websocket.wso2.com"

    websub:
      enabled: true
      hostname: "websub.wso2.com"
'@ | Set-Content .\values-apim-minikube-working.yaml
```

Verify:

```powershell
Get-Content .\values-apim-minikube-working.yaml
```

## macOS Terminal

```bash
cat > values-apim-minikube-working.yaml <<'EOF'
# values-apim-minikube-working.yaml
# Working local override for WSO2 APIM 4.6.0 All-In-One on Minikube.
# Access method used by this tutorial:
#   hosts file: am.wso2.com -> 127.0.0.1
#   hosts file: gw.wso2.com -> 127.0.0.1
#   kubectl port-forward local 443 -> APIM service 9443
#   kubectl port-forward local 8243 -> APIM gateway service 8243
#
# This file is for local lab/demo use.

wso2:
  apim:
    configurations:
      adminUsername: "admin"
      adminPassword: "admin"

      oauth_config:
        oauth2JWKSUrl: "https://localhost:9443/oauth2/jwks"

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

      gateway:
        environments:
          - name: "Default"
            type: "hybrid"
            gatewayType: "Regular"
            provider: "wso2"
            visibility:
            displayInApiConsole: true
            description: "This is a hybrid gateway that handles both production and sandbox token traffic."
            showAsTokenEndpointUrl: true
            serviceName: "wso2am-gateway-service"
            servicePort: 9443
            wsHostname: "websocket.wso2.com"
            httpHostname: "gw.wso2.com:8243"
            websubHostname: "websub.wso2.com"

  deployment:
    highAvailability: false

    image:
      imagePullSecrets:
        enabled: false
        username: ""
        password: ""
      registry: "docker.io"
      repository: "wso2/wso2am"
      digest: "sha256:cd69005240af25042e8cd6eccce8fbe9341732bc887b919395c7aaddb43f8d53"
      imagePullPolicy: IfNotPresent

    resources:
      requests:
        memory: "2Gi"
        cpu: "1000m"
      limits:
        memory: "4Gi"
        cpu: "2000m"
      jvm:
        memory:
          xms: "2048m"
          xmx: "2048m"

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

kubernetes:
  openshift:
    enabled: false

  ingressClass: "nginx"
  ingress:
    tlsSecret: ""
    ratelimit:
      enabled: false

    management:
      enabled: true
      hostname: "am.wso2.com"
      annotations:
        nginx.ingress.kubernetes.io/backend-protocol: "HTTPS"
        nginx.ingress.kubernetes.io/affinity: "cookie"
        nginx.ingress.kubernetes.io/session-cookie-name: "route"
        nginx.ingress.kubernetes.io/session-cookie-hash: "sha1"

    gateway:
      enabled: true
      hostname: "gw.wso2.com"
      annotations:
        nginx.ingress.kubernetes.io/backend-protocol: "HTTPS"
        nginx.ingress.kubernetes.io/proxy-buffering: "on"
        nginx.ingress.kubernetes.io/proxy-buffer-size: "8k"

    websocket:
      enabled: true
      hostname: "websocket.wso2.com"

    websub:
      enabled: true
      hostname: "websub.wso2.com"
EOF
```

Verify:

```bash
cat values-apim-minikube-working.yaml
```

---

# 5. Install APIM with the single values file

Use only the single working values file created above.

## Windows PowerShell

```powershell
helm upgrade --install apim . `
  --namespace wso2 `
  --create-namespace `
  --dependency-update `
  -f values-apim-minikube-working.yaml
```

## macOS Terminal

```bash
helm upgrade --install apim . \
  --namespace wso2 \
  --create-namespace \
  --dependency-update \
  -f values-apim-minikube-working.yaml
```

---

# 6. Apply the service patch

This is the only post-install patch required.

Create:

```text
svc-patch.json
```

Why this is still separate:

```text
The Helm values file fixes APIM configuration, image, DB, truststore, and probes.
The service patch fixes Kubernetes service behaviour used during APIM startup self-calls.
```

## Windows PowerShell

```powershell
@'
{"spec":{"publishNotReadyAddresses":true}}
'@ | Set-Content .\svc-patch.json

kubectl patch svc -n wso2 apim-wso2am-all-in-one-am-service --type merge --patch-file .\svc-patch.json
```

## macOS Terminal

```bash
cat > svc-patch.json <<'EOF'
{"spec":{"publishNotReadyAddresses":true}}
EOF

kubectl patch svc -n wso2 apim-wso2am-all-in-one-am-service --type merge --patch-file ./svc-patch.json
```

Restart the deployment so APIM starts with the corrected service behaviour.

## Windows / macOS

```bash
kubectl rollout restart deployment -n wso2 apim-wso2am-all-in-one-am-deployment-1
```

---

# 7. Wait until APIM is healthy

Run:

## Windows / macOS

```bash
kubectl get pods -n wso2 -w
```

Expected final state:

```text
apim-wso2am-all-in-one-am-deployment-1-xxxxx   1/1   Running
```

Do not continue until it is:

```text
1/1 Running
```

Stop watching:

```text
Ctrl + C
```

## Watch WSO2 server logs

After the pod reaches `1/1 Running`, watch the WSO2 server logs so you can see APIM finishing startup.

## Windows / macOS

```bash
kubectl logs -n wso2 deployment/apim-wso2am-all-in-one-am-deployment-1 -f
```

Expected output includes WSO2 startup messages similar to:

```text
WSO2 Carbon started in ...
Mgt Console URL  : https://...
API Publisher    : https://...
Developer Portal : https://...
```

The exact timestamps and URLs may be different.

Stop watching logs after startup is complete:

```text
Ctrl + C
```

This only stops the log view. It does not stop APIM.

If APIM restarted and you need the previous crash/startup logs, run:

## Windows / macOS

```bash
kubectl logs -n wso2 deployment/apim-wso2am-all-in-one-am-deployment-1 --previous --tail=200
```

---

# 8. Verify generated APIM configuration

Run:

## Windows PowerShell

```powershell
kubectl get cm -n wso2 apim-wso2am-all-in-one-am-conf-1 -o jsonpath="{.data.deployment\.toml}" | Select-String -Pattern "\[database.apim_db\]|\[database.shared_db\]|type =|url =|username =|driver =|\[truststore\]|password|\[oauth.config\]|oauth2_jwks_url|\[\[apim.gateway.environment\]\]|https_endpoint" -Context 0,1
```

## macOS Terminal

```bash
kubectl get cm -n wso2 apim-wso2am-all-in-one-am-conf-1 -o jsonpath='{.data.deployment\.toml}' | grep -E '\[database.apim_db\]|\[database.shared_db\]|type =|url =|username =|driver =|\[truststore\]|password|\[oauth.config\]|oauth2_jwks_url|\[\[apim.gateway.environment\]\]|https_endpoint'
```

Expected important values:

```text
type = "h2"
driver = "org.h2.Driver"
password = "wso2carbon"
```

Expected database URLs:

```text
jdbc:h2:./repository/database/WSO2AM_DB;DB_CLOSE_ON_EXIT=FALSE
jdbc:h2:./repository/database/WSO2SHARED_DB;DB_CLOSE_ON_EXIT=FALSE
```

The URLs must not contain:

```text
AUTO_SERVER=TRUE
```

Expected OAuth JWKS URL:

```text
oauth2_jwks_url = "https://localhost:9443/oauth2/jwks"
```

Expected gateway URL:

```text
https_endpoint = "https://gw.wso2.com:8243"
```

---

# 9. Configure hosts file

The browser must use the APIM hostname:

```text
am.wso2.com
gw.wso2.com
```

Map it to local machine:

```text
127.0.0.1 am.wso2.com
127.0.0.1 gw.wso2.com
```

## Windows

Open Notepad as Administrator.

Open:

```text
C:\Windows\System32\drivers\etc\hosts
```

Add:

```text
127.0.0.1 am.wso2.com
127.0.0.1 gw.wso2.com
```

Save the file.

Flush DNS:

```powershell
ipconfig /flushdns
```

## macOS

Run:

```bash
echo "127.0.0.1 am.wso2.com" | sudo tee -a /etc/hosts
echo "127.0.0.1 gw.wso2.com" | sudo tee -a /etc/hosts
sudo dscacheutil -flushcache
sudo killall -HUP mDNSResponder
```

Check:

```bash
grep -E "am.wso2.com|gw.wso2.com" /etc/hosts
```

---

# 10. Start port-forward for portal and gateway access

This is the working access path.

It maps:

```text
local machine port 443
  -> APIM management service port 9443

local machine port 8243
  -> APIM gateway service port 8243
```

## Windows PowerShell as Administrator

```powershell
kubectl port-forward -n wso2 svc/apim-wso2am-all-in-one-am-service 443:9443 8243:8243
```

Keep this PowerShell window open.

## macOS Terminal

Port `443` is privileged, so use `sudo`.

```bash
sudo -E kubectl port-forward -n wso2 svc/apim-wso2am-all-in-one-am-service 443:9443 8243:8243
```

Keep this terminal window open.

If `sudo -E` cannot find the Kubernetes context, use:

```bash
sudo KUBECONFIG=$HOME/.kube/config kubectl port-forward -n wso2 svc/apim-wso2am-all-in-one-am-service 443:9443 8243:8243
```

Expected output:

```text
Forwarding from 127.0.0.1:443 -> 9443
Forwarding from [::1]:443 -> 9443
Forwarding from 127.0.0.1:8243 -> 8243
Forwarding from [::1]:8243 -> 8243
```

Verify the gateway port from another terminal:

```bash
curl -k https://gw.wso2.com:8243
```

Expected output can be a WSO2 response or a not-found response.
The important result is that the connection reaches APIM and does not fail with:

```text
Could not resolve host
Connection refused
```

---

# 11. Open APIM in browser

Open:

```text
https://am.wso2.com/publisher/
```

Other portals:

```text
https://am.wso2.com/devportal/
https://am.wso2.com/admin/
```

Gateway invoke base URL:

```text
https://gw.wso2.com:8243
```

Accept the browser certificate warning.

Login:

```text
admin / admin
```

---

# 12. Quick health commands

Check pod:

```bash
kubectl get pods -n wso2
```

Check service:

```bash
kubectl get svc -n wso2
```

Check all resources:

```bash
kubectl get all -n wso2
```

Check logs:

## Windows PowerShell

```powershell
$POD = kubectl get pods -n wso2 -o jsonpath="{.items[0].metadata.name}"
kubectl logs -n wso2 -f $POD
```

## macOS Terminal

```bash
POD=$(kubectl get pods -n wso2 -o jsonpath='{.items[0].metadata.name}')
kubectl logs -n wso2 -f "$POD"
```

Check previous logs after a restart:

## Windows PowerShell

```powershell
$POD = kubectl get pods -n wso2 -o jsonpath="{.items[0].metadata.name}"
kubectl logs -n wso2 $POD --previous --tail=200
```

## macOS Terminal

```bash
POD=$(kubectl get pods -n wso2 -o jsonpath='{.items[0].metadata.name}')
kubectl logs -n wso2 "$POD" --previous --tail=200
```

---

# Troubleshooting

## Error: `ErrImageNeverPull`

Cause:

```yaml
imagePullPolicy: Never
```

Fixed in the working values file:

```yaml
imagePullPolicy: IfNotPresent
```

---

## Error: `InvalidImageName`

Cause:

```yaml
digest: "@sha256:..."
```

Fixed in the working values file:

```yaml
digest: "sha256:cd69005240af25042e8cd6eccce8fbe9341732bc887b919395c7aaddb43f8d53"
```

Do not include `@` in the digest value.

---

## Error: APIM restarts because startup probe fails

Symptoms:

```text
CrashLoopBackOff
Startup probe failed
Connection refused on localhost:9443
```

Fixed in the working values file:

```yaml
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

## Error: Truststore password missing

Symptoms:

```text
java.lang.NullPointerException
org.wso2.carbon.user.core.internal.Activator.startDeploy
```

Fixed in the working values file:

```yaml
security:
  truststore:
    name: "client-truststore.jks"
    password: "wso2carbon"
```

---

## Error: Blank JDBC driver

Symptoms:

```text
Unable to load class:
ClassNotFoundException:
```

Fixed in the working values file:

```yaml
databases:
  type: "h2"
  jdbc:
    driver: "org.h2.Driver"
```

---

## Error: H2 URL unsupported

Symptoms:

```text
Feature not supported: "AUTO_SERVER=TRUE && DB_CLOSE_ON_EXIT=FALSE"
```

Wrong:

```text
jdbc:h2:./repository/database/WSO2AM_DB;AUTO_SERVER=TRUE;DB_CLOSE_ON_EXIT=FALSE
```

Fixed in the working values file:

```text
jdbc:h2:./repository/database/WSO2AM_DB;DB_CLOSE_ON_EXIT=FALSE
```

---

## Error: APIM self-call to service fails

Symptoms:

```text
Connect to apim-wso2am-all-in-one-am-service:9443 failed: Connection refused
Failed retrieving Key Manager Configurations from remote endpoint
```

Fixed by the service patch:

```json
{"spec":{"publishNotReadyAddresses":true}}
```

Apply:

```bash
kubectl patch svc -n wso2 apim-wso2am-all-in-one-am-service --type merge --patch-file ./svc-patch.json
kubectl rollout restart deployment -n wso2 apim-wso2am-all-in-one-am-deployment-1
```

---

## Error: Port 443 or 8243 already in use

## Windows

```powershell
netstat -ano | findstr ":443"
netstat -ano | findstr ":8243"
```

Stop the process using the busy port, then run port-forward again.

## macOS

```bash
sudo lsof -iTCP:443 -sTCP:LISTEN -n -P
sudo lsof -iTCP:8243 -sTCP:LISTEN -n -P
```

Stop the process using the busy port, then run port-forward again.

---

## Error: Browser cannot reach APIM

Check these in order:

```bash
kubectl get pods -n wso2
```

Expected:

```text
1/1 Running
```

Check hosts entry:

## Windows

```powershell
Select-String -Path C:\Windows\System32\drivers\etc\hosts -Pattern "am.wso2.com|gw.wso2.com"
```

## macOS

```bash
grep -E "am.wso2.com|gw.wso2.com" /etc/hosts
```

Check port-forward is still running:

```text
local 443 -> apim-wso2am-all-in-one-am-service:9443
local 8243 -> apim-wso2am-all-in-one-am-service:8243
```

Then open:

```text
https://am.wso2.com/publisher/
```

Check gateway access:

```text
https://gw.wso2.com:8243
```

---

# Final working flow

```text
Start Docker Desktop
  ↓
Start or reuse Minikube
  ↓
Download/extract WSO2 APIM all-in-one-4.6.0-2 Helm chart
  ↓
Go to all-in-one chart folder
  ↓
Create one values file: values-apim-minikube-working.yaml
  ↓
helm upgrade --install using only that values file
  ↓
Apply svc-patch.json
  ↓
Restart APIM deployment
  ↓
Wait until pod is 1/1 Running
  ↓
Map am.wso2.com to 127.0.0.1 in hosts file
  ↓
Map gw.wso2.com to 127.0.0.1 in hosts file
  ↓
Run kubectl port-forward 443:9443 8243:8243
  ↓
Open https://am.wso2.com/publisher/
  ↓
Invoke APIs through https://gw.wso2.com:8243
```

---

# Cleanup

Stop the `kubectl port-forward` window first:

```text
Ctrl + C
```

Then remove the Helm release and namespace.

Warning: this removes the APIM deployment, services, configmaps, and local H2 data stored in the `wso2` namespace.

## Windows / macOS

```bash
helm uninstall apim -n wso2
kubectl delete namespace wso2
```

Expected output:

```text
release "apim" uninstalled
namespace "wso2" deleted
```

Validate cleanup:

```bash
kubectl get namespace wso2
```

Expected output:

```text
Error from server (NotFound): namespaces "wso2" not found
```

---

# Local lab note

This setup uses H2 only for local learning.

For production-like deployment, use PostgreSQL or another supported external database.
