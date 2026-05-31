# 02 — Install on Windows 11

This section explains how to install Docker Desktop, minikube, and kubectl on Windows.

---

## 1. Install Docker Desktop

1. Download Docker Desktop for Windows.
2. Run the installer.
3. Use WSL 2 backend if prompted.
4. Restart if requested.
5. Open Docker Desktop.
6. Wait until Docker is fully running.

Verify:

```powershell
docker version
```

Expected:

```text
Client:
Server:
```

If `Server` is missing, Docker Desktop is not ready.

---

## 2. Install minikube

### Option A — winget

```powershell
winget install Kubernetes.minikube
```

Close and reopen PowerShell.

Verify:

```powershell
minikube version
```

---

### Option B — manual install

```powershell
New-Item -Path 'C:\' -Name 'minikube' -ItemType Directory -Force

$ProgressPreference = 'SilentlyContinue'

Invoke-WebRequest `
  -OutFile 'C:\minikube\minikube.exe' `
  -Uri 'https://github.com/kubernetes/minikube/releases/latest/download/minikube-windows-amd64.exe' `
  -UseBasicParsing
```

Test directly:

```powershell
C:\minikube\minikube.exe version
```

---

## 3. Add minikube to PATH

### User PATH, no admin required

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

Verify:

```powershell
minikube version
```

---

## 4. Common Windows PATH error

Error:

```text
Requested registry access is not allowed.
```

Meaning:

You tried to update Machine PATH without Administrator PowerShell.

Fix:

Use User PATH or reopen PowerShell as Administrator.
