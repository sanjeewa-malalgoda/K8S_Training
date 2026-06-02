# Lab 08 - Deploy Government Demo Services

This lab deploys three lightweight in-memory services into Minikube.

These services are backend targets for Lab 09, where you will create APIs in WSO2 API Manager.

The lab has two main steps:

```text
1. Deploy all three services
2. Verify all three services from inside Kubernetes
```

The services are internal Kubernetes `ClusterIP` services. They are not exposed with NodePort, Ingress, or `minikube tunnel`.

---

## What you will deploy

| Service | Style | Kubernetes service | APIM backend endpoint |
|---|---|---|---|
| Permit Registry | REST | `gov-permits-rest` | `http://gov-permits-rest.minikube-demo.svc.cluster.local:8080` |
| Benefit Programs | GraphQL | `gov-benefits-graphql` | `http://gov-benefits-graphql.minikube-demo.svc.cluster.local:8080/graphql` |
| Public Alerts | WebSocket | `gov-alerts-websocket` | `ws://gov-alerts-websocket.minikube-demo.svc.cluster.local:8080/ws` |

All services run in:

```text
namespace: minikube-demo
```

Why this matters:

```text
The WSO2 APIM pod runs inside Kubernetes.
It must call backend services using Kubernetes DNS names, not localhost.
```

---

# 1. Prerequisites

Complete:

```text
Lab 07 - WSO2 API Manager deployment
```

Check Minikube:

```bash
kubectl get nodes
```

Expected:

```text
minikube   Ready
```

---

# 2. Deploy all three services

From the repository root, run:

```bash
kubectl apply -f labs/08-government-services/
```

Expected output:

```text
namespace/minikube-demo created
configmap/government-api-server created
deployment.apps/gov-permits-rest created
service/gov-permits-rest created
deployment.apps/gov-benefits-graphql created
service/gov-benefits-graphql created
deployment.apps/gov-alerts-websocket created
service/gov-alerts-websocket created
```

If the namespace already exists, this is also okay:

```text
namespace/minikube-demo unchanged
```

Wait for pods:

```bash
kubectl get pods -n minikube-demo -l lab=government-services -w
```

Expected final state:

```text
NAME                                      READY   STATUS    RESTARTS   AGE
gov-alerts-websocket-xxxxx                1/1     Running   0          ...
gov-benefits-graphql-xxxxx                1/1     Running   0          ...
gov-permits-rest-xxxxx                    1/1     Running   0          ...
```

Stop watching:

```text
Ctrl + C
```

Check services:

```bash
kubectl get svc -n minikube-demo -l lab=government-services
```

Expected:

```text
NAME                    TYPE        CLUSTER-IP      EXTERNAL-IP   PORT(S)    AGE
gov-alerts-websocket    ClusterIP   ...             <none>        8080/TCP   ...
gov-benefits-graphql    ClusterIP   ...             <none>        8080/TCP   ...
gov-permits-rest        ClusterIP   ...             <none>        8080/TCP   ...
```

---

# 3. Verify REST service inside Kubernetes

Run a temporary curl pod:

```bash
kubectl run gov-rest-test -n minikube-demo --rm -i --restart=Never --image=curlimages/curl:8.10.1 -- curl -s http://gov-permits-rest:8080/permits
```

Expected output:

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

The output may include two permit records.

---

# 4. Verify GraphQL service inside Kubernetes

Use a URL-encoded GraphQL query.
This avoids shell-specific JSON quoting problems on Windows and macOS.

## Windows / macOS

```bash
kubectl run gov-graphql-test -n minikube-demo --rm -i --restart=Never --image=curlimages/curl:8.10.1 -- curl -s "http://gov-benefits-graphql:8080/graphql?query=%7B%20benefitPrograms%20%7B%20id%20name%20agency%20status%20%7D%20%7D"
```

If you see this error with a POST command:

```json
{
  "error": "Invalid JSON body"
}
```

it means the shell changed the JSON body before it reached the test pod.
Use the URL-encoded command above.

Expected output:

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

The output may include two benefit programs.

---

# 5. Verify WebSocket service inside Kubernetes

First verify the HTTP health endpoint:

```bash
kubectl run gov-ws-health-test -n minikube-demo --rm -i --restart=Never --image=curlimages/curl:8.10.1 -- curl -s http://gov-alerts-websocket:8080/health
```

Expected output:

```json
{
  "service": "gov-alerts-websocket",
  "status": "UP"
}
```

Then test a real WebSocket handshake and message with a temporary Node pod:

```bash
kubectl run gov-ws-test -n minikube-demo --rm -i --restart=Never --image=node:20-alpine -- node -e 'const net=require("net"),crypto=require("crypto"); const key=crypto.randomBytes(16).toString("base64"); const mask=Buffer.from([1,2,3,4]); function frame(text){const p=Buffer.from(text); for(let i=0;i<p.length;i++) p[i]^=mask[i%4]; return Buffer.concat([Buffer.from([129,128|p.length]),mask,p]);} function unframe(b){let len=b[1]&127,off=2; if(len===126){len=b.readUInt16BE(2); off=4;} return b.subarray(off,off+len).toString("utf8");} const s=net.connect(8080,"gov-alerts-websocket",()=>s.write("GET /ws HTTP/1.1\r\nHost: gov-alerts-websocket:8080\r\nUpgrade: websocket\r\nConnection: Upgrade\r\nSec-WebSocket-Key: "+key+"\r\nSec-WebSocket-Version: 13\r\n\r\n")); let ready=false; s.on("data",d=>{if(!ready){ready=true; s.write(frame("hello from kubernetes")); return;} console.log(unframe(d)); s.end();}); setTimeout(()=>s.destroy(),5000);'
```

Expected output:

```json
{"type":"government.alert.ack","received":"hello from kubernetes","latestAlert":{"id":"ALERT-001","severity":"INFO","district":"Thimphu","message":"Public service counters are open from 09:00 to 15:00."},"timestamp":"..."}
```

---

# 6. Verify APIM namespace can reach the services

Run these commands only if Lab 07 APIM is deployed.

REST:

```bash
kubectl run apim-rest-reachability -n wso2 --rm -i --restart=Never --image=curlimages/curl:8.10.1 -- curl -s http://gov-permits-rest.minikube-demo.svc.cluster.local:8080/health
```

Expected:

```json
{
  "service": "gov-permits-rest",
  "status": "UP"
}
```

GraphQL:

```bash
kubectl run apim-graphql-reachability -n wso2 --rm -i --restart=Never --image=curlimages/curl:8.10.1 -- curl -s http://gov-benefits-graphql.minikube-demo.svc.cluster.local:8080/health
```

Expected:

```json
{
  "service": "gov-benefits-graphql",
  "status": "UP"
}
```

WebSocket HTTP health:

```bash
kubectl run apim-ws-reachability -n wso2 --rm -i --restart=Never --image=curlimages/curl:8.10.1 -- curl -s http://gov-alerts-websocket.minikube-demo.svc.cluster.local:8080/health
```

Expected:

```json
{
  "service": "gov-alerts-websocket",
  "status": "UP"
}
```

---

# 7. Internal endpoint reference for Lab 09

Use these exact endpoint URLs when creating APIs in WSO2 API Manager:

| API type | Endpoint URL |
|---|---|
| REST | `http://gov-permits-rest.minikube-demo.svc.cluster.local:8080` |
| GraphQL | `http://gov-benefits-graphql.minikube-demo.svc.cluster.local:8080/graphql` |
| WebSocket | `ws://gov-alerts-websocket.minikube-demo.svc.cluster.local:8080/ws` |

Do not use:

```text
localhost
127.0.0.1
minikube service URLs
NodePort URLs
```

Those addresses point to your laptop, not to the backend services from inside the APIM pod.

---

# Troubleshooting

| Error | Meaning | Fix | Validation |
|---|---|---|---|
| `ImagePullBackOff` | Minikube cannot pull `node:20-alpine` or `curlimages/curl` | Check Docker Desktop internet access, then rerun the command | `kubectl get pods -n minikube-demo` |
| `service not found` | The service was not deployed or the namespace is wrong | Run `kubectl apply -f labs/08-government-services/` again | `kubectl get svc -n minikube-demo` |
| `Could not resolve host` | The test pod used a wrong service DNS name | Use the service names shown in this lab | `kubectl get svc -n minikube-demo` |
| APIM cannot connect | APIM endpoint uses `localhost` or a laptop URL | Use `*.minikube-demo.svc.cluster.local` endpoints | Run the reachability commands from namespace `wso2` |

---

# Cleanup

Warning: run this only when you no longer need these backend services for Lab 09.

```bash
kubectl delete -f labs/08-government-services/
```

Expected output:

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

Validate:

```bash
kubectl get pods -n minikube-demo -l lab=government-services
```

Expected:

```text
No resources found in minikube-demo namespace.
```
