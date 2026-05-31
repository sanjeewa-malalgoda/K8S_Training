# Minikube Local Kubernetes Tutorial — Windows, macOS, VS Code

This project is a complete, hands-on local Kubernetes tutorial using **minikube**, **Docker Desktop**, **kubectl**, and **VS Code**.

It is designed so that a learner can open this folder in VS Code and follow the structured learning path step by step.

---

## Who this is for

This tutorial is suitable for:

- Beginners learning Kubernetes
- Engineers preparing for Kubernetes workshops
- Developers who need a local Kubernetes environment
- WSO2-on-Kubernetes workshop preparation
- Trainers who want repeatable Windows and macOS setup instructions

---

## How to use this guide

This is a **progressive learning path**. Start at step 1 and work through each topic in order. Each section builds on the previous one:

- **Setup & Prerequisites** — Verify your system and install required tools
- **Cluster Setup** — Install and start minikube, verify it works
- **Learn kubectl** — Understand basic Kubernetes commands and cluster inspection
- **Deploy Services** — Create and run your first application
- **Advanced Networking** — Use Ingress for external access
- **Storage & Config** — Use ConfigMaps, Secrets, and persistent volumes
- **Package Management** — Deploy applications using Helm
- **Cleanup** — Reset your environment

Follow the links in order. Validate each step before moving to the next. Use [TROUBLESHOOTING.md](TROUBLESHOOTING.md) if you hit errors.

---

## Learning Path

### 1. Setup & Prerequisites

| Step | Topic | Guide |
|------|-------|-------|
| 1.1 | System requirements and overview | [00-overview.md](docs/00-overview.md) |
| 1.2 | Check prerequisites before starting | [01-prerequisites.md](docs/01-prerequisites.md) |

### 2. Install Docker Desktop

| Step | Topic | Guide |
|------|-------|-------|
| 2.1 | Install Docker on Windows | [02-install-windows.md](docs/02-install-windows.md) |
| 2.2 | Install Docker on macOS | [03-install-macos.md](docs/03-install-macos.md) |
| 2.3 | Verify Docker is running | [01-prerequisites.md](docs/01-prerequisites.md#verify-docker-desktop) |

### 3. Install & Start minikube

| Step | Topic | Guide |
|------|-------|-------|
| 3.1 | Install minikube | [04-start-minikube.md](docs/04-start-minikube.md#install-minikube) |
| 3.2 | Start minikube cluster | [04-start-minikube.md](docs/04-start-minikube.md#start-the-cluster) |
| 3.3 | Verify cluster is running | [04-start-minikube.md](docs/04-start-minikube.md#verify-the-cluster) |
| 3.4 | Troubleshoot cluster issues | [TROUBLESHOOTING.md](TROUBLESHOOTING.md) |

### 4. Learn kubectl Basics

| Step | Topic | Guide |
|------|-------|-------|
| 4.1 | kubectl fundamentals | [05-kubectl-basics.md](docs/05-kubectl-basics.md) |
| 4.2 | Inspect your cluster | [05-kubectl-basics.md](docs/05-kubectl-basics.md) |

### 5. Deploy Your First Service

| Step | Topic | Guide |
|------|-------|-------|
| 5.1 | Create hello-world deployment | [01-hello-deployment](labs/01-hello-deployment/README.md) |
| 5.2 | Deploy and validate | [01-hello-deployment](labs/01-hello-deployment/README.md) |
| 5.3 | Access service via NodePort | [02-service-nodeport](labs/02-service-nodeport/README.md) |
| 5.4 | Scale deployments | [02-service-nodeport](labs/02-service-nodeport/README.md#scaling) |

### 6. Advanced Service Access (Ingress)

| Step | Topic | Guide |
|------|-------|-------|
| 6.1 | Install Ingress controller | [06-addons.md](docs/06-addons.md) |
| 6.2 | Configure Ingress routing | [07-ingress.md](docs/07-ingress.md) |
| 6.3 | Deploy and test Ingress | [03-ingress](labs/03-ingress/README.md) |

### 7. Configuration & Storage

| Step | Topic | Guide |
|------|-------|-------|
| 7.1 | ConfigMaps and Secrets | [04-configmap-secret](labs/04-configmap-secret/README.md) |
| 7.2 | Persistent storage (PVC) | [05-persistent-volume](labs/05-persistent-volume/README.md) |

### 8. Package Management with Helm

| Step | Topic | Guide |
|------|-------|-------|
| 8.1 | Helm basics | [08-helm.md](docs/08-helm.md) |
| 8.2 | Deploy with Helm | [06-helm-basic](labs/06-helm-basic/README.md) |

### 9. Cleanup

| Step | Topic | Guide |
|------|-------|-------|
| 9.1 | Remove deployments and reset cluster | [09-cleanup.md](docs/09-cleanup.md) |

---

## Tested Baseline

| Item | Current value |
|---|---|
| Windows OS tested | Windows 11 Pro 24H2 |
| Docker Desktop tested | 4.71.0 (225177) |
| minikube tested | v1.38.1 |
| Kubernetes version observed | v1.35.1 |
| Preferred minikube driver | Docker |
| Windows shell | PowerShell / Windows Terminal |
| macOS shell | Terminal / zsh |

---

## Quick Reference

Need a shortcut? See:

- **Quick start** — [QUICKSTART.md](QUICKSTART.md)
- **Troubleshooting** — [TROUBLESHOOTING.md](TROUBLESHOOTING.md)
- **kubectl cheatsheet** — [scripts/common/kubectl-cheatsheet.md](scripts/common/kubectl-cheatsheet.md)
- **Track progress** — [PROGRESS.md](PROGRESS.md)

---

## Project structure

```text
.
├── README.md                    ← You are here
├── PROGRESS.md                  ← Track what you've completed
├── QUICKSTART.md                ← Fast path if you know what you're doing
├── TROUBLESHOOTING.md           ← Error solutions
├── docs/
│   ├── 00-overview.md
│   ├── 01-prerequisites.md
│   ├── 02-install-windows.md
│   ├── 03-install-macos.md
│   ├── 04-start-minikube.md
│   ├── 05-kubectl-basics.md
│   ├── 06-addons.md
│   ├── 07-ingress.md
│   ├── 08-helm.md
│   └── 09-cleanup.md
├── labs/                        ← Hands-on exercises
│   ├── 01-hello-deployment/
│   ├── 02-service-nodeport/
│   ├── 03-ingress/
│   ├── 04-configmap-secret/
│   ├── 05-persistent-volume/
│   └── 06-helm-basic/
└── scripts/                     ← Automation and references
    ├── windows/
    ├── macos/
    └── common/
```

---

## Fast path

Open this project in VS Code and read:

```text
QUICKSTART.md
```

Then run the relevant script:

### Windows PowerShell

```powershell
.\scripts\windows\verify-prereqs.ps1
.\scripts\windows\start-minikube.ps1
.\scripts\windows\enable-addons.ps1
```

### macOS Terminal

```bash
chmod +x scripts/macos/*.sh
./scripts/macos/verify-prereqs.sh
./scripts/macos/start-minikube.sh
./scripts/macos/enable-addons.sh
```

---

## Recommended learning order

| Step | File |
|---:|---|
| 1 | `docs/00-overview.md` |
| 2 | `docs/01-prerequisites.md` |
| 3 | `docs/02-install-windows.md` or `docs/03-install-macos.md` |
| 4 | `docs/04-start-minikube.md` |
| 5 | `docs/05-kubectl-basics.md` |
| 6 | `labs/01-hello-deployment/README.md` |
| 7 | `labs/02-service-nodeport/README.md` |
| 8 | `docs/06-addons.md` |
| 9 | `labs/03-ingress/README.md` |
| 10 | `labs/04-configmap-secret/README.md` |
| 11 | `labs/05-persistent-volume/README.md` |
| 12 | `docs/08-helm.md` |
| 13 | `docs/09-cleanup.md` |

---

## Official references

- Minikube start guide: https://minikube.sigs.k8s.io/docs/start/
- Minikube Docker driver: https://minikube.sigs.k8s.io/docs/drivers/docker/
- Kubernetes kubectl docs: https://kubernetes.io/docs/reference/kubectl/
- Docker Desktop docs: https://docs.docker.com/desktop/
- Helm docs: https://helm.sh/docs/
- Codex CLI docs: https://developers.openai.com/codex/cli
- Codex IDE extension docs: https://developers.openai.com/codex/ide
