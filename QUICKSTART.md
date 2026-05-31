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

Expected:

```text
minikube node is Ready
core Kubernetes pods are Running
```

---

## 4. Enable ingress

```bash
minikube addons enable ingress
kubectl get pods -n ingress-nginx
```

Expected:

```text
ingress-nginx-controller is Running
```

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
