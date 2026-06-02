# Troubleshooting Guide

This file collects common issues and fixes.

---

## 1. `minikube` is not recognized

### Error

```text
minikube : The term 'minikube' is not recognized
```

### Meaning

The terminal cannot find `minikube.exe` in PATH.

### Windows fix

Test direct path:

```powershell
C:\minikube\minikube.exe version
```

Temporary current-window fix:

```powershell
$env:Path += ";C:\minikube"
minikube version
```

Permanent User PATH fix:

```powershell
$oldPath = [Environment]::GetEnvironmentVariable('Path', [EnvironmentVariableTarget]::User)

if ($oldPath.Split(';') -inotcontains 'C:\minikube') {
    [Environment]::SetEnvironmentVariable(
        'Path',
        "$oldPath;C:\minikube",
        [EnvironmentVariableTarget]::User
    )
}
```

Close and reopen PowerShell.

---

## 2. Requested registry access is not allowed

### Error

```text
Requested registry access is not allowed.
```

### Meaning

You tried to modify Machine/System PATH without Administrator permission.

### Fix

Use Administrator PowerShell, or update User PATH instead.

---

## 3. Docker driver not healthy

### Error

```text
failed to connect to the docker API at npipe:////./pipe/dockerDesktopLinuxEngine
```

### Meaning

Docker Desktop is installed but the Docker engine is not running.

### Fix

1. Open Docker Desktop
2. Wait until it is fully running
3. Run:

```bash
docker version
```

4. Confirm both `Client` and `Server` are shown
5. Start minikube:

```bash
minikube start --driver=docker
```

---

## 4. `minikube start` hangs at "Pulling base image" on slow networks

### Symptoms

- `minikube start` output stops at `Pulling base image v0.0.50 ...` and never advances.
- Verbose mode (`-v=3`) shows a download progress bar that drops to single-digit bytes per second.
- The minikube container is never created (`docker ps -a --filter "name=minikube"` returns empty or "Exited").
- `docker images` shows `gcr.io/k8s-minikube/kicbase:v0.0.50` **is already present locally**.

### Why this happens

On Windows, minikube doesn't always trust the kicbase image sitting in your Docker daemon. It re-downloads its own copy into `%USERPROFILE%\.minikube\cache\kic\amd64\` and there's no automatic retry — a network blip mid-download leaves it stuck at 0–5 B/s forever instead of failing fast.

This is most painful on low-bandwidth or unstable connections because the kicbase image is ~520 MB.

### Fix — force minikube to use the kicbase image already in Docker

Cancel the stuck command (Ctrl+C), then clean the partial cache:

**Windows (PowerShell)**

```powershell
Remove-Item -Recurse -Force "$env:USERPROFILE\.minikube\cache\kic"
```

**macOS (Terminal)**

```bash
rm -rf ~/.minikube/cache/kic
```

Then restart minikube with the `--base-image` flag pointing at the image already in your Docker daemon:

**Windows (PowerShell)**

```powershell
minikube start --driver=docker --cpus=4 --memory=8192 --disk-size=40g --base-image="gcr.io/k8s-minikube/kicbase:v0.0.50"
```

**macOS (Terminal)**

```bash
minikube start --driver=docker --cpus=4 --memory=8192 --disk-size=40g --base-image="gcr.io/k8s-minikube/kicbase:v0.0.50"
```

`--base-image` skips the cache-download path and uses the local Docker image directly. Cluster creation finishes in 2–5 minutes (disk activity only, no network).

### Prerequisites for this fix to work

You need the kicbase image **already present in Docker**. Confirm before retrying:

**Windows (PowerShell)**

```powershell
docker images gcr.io/k8s-minikube/kicbase
```

**macOS (Terminal)**

```bash
docker images gcr.io/k8s-minikube/kicbase
```

You should see a line with size around 1.93 GB. If you don't, you genuinely need to download it once — see "First-time setup on low-bandwidth networks" below.

### First-time setup on low-bandwidth networks

If you don't have the kicbase image cached anywhere yet:

1. Get on a stable connection for ~15 minutes (phone hotspot, ethernet, café WiFi).
2. Run `minikube start --driver=docker --cpus=4 --memory=8192 --disk-size=40g` once.
3. After that, all images are cached locally. You can run on any bandwidth.
4. End each day with `minikube stop` (preserves everything) — not `minikube delete` (wipes everything and forces re-download).

### Verify the cluster came up

**Windows (PowerShell)**

```powershell
kubectl get nodes
```

**macOS (Terminal)**

```bash
kubectl get nodes
```

Should show a `Ready` node within a minute.

---

## 5. Hyper-V requires Administrator privileges

### Error

```text
Hyper-V requires Administrator privileges
```

### Meaning

Minikube tried to use Hyper-V, but the terminal is not elevated.

### Preferred fix

Use Docker driver:

```powershell
minikube start --driver=docker
```

### Alternative fix

Run PowerShell as Administrator and use:

```powershell
minikube start --driver=hyperv
```

---

## 6. kubectl not found

### Check

```bash
kubectl version --client
```

### Temporary fix

Use minikube bundled kubectl:

```bash
minikube kubectl -- get pods -A
```

---

## 7. Pods stuck in Pending

### Check

First, find which pods exist:

```bash
kubectl get pods -A
```

Then describe the specific pod causing the issue:

```bash
kubectl describe pod storage-provisioner -n kube-system
kubectl describe node minikube
```

### Common causes

- Not enough CPU
- Not enough memory
- Image pull problem
- PVC/storage issue

---

## 8. ImagePullBackOff

### Check

Find the failing pod:

```bash
kubectl get pods -A
```

Get details about why it failed:

```bash
kubectl describe pod <POD-NAME> -n <NAMESPACE>
```

Example with actual pod:

```bash
kubectl describe pod coredns-7d764666f9-6z4rq -n kube-system
```

### Common causes

- Wrong image name
- Wrong image tag
- No internet
- Private image requires credentials
- Registry rate limit
