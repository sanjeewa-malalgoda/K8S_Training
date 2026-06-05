# Minikube Local Kubernetes Tutorial - Windows, macOS, VS Code

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

This is a **three-stage learning path**:

1. **📚 Documentation Stage** - Learn concepts, setup, and validate your cluster (Sections 1-8)
2. **💻 Labs Session** - Apply what you learned with hands-on exercises (Sections 9.1-9.6)
3. **🧹 Cleanup** - Remove deployments and reset your environment (Section 10)

**Important:** Complete all documentation sections and validate each step **before entering the labs session**. Use [TROUBLESHOOTING.md](TROUBLESHOOTING.md) if you hit errors.

---

## Stage 1: Documentation & Learning Path (Complete Before Labs)

### 1. Setup & Prerequisites ✓ (Validate before labs)

| Step | Topic | Guide |
|------|-------|-------|
| 1.1 | System requirements and overview | [00-overview.md](docs/00-overview.md) |
| 1.2 | Check prerequisites before starting | [01-prerequisites.md](docs/01-prerequisites.md) |

### 2. Install Docker Desktop ✓ (Validate before labs)

| Step | Topic | Guide |
|------|-------|-------|
| 2.1 | Install Docker on Windows | [02-install-windows.md](docs/02-install-windows.md) |
| 2.2 | Install Docker on macOS | [03-install-macos.md](docs/03-install-macos.md) |
| 2.3 | Verify Docker is running | [01-prerequisites.md](docs/01-prerequisites.md#verify-docker-desktop) |

### 3. Install & Start minikube ✓ (Validate before labs)

| Step | Topic | Guide |
|------|-------|-------|
| 3.1 | Install minikube | [04-start-minikube.md](docs/04-start-minikube.md#install-minikube) |
| 3.2 | Start minikube cluster | [04-start-minikube.md](docs/04-start-minikube.md#start-the-cluster) |
| 3.3 | Verify cluster is running | [04-start-minikube.md](docs/04-start-minikube.md#verify-the-cluster) |
| 3.4 | Troubleshoot cluster issues | [TROUBLESHOOTING.md](TROUBLESHOOTING.md) |

### 4. Learn kubectl Basics ✓ (Validate before labs)

| Step | Topic | Guide |
|------|-------|-------|
| 4.1 | kubectl fundamentals | [05-kubectl-basics.md](docs/05-kubectl-basics.md) |
| 4.2 | Inspect your cluster | [05-kubectl-basics.md](docs/05-kubectl-basics.md) |

### 5. Understand Services & Deployments ✓ (Validate before labs)

| Step | Topic | Guide |
|------|-------|-------|
| 5.1 | Learn Deployment concepts | [02-service-nodeport](labs/02-service-nodeport/README.md) (Concepts section) |
| 5.2 | Learn Service types | [02-service-nodeport](labs/02-service-nodeport/README.md) (Types of Services) |

### 6. Advanced Networking: Ingress ✓ (Validate before labs)

| Step | Topic | Guide |
|------|-------|-------|
| 6.1 | Install Ingress controller | [06-addons.md](docs/06-addons.md) |
| 6.2 | Understand Ingress routing | [07-ingress.md](docs/07-ingress.md) |

### 7. Configuration & Storage ✓ (Validate before labs)

| Step | Topic | Guide |
|------|-------|-------|
| 7.1 | ConfigMaps and Secrets concepts | [04-configmap-secret](labs/04-configmap-secret/README.md) (Concepts) |
| 7.2 | Persistent storage concepts | [05-persistent-volume](labs/05-persistent-volume/README.md) (Concepts) |

### 8. Package Management: Helm ✓ (Validate before labs)

| Step | Topic | Guide |
|------|-------|-------|
| 8.1 | Learn Helm basics | [08-helm.md](docs/08-helm.md) |

> **✓ CHECKPOINT:** If you can complete all sections 1-8 without errors, you are ready for labs!

---

## Stage 2: Labs Session (Apply What You Learned)

Now that you've learned the concepts and validated your setup, apply them with hands-on labs.

Each lab includes:
- ✅ **Apply** - Deploy resources
- ✅ **Verify** - Validate what you created
- ✅ **Cleanup** - Remove resources when done

**Run labs in order.** Complete and cleanup each lab before moving to the next.

### 9.1 Lab: Hello Deployment

Deploy your first Kubernetes application.

| Task | Command |
|------|---------|
| Apply | `kubectl apply -f labs/01-hello-deployment/` |
| Verify | `kubectl get deployments -n minikube-demo` |
| Details | [01-hello-deployment/README.md](labs/01-hello-deployment/README.md) |
| Cleanup | `kubectl delete -f labs/01-hello-deployment/` |

### 9.2 Lab: Service & NodePort

Expose your deployment with a Service.

| Task | Command |
|------|---------|
| Apply | `kubectl apply -f labs/02-service-nodeport/` |
| Verify | `kubectl get svc -n minikube-demo` |
| Access | `minikube service hello-nginx-nodeport -n minikube-demo` |
| Details | [02-service-nodeport/README.md](labs/02-service-nodeport/README.md) |
| Cleanup | `kubectl delete -f labs/02-service-nodeport/` |

### 9.3 Lab: Ingress Routing

Use Ingress for advanced HTTP routing.

| Task | Command |
|------|---------|
| Apply | `kubectl apply -f labs/03-ingress/` |
| Verify | `kubectl get ingress -n minikube-demo` |
| Access | `minikube service -n minikube-demo` |
| Details | [03-ingress/README.md](labs/03-ingress/README.md) |
| Cleanup | `kubectl delete -f labs/03-ingress/` |

### 9.4 Lab: ConfigMap & Secrets

Manage application configuration and secrets.

| Task | Command |
|------|---------|
| Apply | `kubectl apply -f labs/04-configmap-secret/` |
| Verify | `kubectl get configmap,secret -n minikube-demo` |
| Details | [04-configmap-secret/README.md](labs/04-configmap-secret/README.md) |
| Cleanup | `kubectl delete -f labs/04-configmap-secret/` |

### 9.5 Lab: Persistent Storage

Use PersistentVolumeClaims for data persistence.

| Task | Command |
|------|---------|
| Apply | `kubectl apply -f labs/05-persistent-volume/` |
| Verify | `kubectl get pvc -n minikube-demo` |
| Details | [05-persistent-volume/README.md](labs/05-persistent-volume/README.md) |
| Cleanup | `kubectl delete -f labs/05-persistent-volume/` |

### 9.6 Lab: Helm Deployment

Package and deploy applications with Helm.

| Task | Command |
|------|---------|
| Details | [06-helm-basic/README.md](labs/06-helm-basic/README.md) |
| Cleanup | See lab README for cleanup commands |

### 9.7 Lab: WSO2 API Manager 4.6.0

Deploy WSO2 API Manager All-in-One on Minikube using Helm. This lab uses the working local access path from Lab 07: hosts file plus `kubectl port-forward 443:9443 8243:8243`.

| Task | Command |
|------|---------|
| Prerequisites | Docker Desktop, minikube with Docker driver, kubectl, Helm |
| Get chart | Download WSO2 Helm APIM release `all-in-one-4.6.0-2` |
| Apply | `helm upgrade --install apim . --namespace wso2 --create-namespace --dependency-update -f values-apim-minikube-working.yaml` |
| Patch | `kubectl patch svc -n wso2 apim-wso2am-all-in-one-am-service --type merge --patch-file ./svc-patch.json` |
| Access | Map `am.wso2.com` and `gw.wso2.com` to `127.0.0.1`, then run `kubectl port-forward -n wso2 svc/apim-wso2am-all-in-one-am-service 443:9443 8243:8243` |
| Verify | `kubectl get pods -n wso2` and open `https://am.wso2.com/publisher/` |
| Details | [07-wso2-apim/README.md](labs/07-wso2-apim/README.md) |
| Cleanup | `helm uninstall apim -n wso2 && kubectl delete namespace wso2` |

### 9.8 Lab: Government Backend Services

Deploy three lightweight internal backend services for API testing: REST, GraphQL, and WebSocket.

| Task | Command |
|------|---------|
| Apply | `kubectl apply -f labs/08-government-services/` |
| Verify | `kubectl get pods -n minikube-demo -l lab=government-services` |
| Access | Use Kubernetes internal service DNS names from the lab README |
| Details | [08-government-services/README.md](labs/08-government-services/README.md) |
| Cleanup | `kubectl delete -f labs/08-government-services/` |

### 9.9 Lab: Create APIs in WSO2 API Manager

Create REST, GraphQL, and WebSocket APIs in WSO2 API Manager using the services deployed in Lab 08.

| Task | Command |
|------|---------|
| Prerequisites | Complete Labs 07 and 08 |
| Verify backends | `kubectl get svc -n minikube-demo -l lab=government-services` |
| Create APIs | Use APIM Publisher at `https://am.wso2.com/publisher/` |
| Details | [09-apim-api-creation/README.md](labs/09-apim-api-creation/README.md) |
| Cleanup | Delete APIs from APIM Publisher; delete Lab 08 services if no longer needed |

### 9.10 Lab: MCP Tools with MCP Inspector

Convert the Lab 09 REST API into an MCP server in WSO2 API Manager and test the generated tools with MCP Inspector.

VS Code Copilot Agent Mode is optional after the Inspector test works.

| Task | Command |
|------|---------|
| Prerequisites | Complete Labs 07, 08, and 09 |
| Create MCP server | Use APIM Publisher at `https://am.wso2.com/publisher/` |
| Test MCP server | `npx @modelcontextprotocol/inspector` |
| Optional agent path | Use `labs/10-mcp-agent/vscode-mcp-template.json` |
| Details | [10-mcp-agent/README.md](labs/10-mcp-agent/README.md) |
| Cleanup | Delete MCP servers from APIM Publisher; remove `.vscode/mcp.json` if created |

### 9.11 Lab: AI Gateway Chat App

Create an AI API in WSO2 API Manager, proxy an LLM provider through AI Gateway, and use a modern browser chat app to call it.

| Task | Command |
|------|---------|
| Prerequisites | Complete Lab 07 |
| Create AI API | Use APIM Publisher at `https://am.wso2.com/publisher/` |
| Test AI API | `curl -k -X POST https://gw.wso2.com:8243/anthropicapis/1/v1/messages` |
| Run chat app | `python -m http.server 5500` from `labs/11-ai-gateway-chat/app` |
| Details | [11-ai-gateway-chat/README.md](labs/11-ai-gateway-chat/README.md) |
| Cleanup | Delete the AI API from APIM Publisher; stop the local web server |

### 9.12 Lab: WSO2 MI Basic Helm Deployment

Deploy one WSO2 Micro Integrator pod with the official Helm chart, mount a demo
Synapse API XML through a Kubernetes ConfigMap, and verify `/citizen` API calls.

| Task | Command |
|------|---------|
| Prerequisites | Docker Desktop, minikube, kubectl, Helm |
| Goal | Prove the simplest working MI deployment path |
| Artifact mode | Direct Synapse API XML mounted from ConfigMap |
| Get chart | Download the official WSO2 `helm-mi` `4.6.x` chart |
| Deploy | `helm upgrade --install citizen-info-mi $CHART --namespace minikube-demo --create-namespace -f "$CHART/values_local.yaml" -f "$VALUES"` |
| Patch | `kubectl patch deployment cloud-citizen-info-mi -n minikube-demo --type strategic --patch-file labs/12-wso2-mi-scaling/k8s/mi-citizen-api-configmap-mount-patch.yaml` |
| Details | [12-wso2-mi-scaling/README.md](labs/12-wso2-mi-scaling/README.md) |
| Cleanup | `helm uninstall citizen-info-mi -n minikube-demo` |

### 9.13 Lab: WSO2 MI CApp/CAR Deployment

Replace the direct Synapse XML mount with a WSO2 CApp/CAR exported from WSO2
tooling and loaded through the MI `carbonapps` hot-deployment directory.

| Task | Command |
|------|---------|
| Prerequisites | Complete Lab 12 and export a valid `.car` from WSO2 tooling |
| Goal | Practice the real CApp packaging and hot-deployment path |
| Artifact mode | `.car` copied into a shared `carbonapps` PVC |
| Shared volume | `kubectl apply -f labs/13-wso2-mi-capp-deployment/k8s/mi-carbonapps-shared-volume.yaml` |
| Patch | Run `labs/13-wso2-mi-capp-deployment/scripts/patch-mi-carbonapps-volume.ps1` or `.sh` |
| Details | [13-wso2-mi-capp-deployment/README.md](labs/13-wso2-mi-capp-deployment/README.md) |
| Cleanup | `helm uninstall citizen-info-mi -n minikube-demo` and delete the shared volume manifest |

### 9.14 Lab: WSO2 MI HPA Scaling

Enable metrics-server, turn on HPA for the MI Helm release, generate load, and
watch MI scale from one pod to multiple pods.

| Task | Command |
|------|---------|
| Prerequisites | Complete Lab 12 or Lab 13 and confirm `/citizen/health` returns `HTTP 200` |
| Goal | Observe MI scale-out under load |
| Metrics | `minikube addons enable metrics-server` |
| Load | `kubectl apply -f labs/14-wso2-mi-hpa-scaling/k8s/mi-load-generator.yaml` |
| Watch | `kubectl get hpa cloud-citizen-info-mi -n minikube-demo --watch` |
| Details | [14-wso2-mi-hpa-scaling/README.md](labs/14-wso2-mi-hpa-scaling/README.md) |
| Cleanup | `kubectl delete job mi-load-generator -n minikube-demo --ignore-not-found` |

---

## Stage 3: Cleanup (Reset Your Environment)

After you complete all labs, clean up resources:

### Remove individual lab deployments

Each lab has cleanup commands shown in the lab README. Run them as you finish each lab:

```bash
kubectl delete -f labs/01-hello-deployment/
kubectl delete -f labs/02-service-nodeport/
kubectl delete -f labs/03-ingress/
kubectl delete -f labs/04-configmap-secret/
kubectl delete -f labs/05-persistent-volume/
```

### Stop minikube (keeps cluster)

```bash
minikube stop
```

Your cluster is preserved and can be restarted with `minikube start`.

### Delete entire minikube cluster (⚠️ destructive)

```bash
minikube delete
```

**Warning:** This removes the cluster and all deployments permanently.

### Recreate clean cluster

```bash
minikube start --driver=docker --cpus=4 --memory=8192 --disk-size=40g
minikube addons enable ingress
kubectl get nodes
kubectl get pods -A
```

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

- **Quick start** - [QUICKSTART.md](QUICKSTART.md)
- **Troubleshooting** - [TROUBLESHOOTING.md](TROUBLESHOOTING.md)
- **kubectl cheatsheet** - [scripts/common/kubectl-cheatsheet.md](scripts/common/kubectl-cheatsheet.md)
- **Track progress** - [PROGRESS.md](PROGRESS.md)

---

## Project structure

```text
.
├── README.md                    ← You are here (Learning path + Labs + Cleanup)
├── PROGRESS.md                  ← Track what you've completed
├── QUICKSTART.md                ← Fast path if you know what you're doing
├── TROUBLESHOOTING.md           ← Error solutions
├── docs/                        ← Stage 1: Learn concepts & validate setup
│   ├── 00-overview.md
│   ├── 01-prerequisites.md
│   ├── 02-install-windows.md
│   ├── 03-install-macos.md
│   ├── 04-start-minikube.md
│   ├── 05-kubectl-basics.md
│   ├── 06-addons.md
│   ├── 07-ingress.md
│   └── 08-helm.md
├── labs/                        ← Stage 2: Apply learning with hands-on exercises
│   ├── 01-hello-deployment/
│   ├── 02-service-nodeport/
│   ├── 03-ingress/
│   ├── 04-configmap-secret/
│   ├── 05-persistent-volume/
│   ├── 06-helm-basic/
│   ├── 07-wso2-apim/
│   ├── 08-government-services/
│   ├── 09-apim-api-creation/
│   ├── 10-mcp-agent/
│   ├── 11-ai-gateway-chat/
│   ├── 12-wso2-mi-scaling/
│   ├── 13-wso2-mi-capp-deployment/
│   └── 14-wso2-mi-hpa-scaling/
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
| 13 | `labs/06-helm-basic/README.md` |
| 14 | `labs/07-wso2-apim/README.md` |
| 15 | `labs/08-government-services/README.md` |
| 16 | `labs/09-apim-api-creation/README.md` |
| 17 | `labs/10-mcp-agent/README.md` |
| 18 | `labs/11-ai-gateway-chat/README.md` |
| 19 | `labs/12-wso2-mi-scaling/README.md` |
| 20 | `labs/13-wso2-mi-capp-deployment/README.md` |
| 21 | `labs/14-wso2-mi-hpa-scaling/README.md` |
| 22 | `docs/09-cleanup.md` |

---

## Official references

- Minikube start guide: https://minikube.sigs.k8s.io/docs/start/
- Minikube Docker driver: https://minikube.sigs.k8s.io/docs/drivers/docker/
- Kubernetes kubectl docs: https://kubernetes.io/docs/reference/kubectl/
- Docker Desktop docs: https://docs.docker.com/desktop/
- Helm docs: https://helm.sh/docs/
- WSO2 MCP Gateway docs: https://apim-docs-stg.wso2.com/en/4.6.0/ai-gateway/mcp-gateway/overview/
- WSO2 AI Gateway docs: https://apim-docs-stg.wso2.com/en/4.6.0/ai-gateway/ai-gateway-overview/
- WSO2 MI Helm chart docs: https://mi.docs.wso2.com/en/latest/install-and-setup/setup/deployment/configuring-helm-charts/
- WSO2 MI Helm chart repository: https://github.com/wso2/helm-mi
- MCP Inspector docs: https://modelcontextprotocol.io/docs/tools/inspector
- VS Code MCP server docs: https://code.visualstudio.com/docs/agent-customization/mcp-servers
- Codex CLI docs: https://developers.openai.com/codex/cli
- Codex IDE extension docs: https://developers.openai.com/codex/ide
