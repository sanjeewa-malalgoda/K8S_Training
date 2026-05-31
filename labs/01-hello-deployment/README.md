# Lab 01 — Hello Deployment

Goal: create a simple Kubernetes Deployment.

---

## Apply

```bash
kubectl apply -f labs/01-hello-deployment/
```

---

## Verify

```bash
kubectl get namespace minikube-demo
kubectl get deployments -n minikube-demo
kubectl get pods -n minikube-demo
```

Expected:

```text
hello-nginx deployment is available
hello-nginx pod is Running
```

---

## Inspect

```bash
kubectl describe deployment hello-nginx -n minikube-demo
```

---

## Cleanup

```bash
kubectl delete -f labs/01-hello-deployment/
```
