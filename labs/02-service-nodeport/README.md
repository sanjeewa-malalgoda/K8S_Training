# Lab 02 - Service and NodePort

## What is a Service?

A **Service** is a stable network endpoint that exposes a Deployment to clients.

### Problem it solves

Pods are **temporary** - they get created and destroyed constantly. Each pod has a different IP. How do clients access your application reliably?

**Answer:** Use a Service. It provides a stable IP and DNS name that never changes, even as pods are replaced.

### Types of Services

| Type | Access | Use case |
|------|--------|----------|
| **ClusterIP** | Only from within cluster | Internal services, databases |
| **NodePort** | External + node port number | Development, testing |
| **LoadBalancer** | External + DNS name | Production (cloud platforms) |
| **Ingress** | External + URL routing | Production with multiple services |

### This lab: NodePort

NodePort exposes your service on every node at a specific port (30000+).

**Flow:**
```
Your laptop:30000 → Minikube VM:30000 → Service → Pod:8080
```

You access via: `localhost:30000` or through minikube.

---

## Apply

```bash
kubectl apply -f labs/02-service-nodeport/
```

---

## Verify

```bash
kubectl get pods -n minikube-demo
kubectl get svc -n minikube-demo
```

---

## Open service

```bash
minikube service hello-nginx-nodeport -n minikube-demo
```

This should open the app in your browser.

---

## Cleanup

```bash
kubectl delete -f labs/02-service-nodeport/
```
