# Quickstart

Use this when you just want to get the local Kubernetes cluster running quickly.

---

## 1. Open Docker Desktop

Before starting minikube, Docker Desktop must be running.

Check Docker:

### Windows PowerShell

```powershell
docker version
```

### macOS Terminal

```bash
docker version
```

Expected:

```text
Client:
Server:
```

If `Server` does not appear, Docker Desktop is not ready.

---

## 2. Start minikube

### Windows PowerShell

```powershell
minikube start --driver=docker --cpus=4 --memory=8192
```

### macOS Terminal

```bash
minikube start --driver=docker --cpus=4 --memory=8192
```

For heavier labs:

```bash
minikube start --driver=docker --cpus=4 --memory=8192 --disk-size=40g
```

---

## 3. Verify the cluster

```bash
minikube status
kubectl get nodes
kubectl get pods -A
```

Expected output:

```text
NAME       STATUS   ROLES           AGE     VERSION
minikube   Ready    control-plane   7m15s   v1.35.1
```

Plus 7 core pods in `Running` state. ✓ Success if all pods show `READY: 1/1` and `STATUS: Running`

---

## 4. Enable ingress

```bash
minikube addons enable ingress
kubectl get pods -n ingress-nginx
```

Expected output:

```text
NAMESPACE       NAME                        READY   STATUS      RESTARTS   AGE
ingress-nginx   ingress-nginx-controller    1/1     Running     0          1m
ingress-nginx   ingress-nginx-admission     0/1     Completed   0          1m
```

✓ Controller must show `STATUS: Running` and `READY: 1/1`

---

## 5. Run first lab

```bash
kubectl apply -f labs/01-hello-deployment/
kubectl get pods
kubectl get deployments
```

Clean up:

```bash
kubectl delete -f labs/01-hello-deployment/
```
