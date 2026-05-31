# 06 — Minikube Add-ons

Minikube add-ons install common Kubernetes components for local use.

---

## List add-ons

```bash
minikube addons list
```

---

## Enable ingress

```bash
minikube addons enable ingress
```

Verify:

```bash
kubectl get pods -n ingress-nginx
```

Expected:

```text
ingress-nginx-controller-...   1/1   Running
```

---

## Enable metrics server

```bash
minikube addons enable metrics-server
```

Verify on macOS/Linux:

```bash
kubectl get pods -n kube-system | grep metrics
```

Verify on Windows PowerShell:

```powershell
kubectl get pods -n kube-system | Select-String metrics
```

Use after it starts:

```bash
kubectl top nodes
kubectl top pods -A
```

---

## Enable dashboard

```bash
minikube addons enable dashboard
minikube dashboard
```
