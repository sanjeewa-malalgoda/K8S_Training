# 06 — Minikube Add-ons

## What are add-ons?

Minikube add-ons are pre-packaged extensions that install commonly-used Kubernetes components into your cluster. Think of them as "opt-in" features:

- **Ingress** — Routes HTTP traffic from outside the cluster into services
- **Metrics Server** — Collects CPU and memory metrics for pod autoscaling
- **Dashboard** — Web UI to manage cluster resources
- **DNS** — Service discovery by name (instead of IP addresses)

Without add-ons, you'd need to install these manually using YAML files. Add-ons automate that for local development.

---

## List add-ons

```bash
minikube addons list
```

---

## Enable Ingress

**What it does:** Installs an Ingress controller that routes HTTP traffic from your local machine into services running in the cluster.

**Why you need it:** NodePort services (from Lab 02) require port forwarding. Ingress lets you use DNS names and URL paths instead — much more realistic for application development.

**Example:** Instead of `localhost:30000`, you can use `hello.local` in your browser.

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
