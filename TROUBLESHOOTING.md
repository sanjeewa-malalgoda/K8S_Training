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

## 4. Hyper-V requires Administrator privileges

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

## 5. kubectl not found

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

## 6. Pods stuck in Pending

### Check

```bash
kubectl describe pod <pod-name>
kubectl describe node minikube
```

### Common causes

- Not enough CPU
- Not enough memory
- Image pull problem
- PVC/storage issue

---

## 7. ImagePullBackOff

### Check

```bash
kubectl describe pod <pod-name>
```

### Common causes

- Wrong image name
- Wrong image tag
- No internet
- Private image requires credentials
- Registry rate limit
