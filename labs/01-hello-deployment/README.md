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

Expected output:

```text
NAMESPACE       NAME                            READY   STATUS    RESTARTS   AGE
minikube-demo   hello-nginx-5d9d98b8b9-abcde    1/1     Running   0          2m
```

✓ Success if pod shows `STATUS: Running` and `READY: 1/1`

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
