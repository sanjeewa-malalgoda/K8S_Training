# Lab 16 - Deploy WSO2 IAM 7.0.0 with Helm

This lab installs WSO2 Identity Server 7.0.0, also called WSO2 IAM, on
minikube using the official Helm chart.

You deploy one Identity Server pod, validate the OIDC discovery endpoint, open
the Console, and walk through a basic IAM use-case overview.

---

# 1. What You Build

```text
Browser or curl
  -> kubectl port-forward
  -> WSO2 Identity Server pod
  -> Console, My Account, and OIDC endpoints
```

This lab uses:

| Need | Resource |
|---|---|
| Namespace | `wso2-iam` |
| Helm release | `wso2iam` |
| Helm chart | Official WSO2 `identity-server` Helm chart |
| Chart version | `7.0.0-2` |
| Local chart package | `identity-server-7.0.0-2.tgz` |
| Product image | `registry.wso2.com/wso2is/is:7.0.0` |
| Kubernetes Service | `wso2iam-identity-server` |
| Local access | `https://localhost:9443/console` |
| Default username | `admin` |
| Default password | `admin` |

---

# 2. Basic IAM Use-Case Overview

WSO2 IAM is the identity provider for applications.

| Use case | What the learner does |
|---|---|
| Sign in as administrator | Open Console and log in with `admin` / `admin` |
| Manage users | Create a demo user such as `citizen.user` |
| Register an application | Create an OIDC application for a citizen portal |
| Discover OIDC endpoints | Call the OpenID Provider metadata endpoint |
| End-user self-service | Open My Account and review profile/session options |

In a real project, the application redirects users to WSO2 IAM for login. WSO2
IAM authenticates the user and returns tokens to the application through OIDC.

---

# 3. Prerequisites

Run commands from the repository root.

Required:

```text
Docker Desktop is running
minikube is running with the Docker driver
kubectl works
Helm works
At least 4 CPUs and 6 GiB memory are available to minikube
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

If your minikube cluster is too small, stop and recreate it before this lab:

```powershell
minikube delete
minikube start --driver=docker --cpus=4 --memory=8192 --disk-size=40g
```

Warning: `minikube delete` removes the current cluster and all deployments.

---

# 4. Download the Official WSO2 IAM Helm Chart

This lab installs from a local copy of the official WSO2 Helm chart package.
That keeps the deployment flow explicit and easy to troubleshoot.

## Windows PowerShell

```powershell
$REPO = (Get-Location).Path
$NAMESPACE = "wso2-iam"
$RELEASE = "wso2iam"
$CHART_VERSION = "7.0.0-2"
$CHART = "$env:USERPROFILE\Downloads\identity-server-$CHART_VERSION.tgz"
$VALUES = "$REPO\labs\16-wso2-iam-helm-basic\values-is-minikube-working.yaml"

helm repo add wso2 https://helm.wso2.com
helm repo update wso2
helm pull wso2/identity-server --version $CHART_VERSION --destination "$env:USERPROFILE\Downloads"

Test-Path $CHART
Test-Path $VALUES
helm show chart $CHART
```

Expected output includes:

```text
"wso2" has been added to your repositories
True
True
name: identity-server
version: 7.0.0-2
```

## macOS Terminal

```bash
REPO="$(pwd)"
NAMESPACE="wso2-iam"
RELEASE="wso2iam"
CHART_VERSION="7.0.0-2"
CHART="$HOME/Downloads/identity-server-$CHART_VERSION.tgz"
VALUES="$REPO/labs/16-wso2-iam-helm-basic/values-is-minikube-working.yaml"

helm repo add wso2 https://helm.wso2.com
helm repo update wso2
helm pull wso2/identity-server --version "$CHART_VERSION" --destination "$HOME/Downloads"

test -f "$CHART" && echo "chart package found"
test -f "$VALUES" && echo "lab values found"
helm show chart "$CHART"
```

Expected output includes:

```text
"wso2" has been added to your repositories
chart package found
lab values found
name: identity-server
version: 7.0.0-2
```

---

# 5. Pull the Product Image

This step fails early if Docker Desktop or the network cannot reach the WSO2
image registry.

## Windows PowerShell

```powershell
docker pull registry.wso2.com/wso2is/is:7.0.0
```

Expected output includes:

```text
Status: Downloaded newer image for registry.wso2.com/wso2is/is:7.0.0
```

If the image already exists, `Image is up to date` is also OK.

## macOS Terminal

```bash
docker pull registry.wso2.com/wso2is/is:7.0.0
```

Expected output includes:

```text
Status: Downloaded newer image for registry.wso2.com/wso2is/is:7.0.0
```

On Apple Silicon Macs, such as M1, M2, M3, or M4, use this fallback if the pod
later shows an architecture-related startup or image issue:

```bash
docker pull --platform linux/amd64 registry.wso2.com/wso2is/is:7.0.0
minikube image load registry.wso2.com/wso2is/is:7.0.0
minikube image ls | grep -i wso2is
```

Expected output includes:

```text
registry.wso2.com/wso2is/is:7.0.0
```

---

# 6. Install WSO2 IAM with Helm

## Windows PowerShell

```powershell
$REPO = (Get-Location).Path
$NAMESPACE = "wso2-iam"
$RELEASE = "wso2iam"
$CHART_VERSION = "7.0.0-2"
$CHART = "$env:USERPROFILE\Downloads\identity-server-$CHART_VERSION.tgz"
$VALUES = "$REPO\labs\16-wso2-iam-helm-basic\values-is-minikube-working.yaml"

kubectl create namespace $NAMESPACE --dry-run=client -o yaml | kubectl apply -f -

helm lint $CHART -f $VALUES

helm upgrade --install $RELEASE $CHART `
  --namespace $NAMESPACE `
  -f $VALUES `
  --set deployment.apparmor.enabled=false
```

Expected output includes:

```text
namespace/wso2-iam created
1 chart(s) linted, 0 chart(s) failed
STATUS: deployed
```

If the namespace already exists, `configured` or `unchanged` is also OK.

## macOS Terminal

```bash
REPO="$(pwd)"
NAMESPACE="wso2-iam"
RELEASE="wso2iam"
CHART_VERSION="7.0.0-2"
CHART="$HOME/Downloads/identity-server-$CHART_VERSION.tgz"
VALUES="$REPO/labs/16-wso2-iam-helm-basic/values-is-minikube-working.yaml"

kubectl create namespace "$NAMESPACE" --dry-run=client -o yaml | kubectl apply -f -

helm lint "$CHART" -f "$VALUES"

helm upgrade --install "$RELEASE" "$CHART" \
  --namespace "$NAMESPACE" \
  -f "$VALUES" \
  --set deployment.apparmor.enabled=false
```

Expected output includes:

```text
namespace/wso2-iam created
1 chart(s) linted, 0 chart(s) failed
STATUS: deployed
```

---

# 7. Wait for Startup

WSO2 IAM can take several minutes to start on a laptop.

```powershell
kubectl get pods -n wso2-iam
kubectl rollout status deployment -n wso2-iam --timeout=10m
```

Expected output includes:

```text
deployment "...identity-server..." successfully rolled out
```

If rollout status cannot identify a single deployment, list it and run rollout
status against the deployment name:

```powershell
kubectl get deployment -n wso2-iam
kubectl rollout status deployment/<deployment-name> -n wso2-iam --timeout=10m
```

Check logs:

```powershell
kubectl logs -n wso2-iam -l app.kubernetes.io/instance=wso2iam --tail=200
```

Expected output includes:

```text
WSO2 Carbon started
```

If the label selector returns no pods, use:

```powershell
kubectl get pods -n wso2-iam
kubectl logs -n wso2-iam <pod-name> --tail=200
```

---

# 8. Open a Port Forward

Keep this terminal running while you access WSO2 IAM.

## Windows PowerShell

```powershell
kubectl port-forward -n wso2-iam svc/wso2iam-identity-server 9443:9443
```

Expected output:

```text
Forwarding from 127.0.0.1:9443 -> 9443
Forwarding from [::1]:9443 -> 9443
```

## macOS Terminal

```bash
kubectl port-forward -n wso2-iam svc/wso2iam-identity-server 9443:9443
```

Expected output:

```text
Forwarding from 127.0.0.1:9443 -> 9443
Forwarding from [::1]:9443 -> 9443
```

---

# 9. Validate OIDC Discovery

Open a second terminal from the repository root.

## Windows PowerShell

```powershell
kubectl run iam-oidc-discovery -n wso2-iam --rm -i --restart=Never --image=curlimages/curl:8.10.1 -- -v -k -sS https://wso2iam-identity-server:9443/oauth2/token/.well-known/openid-configuration
```

Expected output includes:

```json
"issuer"
"authorization_endpoint"
"token_endpoint"
"jwks_uri"
```

If internal service DNS does not resolve, validate through the local port
forward instead:

```powershell
curl.exe -v -k https://localhost:9443/oauth2/token/.well-known/openid-configuration
```

## macOS Terminal

```bash
kubectl run iam-oidc-discovery -n wso2-iam --rm -i --restart=Never --image=curlimages/curl:8.10.1 -- -v -k -sS https://wso2iam-identity-server:9443/oauth2/token/.well-known/openid-configuration
```

Expected output includes:

```json
"issuer"
"authorization_endpoint"
"token_endpoint"
"jwks_uri"
```

If internal service DNS does not resolve, validate through the local port
forward instead:

```bash
curl -v -k https://localhost:9443/oauth2/token/.well-known/openid-configuration
```

---

# 10. Open the Console and My Account

With the port-forward still running, open:

```text
https://localhost:9443/console
```

Log in with:

```text
Username: admin
Password: admin
```

Expected:

```text
The WSO2 Console opens.
```

Open My Account:

```text
https://localhost:9443/myaccount
```

Expected:

```text
The self-service My Account portal opens.
```

---

# 11. Basic Use-Case Walkthrough

Use the Console UI for this overview.

| Step | Action | Expected result |
|---|---|---|
| 1 | Go to User Management | You can see users and roles |
| 2 | Create a user named `citizen.user` | The user appears in the user list |
| 3 | Go to Applications | You can create an application |
| 4 | Create a Standard-Based Application named `Citizen Portal Local` | The application is created |
| 5 | Add OIDC settings with callback URL `http://localhost:3000/callback` | A client ID and client secret are generated |
| 6 | Review the OIDC discovery output from section 9 | You can map app settings to IAM endpoints |

This confirms the basic IAM pattern:

```text
Application -> WSO2 IAM login -> token issued -> application trusts the token
```

---

# 12. Cleanup

Warning: this removes the Lab 16 WSO2 IAM deployment.

## Windows PowerShell

```powershell
helm uninstall wso2iam -n wso2-iam
kubectl delete namespace wso2-iam
```

## macOS Terminal

```bash
helm uninstall wso2iam -n wso2-iam
kubectl delete namespace wso2-iam
```

Expected output includes:

```text
release "wso2iam" uninstalled
namespace "wso2-iam" deleted
```

---

# Troubleshooting

| Error | Meaning | Fix | Validation |
|---|---|---|---|
| Helm cannot find `wso2/identity-server` | The WSO2 Helm repository was not added or updated | Re-run section 4 | `helm pull wso2/identity-server --version 7.0.0-2` downloads the chart package |
| `helm repo update` fails on another repository such as Bitnami | Helm tried to update every configured repository, and an unrelated repository failed | Run `helm repo update wso2` instead of `helm repo update` | The WSO2 repository updates without depending on other repositories |
| `identity-server-7.0.0-2.tgz` not found | The chart package was not downloaded to `Downloads` | Re-run section 4 and check the `CHART` variable | `Test-Path $CHART` returns `True` or `test -f "$CHART"` prints `chart package found` |
| `ImagePullBackOff` | minikube cannot pull `registry.wso2.com/wso2is/is:7.0.0` | Run section 5 and check Docker Desktop network/proxy access | `kubectl get pods -n wso2-iam` no longer shows image pull errors |
| Pod stays `Pending` | minikube does not have enough CPU or memory | Recreate minikube with 4 CPUs and 8 GiB memory | Pod starts running |
| Image pull shows `unauthorized` | Docker cannot access the WSO2 image registry from this laptop | Log in to the registry if your workshop environment requires it, or confirm network access to `registry.wso2.com` | `docker pull registry.wso2.com/wso2is/is:7.0.0` succeeds |
| Startup probe fails | WSO2 IAM startup is slower than the probe window on this laptop | Increase `deployment.startupProbe.initialDelaySeconds` and `deployment.startupProbe.failureThreshold` in the values file, then rerun Helm | `kubectl rollout status deployment -n wso2-iam --timeout=10m` succeeds |
| Browser shows certificate warning | WSO2 IAM uses local/self-signed TLS in this lab | Accept the browser warning for the local lab only | Console opens at `https://localhost:9443/console` |
| `curl` shows certificate validation error | Local TLS is not trusted by the curl container or laptop | Use `-k` for this lab command | OIDC discovery JSON is returned |
| Console login fails | Wrong credentials or startup is not complete | Use `admin` / `admin` and wait for rollout/logs | Console home page opens |

---

# Notes

- This lab uses port-forwarding to avoid hosts-file differences between Windows
  and macOS.
- The official chart may still render an Ingress resource, but this first IAM
  lab does not depend on an ingress controller. Use the service port-forward
  path in section 8.
- The values file keeps AppArmor disabled because Docker Desktop/minikube
  setups often do not match Linux server AppArmor profiles.
