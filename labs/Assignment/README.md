# Assignment - Public Services Platform

This capstone folder deploys the shared runtime for the assignment:

```text
MySQL
  -> WSO2 Micro Integrator data service
  -> WSO2 API Manager gateway
  -> WSO2 Identity Server
  -> local Public Services Portal on your laptop
```

The web app does not run in Kubernetes. It runs on the host machine on
`http://localhost:3000`, like Lab 17.

---

# 1. What the Helm Chart Starts

| Component | Namespace | Resource |
|---|---|---|
| MySQL database | `minikube-demo` | `assignment-mysql` |
| Schema seed job | `minikube-demo` | `assignment-mysql-seed` |
| Micro Integrator | `minikube-demo` | `assignment-mi` |
| API Manager | `wso2` | `assignment-apim` |
| Identity Server | `wso2-iam` | `assignment-is` |

The chart stores database credentials in Kubernetes `Secret` objects. The MI
runtime copy of the data-service artifact is also mounted from a Secret because
it contains database connection details.

The chart configures APIM with `am.wso2.com` and `gw.wso2.com` so Publisher
login callbacks stay on the same local hostnames used by the browser.
The APIM image digest and OAuth JWKS setting match the working Lab 07 local
APIM path.

---

# 2. Prerequisites

Run commands from the repository root.

Required:

```text
Docker Desktop is running
minikube is running with the Docker driver
kubectl works
Helm works
Node.js is installed for the local web app
```

Validate:

```powershell
minikube status
kubectl get nodes
helm version
node -v
```

Expected output includes:

```text
minikube
Ready
version.BuildInfo
v...
```

Recommended minikube size:

```powershell
minikube start --driver=docker --cpus=4 --memory=8192 --disk-size=40g
```

---

# 3. Deploy the Assignment Runtime with One Helm Command

## Windows PowerShell

```powershell
helm upgrade --install public-services .\labs\Assignment `
  --namespace minikube-demo `
  --create-namespace
```

## macOS Terminal

```bash
helm upgrade --install public-services ./labs/Assignment \
  --namespace minikube-demo \
  --create-namespace
```

Expected output includes:

```text
STATUS: deployed
```

Wait for the pods:

```powershell
kubectl get pods -n minikube-demo
kubectl get pods -n wso2
kubectl get pods -n wso2-iam
```

Expected output includes:

```text
assignment-mysql-...   1/1   Running
assignment-mi-...      1/1   Running
assignment-apim-...    1/1   Running
assignment-is-...      1/1   Running
```

WSO2 products can take several minutes to become ready on a laptop.

---

# 4. Validate MySQL and MI

Check the seed job:

```powershell
kubectl logs -n minikube-demo job/assignment-mysql-seed
```

Expected output includes:

```text
applications
4
```

Call MI directly from inside the cluster:

```powershell
kubectl run assignment-mi-check -n minikube-demo --rm -i --restart=Never --image=curlimages/curl:8.10.1 -- curl -sS http://assignment-mi:8290/services/PublicServicesDataService/applications
```

Expected response includes:

```json
"Birth Certificate"
"Passport Renewal"
```

Test the POST operation with the data-service JSON wrapper:

```powershell
kubectl --% run assignment-mi-post-check -n minikube-demo --rm -i --restart=Never --image=curlimages/curl:8.10.1 -- -sS -X POST -H "Accept: application/json" -H "Content-Type: application/json" -d "{\"_postapplications\":{\"citizen_id\":\"11990000000\",\"service_name\":\"Residency Permit\",\"status\":\"SUBMITTED\",\"submitted_date\":\"2026-06-11\",\"department_id\":2}}" http://assignment-mi:8290/services/PublicServicesDataService/applications
```

Expected result:

```text
The command returns no fault, and a new row is inserted.
```

Optional cleanup for the test row:

```powershell
kubectl exec -n minikube-demo deployment/assignment-mysql -- mysql -uroot -proot_pass_ChangeMe -e "DELETE FROM gov_services.service_application WHERE citizen_id='11990000000';"
```

---

# 5. Create the API in APIM

Start the APIM port-forward:

```powershell
kubectl port-forward -n wso2 svc/assignment-apim 443:9443 8243:8243
```

Keep this terminal open.

Add hosts entries if they are not already present:

```text
127.0.0.1 am.wso2.com
127.0.0.1 gw.wso2.com
```

Open:

```text
https://am.wso2.com/publisher/
```

Login:

```text
admin / admin
```

Create a REST API:

| Setting | Value |
|---|---|
| Name | `PublicServicesAPI` |
| Context | `/gov/services` |
| Version | `v1` |
| OpenAPI file | `labs/Assignment/artifacts/apim/public-services-openapi.yaml` |
| Production endpoint | `http://assignment-mi.minikube-demo.svc.cluster.local:8290/services/PublicServicesDataService` |
| Security | OAuth2 |
| CORS allowed origin | `http://localhost:3000` |
| Throttling | `10PerMin` or the closest available lab tier |

Deploy and publish the API.

For `POST /applications`, send the data-service wrapper body:

```json
{
  "_postapplications": {
    "citizen_id": "11990000000",
    "service_name": "Residency Permit",
    "status": "SUBMITTED",
    "submitted_date": "2026-06-11",
    "department_id": 2
  }
}
```

Expected result:

```text
PublicServicesAPI is visible in the Developer Portal.
```

---

# 6. Create the SPA Application in IS

Stop the APIM management port-forward with `Ctrl+C`.

Start the IS port-forward:

```powershell
kubectl port-forward -n wso2-iam svc/assignment-is 443:9443
```

Open:

```text
https://localhost/console
```

Login:

```text
admin / admin
```

Create a Standard-Based Application for the local portal.

Use:

| Setting | Value |
|---|---|
| Application type | Single-page application |
| Authorized redirect URL | `http://localhost:3000` |
| Allowed origin | `http://localhost:3000` |
| Logout return URL | `http://localhost:3000` |
| Grant type | Authorization Code with PKCE |

Copy the client ID.

Expected result:

```text
The SPA application is created and a client ID is available.
```

---

# 7. Configure APIM to Trust IS Tokens

Stop the IS port-forward with `Ctrl+C`.

Start APIM management access again:

```powershell
kubectl port-forward -n wso2 svc/assignment-apim 443:9443 8243:8243
```

Open APIM Admin Portal:

```text
https://am.wso2.com/admin/
```

Create a Key Manager entry for WSO2 Identity Server.

Use the in-cluster IS service URL so APIM can reach IS without using your
laptop port-forward:

| Setting | Value |
|---|---|
| Display name | `AssignmentIS` |
| Issuer | `https://localhost/oauth2/token` |
| Token endpoint | `https://assignment-is.wso2-iam.svc.cluster.local:9443/oauth2/token` |
| Introspection endpoint | `https://assignment-is.wso2-iam.svc.cluster.local:9443/oauth2/introspect` |
| JWKS endpoint | `https://assignment-is.wso2-iam.svc.cluster.local:9443/oauth2/jwks` |
| Revoke endpoint | `https://assignment-is.wso2-iam.svc.cluster.local:9443/oauth2/revoke` |

Then associate `PublicServicesAPI` with this key manager in Publisher.

Expected result:

```text
APIM accepts access tokens issued by the AssignmentIS key manager.
```

---

# 8. Run the Local Web App

Stop the APIM management port-forward with `Ctrl+C` before starting the final
two-terminal app test.

Edit:

```text
labs/Assignment/client-web/config.js
```

Set `clientId` to the IS SPA client ID:

```javascript
window.assignmentConfig = {
  clientId: "PASTE_IS_SPA_CLIENT_ID_HERE",
  issuerBaseUrl: "https://localhost",
  redirectUri: "http://localhost:3000",
  scope: "openid profile email",
  apiInvokeUrl: "https://gw.wso2.com:8243/gov/services/v1/applications"
};
```

Start two port-forwards:

Terminal 1 for IS login:

```powershell
kubectl port-forward -n wso2-iam svc/assignment-is 443:9443
```

Terminal 2 for APIM gateway only:

```powershell
kubectl port-forward -n wso2 svc/assignment-apim 8243:8243
```

Open this URL once and accept the local certificate warning if the browser asks:

```text
https://gw.wso2.com:8243
```

Start the local app:

```powershell
cd .\labs\Assignment\client-web
npm start
```

Open:

```text
http://localhost:3000
```

Expected result:

```text
The Public Services Portal opens, signs in through IS, and can call PublicServicesAPI through APIM.
```

Use **Call without token** to prove the gateway rejects unauthenticated access.

Expected negative result:

```text
HTTP 401 or HTTP 403
```

---

# 9. Cleanup

Warning: this removes the assignment deployment and the MySQL PVC data.

```powershell
helm uninstall public-services -n minikube-demo
kubectl delete namespace minikube-demo
kubectl delete namespace wso2
kubectl delete namespace wso2-iam
```

Expected output includes:

```text
release "public-services" uninstalled
namespace "minikube-demo" deleted
namespace "wso2" deleted
namespace "wso2-iam" deleted
```

---

# Troubleshooting

| Error | Meaning | Fix | Validation |
|---|---|---|---|
| MI init container cannot download MySQL connector | The laptop or minikube node cannot reach Maven Central | Download the connector manually and update `mi.mysqlConnector.url` to an internal URL, or preload it with a custom MI image | MI pod moves to `Running` |
| APIM or IS stays `Pending` | minikube does not have enough CPU or memory | Restart minikube with 4 CPUs and 8 GiB memory | WSO2 pods become `Running` |
| Browser cannot open APIM | Hosts entry or APIM port-forward is missing | Add `am.wso2.com` and `gw.wso2.com` hosts entries, then rerun the APIM port-forward | `https://am.wso2.com/publisher/` opens |
| APIM login page shows `Error 500 : The page cannot be displayed` | APIM's Publisher login page is making an internal HTTPS self-call and the local self-signed certificate does not match `am.wso2.com` | Rerun the Helm upgrade so APIM starts with the lab JVM hostname-verification setting | Publisher login page opens instead of the 500 page |
| APIM login redirects to `https://localhost:9443/oauth2/authorize` | APIM started with old cached configuration or an old assignment release | Rerun `helm upgrade --install public-services .\labs\Assignment --namespace minikube-demo --create-namespace`, wait for `assignment-apim` to restart, then port-forward `svc/assignment-apim` | Publisher login stays under `https://am.wso2.com/...` |
| IS login shows callback mismatch | The SPA redirect URL does not exactly match | Set Authorized redirect URL, Allowed origin, and Logout return URL to `http://localhost:3000` | Login returns to the local app |
| API call returns `401` or `403` with a token | APIM is not associated with the IS key manager or token is expired | Recheck the APIM Key Manager and API security settings, then sign in again | Secured call returns application data |
| API call without token returns data | The APIM resource security is set to None | Mark resources as OAuth2 secured and redeploy the API | Unauthenticated call returns `401` or `403` |
