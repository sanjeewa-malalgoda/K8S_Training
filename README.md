# Minikube Local Kubernetes Tutorial — Windows, macOS, VS Code, and Codex

This project is a complete, hands-on local Kubernetes tutorial using **minikube**, **Docker Desktop**, **kubectl**, and **VS Code**.

It is designed so that a learner can open this folder in VS Code and follow the guide step by step.

---

## Tested baseline

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

## Who this is for

This tutorial is suitable for:

- Beginners learning Kubernetes
- Engineers preparing for Kubernetes workshops
- Developers who need a local Kubernetes environment
- WSO2-on-Kubernetes workshop preparation
- Trainers who want repeatable Windows and macOS setup instructions

---

## What you will build

You will set up and validate:

1. Docker Desktop
2. minikube
3. kubectl
4. A local Kubernetes cluster
5. A test deployment
6. NodePort service access
7. Ingress controller and ingress routing
8. ConfigMaps and Secrets
9. PersistentVolumeClaim storage
10. Basic Helm workflow

---

## Project structure

```text
.
├── README.md
├── PROGRESS.md
├── AGENTS.md
├── QUICKSTART.md
├── TROUBLESHOOTING.md
├── .vscode/
│   ├── extensions.json
│   ├── settings.json
│   └── tasks.json
├── .codex/
│   ├── README.md
│   ├── config.example.toml
│   ├── prompts/
│   └── tasks/
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
├── labs/
│   ├── 01-hello-deployment/
│   ├── 02-service-nodeport/
│   ├── 03-ingress/
│   ├── 04-configmap-secret/
│   ├── 05-persistent-volume/
│   └── 06-helm-basic/
└── scripts/
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
