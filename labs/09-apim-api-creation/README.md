# Lab 09 - Create APIs in WSO2 API Manager

This lab uses the backend services from Lab 08 and creates matching APIs in WSO2 API Manager from Lab 07.

You will create:

| APIM API | Type | Backend service from Lab 08 |
|---|---|---|
| Government Permit Registry | REST | `gov-permits-rest` |
| Government Benefit Programs | GraphQL | `gov-benefits-graphql` |
| Government Public Alerts | WebSocket | `gov-alerts-websocket` |

Important:

```text
APIM must use Kubernetes internal service DNS names.
Do not use localhost, NodePort, or minikube service URLs as APIM backend endpoints.
Invoke published APIs through the Lab 07 gateway URL: https://gw.wso2.com:8243
```

---

# 1. Prerequisites

Complete these first:

```text
Lab 07 - WSO2 API Manager is deployed and reachable
Lab 08 - Government demo services are deployed and verified
```

Check APIM pod:

```bash
kubectl get pods -n wso2
```

Expected:

```text
apim-wso2am-all-in-one-am-deployment-1-xxxxx   1/1   Running
```

Check Lab 08 services:

```bash
kubectl get svc -n minikube-demo -l lab=government-services
```

Expected:

```text
gov-alerts-websocket    ClusterIP   ...   8080/TCP
gov-benefits-graphql    ClusterIP   ...   8080/TCP
gov-permits-rest        ClusterIP   ...   8080/TCP
```

Confirm Lab 07 port-forward is running:

```text
kubectl port-forward -n wso2 svc/apim-wso2am-all-in-one-am-service 443:9443 8243:8243
```

Confirm the hosts file has both names:

```text
127.0.0.1 am.wso2.com
127.0.0.1 gw.wso2.com
```

Open Publisher:

```text
https://am.wso2.com/publisher/
```

Gateway invoke base URL:

```text
https://gw.wso2.com:8243
```

Login:

```text
admin / admin
```

---

# 2. Verify APIM can reach the backend endpoints

Run these from the repository root.

REST backend:

```bash
kubectl run apim-rest-check -n wso2 --rm -i --restart=Never --image=curlimages/curl:8.10.1 -- curl -s http://gov-permits-rest.minikube-demo.svc.cluster.local:8080/health
```

Expected:

```json
{
  "service": "gov-permits-rest",
  "status": "UP"
}
```

GraphQL backend:

```bash
kubectl run apim-graphql-check -n wso2 --rm -i --restart=Never --image=curlimages/curl:8.10.1 -- curl -s http://gov-benefits-graphql.minikube-demo.svc.cluster.local:8080/health
```

Expected:

```json
{
  "service": "gov-benefits-graphql",
  "status": "UP"
}
```

WebSocket backend health:

```bash
kubectl run apim-websocket-check -n wso2 --rm -i --restart=Never --image=curlimages/curl:8.10.1 -- curl -s http://gov-alerts-websocket.minikube-demo.svc.cluster.local:8080/health
```

Expected:

```json
{
  "service": "gov-alerts-websocket",
  "status": "UP"
}
```

---

# 3. Create the REST API

Use this file:

```text
labs/09-apim-api-creation/rest-permits-openapi.yaml
```

In Publisher:

1. Click **Create API**.
2. Select **REST API**.
3. Select **Import OpenAPI Definition**.
4. Upload `rest-permits-openapi.yaml`.
5. Use these values:

| Field | Value |
|---|---|
| Name | `Government Permit Registry` |
| Context | `/gov/permits` |
| Version | `1.0.0` |
| Endpoint type | `HTTP/REST endpoint` |
| Production endpoint | `http://gov-permits-rest.minikube-demo.svc.cluster.local:8080` |

Save the API.

Check resources in Publisher:

```text
GET /permits
GET /permits/{id}
POST /permits
```

Then click:

```text
Deployments -> Deploy
Lifecycle -> Publish
```

Expected:

```text
Government Permit Registry is published.
```

---

# 4. Create the GraphQL API

Use this file:

```text
labs/09-apim-api-creation/benefits-schema.graphql
```

In Publisher:

1. Click **Create API**.
2. Select **GraphQL API**.
3. Upload `benefits-schema.graphql`.
4. Use these values:

| Field | Value |
|---|---|
| Name | `Government Benefit Programs` |
| Context | `/gov/benefits` |
| Version | `1.0.0` |
| Production endpoint | `http://gov-benefits-graphql.minikube-demo.svc.cluster.local:8080/graphql` |

Save the API.

Check operations in Publisher:

```text
health
benefitPrograms
benefitProgram
```

Then click:

```text
Deployments -> Deploy
Lifecycle -> Publish
```

Expected:

```text
Government Benefit Programs is published.
```

---

# 5. Create the WebSocket API

Use this file as a reference if Publisher asks for an AsyncAPI definition:

```text
labs/09-apim-api-creation/websocket-alerts-asyncapi.yaml
```

In Publisher:

1. Click **Create API**.
2. Select **WebSocket API**.
3. Use these values:

| Field | Value |
|---|---|
| Name | `Government Public Alerts` |
| Context | `/gov/alerts` |
| Version | `1.0.0` |
| WebSocket endpoint | `ws://gov-alerts-websocket.minikube-demo.svc.cluster.local:8080/ws` |

If Publisher supports AsyncAPI upload in your screen, upload `websocket-alerts-asyncapi.yaml`.

Then click:

```text
Deployments -> Deploy
Lifecycle -> Publish
```

Expected:

```text
Government Public Alerts is published.
```

---

# 6. Subscribe and generate an access token

Open Developer Portal:

```text
https://am.wso2.com/devportal/
```

Login:

```text
admin / admin
```

For each API:

1. Open the API.
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

# 7. Invoke the REST API through APIM

These commands assume:

```text
Context: /gov/permits
Version: 1.0.0
```

## Windows PowerShell

```powershell
$TOKEN = "paste-access-token-here"
curl.exe -k -H "Authorization: Bearer $TOKEN" https://gw.wso2.com:8243/gov/permits/1.0.0/permits
```

## macOS Terminal

```bash
TOKEN="paste-access-token-here"
curl -k -H "Authorization: Bearer $TOKEN" https://gw.wso2.com:8243/gov/permits/1.0.0/permits
```

Expected response:

```json
{
  "count": 2,
  "permits": [
    {
      "id": "PERMIT-1001",
      "citizenName": "Asha Dorji",
      "permitType": "Building",
      "status": "APPROVED",
      "district": "Thimphu"
    }
  ]
}
```

---

# 8. Invoke the GraphQL API through APIM

These commands assume:

```text
Context: /gov/benefits
Version: 1.0.0
```

## Windows PowerShell

```powershell
$TOKEN = "paste-access-token-here"
curl.exe -k -X POST https://gw.wso2.com:8243/gov/benefits/1.0.0 `
  -H "Authorization: Bearer $TOKEN" `
  -H "Content-Type: application/json" `
  -d '{"query":"{ benefitPrograms { id name agency status } }"}'
```

## macOS Terminal

```bash
TOKEN="paste-access-token-here"
curl -k -X POST https://gw.wso2.com:8243/gov/benefits/1.0.0 \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"query":"{ benefitPrograms { id name agency status } }"}'
```

Expected response:

```json
{
  "data": {
    "benefitPrograms": [
      {
        "id": "BEN-001",
        "name": "Senior Citizen Support",
        "agency": "Department of Social Protection",
        "status": "OPEN"
      }
    ]
  }
}
```

---

# 9. Test the WebSocket API through APIM

These values assume:

```text
Context: /gov/alerts
Version: 1.0.0
```

Use a WebSocket client and connect to:

```text
wss://gw.wso2.com:8243/gov/alerts/1.0.0/ws
```

Send:

```text
hello from APIM
```

Expected message:

```json
{
  "type": "government.alert.ack",
  "received": "hello from APIM",
  "latestAlert": {
    "id": "ALERT-001",
    "severity": "INFO"
  }
}
```

If your WebSocket API requires token authentication in the query string, use:

```text
wss://gw.wso2.com:8243/gov/alerts/1.0.0/ws?access_token=<paste-access-token-here>
```

---

# 10. Backend endpoint reference

Use this table when checking or editing the APIM endpoint configuration.

| API | APIM context | Backend endpoint |
|---|---|---|
| Government Permit Registry | `/gov/permits` | `http://gov-permits-rest.minikube-demo.svc.cluster.local:8080` |
| Government Benefit Programs | `/gov/benefits` | `http://gov-benefits-graphql.minikube-demo.svc.cluster.local:8080/graphql` |
| Government Public Alerts | `/gov/alerts` | `ws://gov-alerts-websocket.minikube-demo.svc.cluster.local:8080/ws` |

---

# Troubleshooting

| Error | Meaning | Fix | Validation |
|---|---|---|---|
| APIM endpoint test fails | APIM cannot resolve or reach the backend service | Use the full Kubernetes DNS name from this lab | Run the reachability commands in section 2 |
| API returns `404` | The API context, version, or resource path differs from the commands | Check the API context and resource paths in Publisher | Use the exact context/version shown in this lab |
| API returns `401` or `403` | Missing, expired, or wrong access token | Generate a new token from `DefaultApplication` | Retry curl with `Authorization: Bearer <token>` |
| Browser cannot open Publisher | Lab 07 management port-forward is not running | Restart `kubectl port-forward -n wso2 svc/apim-wso2am-all-in-one-am-service 443:9443 8243:8243` | Open `https://am.wso2.com/publisher/` |
| Invoke URL cannot connect | Lab 07 gateway port-forward or `gw.wso2.com` hosts entry is missing | Add `127.0.0.1 gw.wso2.com` and restart port-forward with `8243:8243` | Open `https://gw.wso2.com:8243` |
| WebSocket does not connect | Wrong endpoint scheme or token placement | Use `wss://` for APIM browser access and `ws://` only for the internal backend endpoint | Test the backend directly from Lab 08 |

---

# Cleanup

This lab creates APIs in APIM. It does not create Kubernetes resources.

To remove the APIs:

1. Open Publisher.
2. Open each API.
3. Change lifecycle state to **Retire** if required.
4. Delete the API.

To remove the backend services from Lab 08:

```bash
kubectl delete -f labs/08-government-services/
```

Expected:

```text
namespace "minikube-demo" deleted
configmap "government-api-server" deleted
deployment.apps "gov-permits-rest" deleted
service "gov-permits-rest" deleted
deployment.apps "gov-benefits-graphql" deleted
service "gov-benefits-graphql" deleted
deployment.apps "gov-alerts-websocket" deleted
service "gov-alerts-websocket" deleted
```
