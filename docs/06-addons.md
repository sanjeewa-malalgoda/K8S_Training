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

Expected output:

```text
NAMESPACE       NAME                        READY   STATUS      RESTARTS   AGE
ingress-nginx   ingress-nginx-controller    1/1     Running     0          1m
ingress-nginx   ingress-nginx-admission     0/1     Completed   0          1m
```

✓ Success if controller shows `Running` and `READY: 1/1`

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
