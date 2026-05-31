# 01 - Prerequisites

Before installing minikube, check the machine resources and required tools.

---

## Minimum resources

| Requirement | Minimum | Recommended |
|---|---:|---:|
| CPU | 2 CPUs | 4 CPUs or more |
| Free memory | 2 GB | 8 GB for minikube |
| Disk | 20 GB | 40 GB+ |
| Internet | Required | Stable connection |

---

## Required tools

| Tool | Required | Purpose |
|---|---|---|
| Docker Desktop | Yes | Runtime for minikube |
| minikube | Yes | Local Kubernetes cluster |
| kubectl | Recommended | Kubernetes CLI |
| VS Code | Recommended | Tutorial editing and labs |
| Helm | Later | Package manager for Kubernetes |

---

## Validate prerequisites

### Windows

```powershell
docker version
minikube version
kubectl version --client
```

### macOS

```bash
docker version
minikube version
kubectl version --client
```

Expected output (example):

```text
Client: Docker Engine v27.0.0
Server: Docker Engine v27.0.0
```

All three commands should print version information without errors.
