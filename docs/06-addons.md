# 06 - Minikube Add-ons

## What are add-ons?

Minikube add-ons are pre-packaged extensions that install commonly-used Kubernetes components into your cluster. Think of them as "opt-in" features:

- **Ingress** - Routes HTTP traffic from outside the cluster into services
- **Metrics Server** - Collects CPU and memory metrics for pod autoscaling
- **Dashboard** - Web UI to manage cluster resources
- **DNS** - Service discovery by name (instead of IP addresses)

Without add-ons, you'd need to install these manually using YAML files. Add-ons automate that for local development.

## About Resource Usage

**Will enabling multiple add-ons slow down your cluster?**

Short answer: **No, not significantly for this training.**

- Your minikube cluster was started with **4 CPUs** and **8GB RAM** (if you followed the guide)
- Ingress controller uses ~100-200MB RAM
- Metrics server uses ~50-100MB RAM
- Dashboard uses ~100-150MB RAM
- Total additional overhead: ~300-500MB RAM (6-7% of your 8GB)

### Windows: Configure Docker Desktop memory for WSL 2

If you're running on Windows with Docker Desktop and WSL 2, Docker Desktop may not show a memory slider in the UI. Configure memory allocation directly:

1. **Edit `.wslconfig` file** (create if it doesn't exist):

   Open or create: `C:\Users\{YourUsername}\.wslconfig`

   Add or update:

   ```ini
   [wsl2]
   memory=10GB
   processors=4
   swap=4GB
   ```

2. **Restart WSL 2**:

   ```powershell
   wsl --shutdown
   ```

   This fully stops all WSL 2 distros. Docker Desktop will restart WSL 2 automatically.

3. **Start or restart minikube** (after WSL restarts):

   ```powershell
   minikube start --driver=docker --cpus=4 --memory=8192 --disk-size=40g
   ```

For the labs in this training, you should enable:
1. **Ingress** - Required for Lab 03 (Ingress routing)
2. **Metrics Server** - Optional but recommended for watching `kubectl top`

**Skip these for now:**
- Dashboard - Nice to have, not needed for labs
- Storage provisioner - Already included in minikube by default

If your machine has limited resources (< 8GB total RAM), consider disabling Dashboard.

---

## List add-ons

```bash
minikube addons list
```

---

## Enable Ingress

**What it does:** Installs an Ingress controller that routes HTTP traffic from your local machine into services running in the cluster.

**Why you need it:** NodePort services (from Lab 02) require port forwarding. Ingress lets you use DNS names and URL paths instead - much more realistic for application development.

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

### Troubleshooting: Ingress enablement timeout

If the `minikube addons enable ingress` command times out or the controller pod gets stuck, follow these steps:

**Do NOT immediately delete or reset your cluster.** The controller may still be initializing.

**Step 1: Check pod status**

```powershell
kubectl get pods -n ingress-nginx
kubectl get events -n ingress-nginx --sort-by=.lastTimestamp
```

**Step 2: If pod shows `ContainerCreating`**

Wait up to 10–15 minutes for the container image to pull and start:

```powershell
kubectl wait -n ingress-nginx --for=condition=Ready pod -l app.kubernetes.io/component=controller --timeout=600s
```

This will block until the pod is ready or the timeout expires.

**Step 3: Only reset if critical errors appear**

Only reset the addon or cluster if the pod shows one of these:
- `ImagePullBackOff` - Image cannot be pulled
- `CrashLoopBackOff` - Pod crashes repeatedly
- Repeated readiness probe failures in events

If you need to reset:

```powershell
minikube addons disable ingress
minikube addons enable ingress
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

---

## Disable add-ons

After completing your labs or if you need to free up resources, disable add-ons you no longer need:

```bash
minikube addons disable ingress
minikube addons disable metrics-server
minikube addons disable dashboard
```

To see which add-ons are currently enabled:

```bash
minikube addons list
```

Expected output shows `enabled` or `disabled` status for each add-on.

**When to disable:**
- You're done with a specific lab that required an add-on
- You need to free up RAM or CPU for other applications
- You're switching between different training scenarios
