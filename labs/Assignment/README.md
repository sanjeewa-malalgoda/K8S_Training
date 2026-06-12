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
The chart configures IS with the same local Console access pattern used by Lab
16: forward local `443` to service `9443`, then open `https://localhost/console`.

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

Do not open `https://localhost:9443/console`. The built-in Console callback is
validated against the local `https://localhost/...` URL.

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

# 7. Use APIM Tokens for the API

Stop the IS port-forward with `Ctrl+C`.

Start APIM management access again:

```powershell
kubectl port-forward -n wso2 svc/assignment-apim 443:9443 8243:8243
```

Open APIM Admin Portal:

```text
https://am.wso2.com/admin/
```

For the main assignment flow, use APIM's built-in key manager. Do not add WSO2
Identity Server as an APIM Key Manager.

This keeps the API security path simple:

```text
APIM issues the token -> APIM validates the token -> APIM invokes the backend API
```

Open APIM Developer Portal:

```text
https://am.wso2.com/devportal/
```

Create an application:

```text
Applications -> Add New Application
Name: PublicServicesApp
Per Token Quota: Unlimited
Create
```

Subscribe the application to `PublicServicesAPI`.

Generate production keys for the application, then copy:

```text
Consumer Key
Consumer Secret
```

Get an APIM-issued access token from inside the APIM pod.

Use this command when IS is using local port `443` and APIM management is not
port-forwarded to local `443`:

```powershell
$consumerKey = "PASTE_CONSUMER_KEY"
$consumerSecret = "PASTE_CONSUMER_SECRET"

kubectl exec -n wso2 deployment/assignment-apim -- curl -k -sS -u "$consumerKey`:$consumerSecret" -d "grant_type=client_credentials" https://localhost:9443/oauth2/token
```

The response contains:

```json
{
  "access_token": "...",
  "token_type": "Bearer",
  "expires_in": 3600
}
```

Call the secured API with the APIM token:

```powershell
curl.exe -k -H "Authorization: Bearer PASTE_ACCESS_TOKEN" https://gw.wso2.com:8243/gov/services/v1/applications
```

Expected result:

```text
APIM accepts the APIM-issued token and returns application data.
```

---

# 8. Run the Local Web App

Stop the APIM management port-forward with `Ctrl+C` before starting the final
two-terminal app test.

Edit:

```text
labs/Assignment/client-web/config.js
```

Set the IS SPA client ID and APIM token values:

```javascript
window.assignmentConfig = {
  clientId: "PASTE_IS_SPA_CLIENT_ID_HERE",
  issuerBaseUrl: "https://localhost",
  redirectUri: "http://localhost:3000",
  scope: "openid profile email",
  forceLoginPrompt: true,
  apimTokenUrl: "https://gw.wso2.com:8243/token",
  apimConsumerKey: "PASTE_APIM_CONSUMER_KEY_HERE",
  apimConsumerSecret: "PASTE_APIM_CONSUMER_SECRET_HERE",
  apimAccessToken: "PASTE_APIM_ACCESS_TOKEN_HERE",
  apiInvokeUrl: "https://gw.wso2.com:8243/gov/services/v1/applications"
};
```

For this local lab, the simplest path is to paste the access token from Step 7
into `apimAccessToken`. The browser app can also hold APIM consumer key and
secret for training, but do not put a consumer secret in browser JavaScript in a
real application.

If `https://gw.wso2.com:8243/token` returns `404`, keep using the Step 7
`kubectl exec` token command. In this local assignment setup, the reliable token
endpoint is APIM management inside the APIM pod, while the browser uses the
gateway only for API invocation.

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
The Public Services operations console opens, signs in through IS, and can call PublicServicesAPI through APIM.
```

The app shows:

| Area | Purpose |
|---|---|
| Signed-In User | Shows the IS user, subject, and whether an APIM token is ready |
| Flow strip | Shows `IS Login -> APIM Token -> Gateway -> Backend` status |
| Current Operation | Shows visible feedback when a button is clicked |
| Metrics | Counts total, approved, in-review, and submitted applications |
| Applications table | Renders backend XML response as a readable table |
| Diagnostics | Collapsible raw session, login, APIM token, and API responses |

Use **Call without token** to prove the gateway rejects unauthenticated access.

Expected negative result:

```text
HTTP 401 or HTTP 403
```

---

# 9. Keep APIM JWKS Reachable Without Restarting Pods

Use this only if API invocation returns:

```text
HTTP 500
900900 Unclassified Authentication Failure
```

Meaning:

```text
APIM Gateway is trying to read https://am.wso2.com/oauth2/jwks from inside the APIM pod.
Inside that pod, am.wso2.com resolves to 127.0.0.1.
APIM listens internally on 9443, not 443.
```

Check whether the temporary forwarder is already running:

```powershell
kubectl exec -n wso2 deployment/assignment-apim -- sh -c "ps -ef | grep apim-443-forward | grep -v grep || true"
```

If no process is shown, start the temporary in-pod forwarder. This does not
restart APIM and does not delete data.

```powershell
$pod = kubectl get pod -n wso2 -l app.kubernetes.io/component=apim -o jsonpath='{.items[0].metadata.name}'

@'
import socket
import threading

LISTEN = ("127.0.0.1", 443)
TARGET = ("127.0.0.1", 9443)

def pump(src, dst):
    try:
        while True:
            data = src.recv(65536)
            if not data:
                break
            dst.sendall(data)
    except Exception:
        pass
    finally:
        for sock in (src, dst):
            try:
                sock.close()
            except Exception:
                pass

def handle(client):
    upstream = socket.create_connection(TARGET)
    threading.Thread(target=pump, args=(client, upstream), daemon=True).start()
    threading.Thread(target=pump, args=(upstream, client), daemon=True).start()

server = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
server.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
server.bind(LISTEN)
server.listen(100)
print("forwarding 127.0.0.1:443 -> 127.0.0.1:9443", flush=True)

while True:
    client, _addr = server.accept()
    threading.Thread(target=handle, args=(client,), daemon=True).start()
'@ | kubectl exec -i -n wso2 $pod -- tee /tmp/apim-443-forward.py

kubectl exec -n wso2 $pod -- sh -c "setsid python3 /tmp/apim-443-forward.py >/tmp/apim-443-forward.log 2>&1 < /dev/null &"
```

Validate from inside the APIM pod:

```powershell
kubectl exec -n wso2 deployment/assignment-apim -- curl -k -sS -o /dev/null -w "%{http_code}`n" https://am.wso2.com/oauth2/jwks
```

Expected output:

```text
200
```

This forwarder is temporary. If the APIM pod is recreated, repeat this section
or redeploy APIM later with a JWKS URL that is reachable from inside the pod.

---

# 10. Cleanup

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
| Optional APIM-to-IS Key Manager well-known import shows `The server encountered an internal error` | APIM imports the well-known URL from the APIM server and does not trust the local IS self-signed HTTPS certificate | Skip IS as APIM Key Manager for this assignment and use APIM-issued tokens; if testing optional IS key-manager wiring, use the internal HTTP service URLs | Main assignment API call works with an APIM-issued token |
| IS Console login shows `invalid_callback` or `callback.not.match` | The browser used `https://localhost:9443/console`, but the Console callback is registered for `https://localhost/...` on local port `443` | Stop the old port-forward, run `kubectl port-forward -n wso2-iam svc/assignment-is 443:9443`, and open `https://localhost/console` | Console login completes without `oauth2_error.do` |
| IS SPA login shows callback mismatch | The SPA redirect URL does not exactly match | Set Authorized redirect URL, Allowed origin, and Logout return URL to `http://localhost:3000` | Login returns to the local app |
| App login immediately logs in without showing the login form | The browser still has an active IS SSO cookie | The app sends `prompt=login` when `forceLoginPrompt: true`; use **Sign out** to clear the app session and trigger IS logout | Next sign-in shows the IS login screen |
| App shows `APIM token ready; IS sign-in still required` | An APIM access token is configured, but there is no IS browser session yet | Click **Sign in with IS** first; the API call still uses the APIM token after login | Flow strip shows `IS Login: Signed in` and `APIM Token: Ready` |
| Clicking **Call secured API** appears to do nothing | The app is waiting for login/token/gateway response, or the error is in diagnostics | Check **Current Operation** and open **Diagnostics -> Raw API Response** if needed | Button changes to `Calling...`, and Current Operation updates |
| `curl` to `https://gw.wso2.com:8243/token` returns `404` | This APIM lab exposes the token endpoint on APIM management, not the gateway `/token` path | Generate the token from inside the APIM pod with `kubectl exec -n wso2 deployment/assignment-apim -- curl -k -sS -u "CK:CS" -d "grant_type=client_credentials" https://localhost:9443/oauth2/token` | Token JSON includes `access_token` |
| API call returns `401` or `403` with a token | Token is missing, expired, copied incorrectly, or was issued for an unsubscribed APIM application | Generate a new production token from the subscribed DevPortal application and retry the curl command | Secured call returns application data |
| API call returns `HTTP 401` with `Invalid JWT token` | The app sent an expired or wrong APIM JWT | Generate a fresh APIM token and paste it into `apimAccessToken`, or clear the cached token with **Sign out** | Raw API Response no longer shows `Invalid JWT token` |
| API call returns `HTTP 500` with `900900 Unclassified Authentication Failure` | APIM Gateway cannot fetch the APIM JWKS URL for JWT validation, often because it tries `am.wso2.com:443` inside the APIM pod while APIM listens internally on `9443` | Use Section 9 to start the temporary APIM in-pod forwarder `127.0.0.1:443 -> 127.0.0.1:9443`, or redeploy APIM with a JWKS URL reachable from inside the pod | `kubectl exec -n wso2 deployment/assignment-apim -- curl -k -sS -o /dev/null -w "%{http_code}\n" https://am.wso2.com/oauth2/jwks` returns `200` |
| API call without token returns data | The APIM resource security is set to None | Mark resources as OAuth2 secured and redeploy the API | Unauthenticated call returns `401` or `403` |
