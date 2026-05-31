# Progress Tracker

Use this file as the living record of what has been completed, what failed, and what still needs improvement.

---

## Current baseline

| Item | Status |
|---|---|
| Docker Desktop installed on Windows | Done |
| Docker Desktop version recorded | Done — 4.71.0 (225177) |
| minikube installed on Windows | Done |
| minikube version recorded | Done — v1.38.1 |
| PATH issue identified | Done |
| Docker driver issue identified | Done |
| minikube cluster started | Done |
| `kubectl get nodes` verified | Done |
| `kubectl get pods -A` verified | Done |
| macOS instructions added | Drafted |
| VS Code project generated | Done |
| Codex guidance files generated | Done |

---

## Verified Windows output

### Node check

Command:

```powershell
kubectl get nodes
```

Actual output:

```text
NAME       STATUS   ROLES           AGE     VERSION
minikube   Ready    control-plane   6m40s   v1.35.1
```

### System pod check

Command:

```powershell
kubectl get pods -A
```

Actual output:

```text
NAMESPACE     NAME                               READY   STATUS    RESTARTS        AGE
kube-system   coredns-7d764666f9-6z4rq           1/1     Running   0               6m42s
kube-system   etcd-minikube                      1/1     Running   0               6m49s
kube-system   kube-apiserver-minikube            1/1     Running   0               6m47s
kube-system   kube-controller-manager-minikube   1/1     Running   0               6m49s
kube-system   kube-proxy-699hl                   1/1     Running   0               6m42s
kube-system   kube-scheduler-minikube            1/1     Running   0               6m47s
kube-system   storage-provisioner                1/1     Running   1 (6m21s ago)   6m46s
```

---

## Next tasks

| Priority | Task | Status | Notes |
|---:|---|---|---|
| 1 | Enable ingress add-on | Not started | `minikube addons enable ingress` |
| 2 | Verify ingress controller pod | Not started | `kubectl get pods -n ingress-nginx` |
| 3 | Run hello deployment lab | Not started | `labs/01-hello-deployment` |
| 4 | Run NodePort lab | Not started | `labs/02-service-nodeport` |
| 5 | Run ingress lab | Not started | `labs/03-ingress` |
| 6 | Test macOS instructions | Not started | Need real Mac output |
| 7 | Add screenshots | Not started | Optional |
| 8 | Add WSO2-specific local lab | Not started | Later extension |

---

## Issue log

| Date | Issue | Cause | Fix | Status |
|---|---|---|---|---|
| 2026-05-31 | `Requested registry access is not allowed` | Tried to set Machine PATH without Administrator PowerShell | Use Admin PowerShell or User PATH | Resolved |
| 2026-05-31 | `minikube` not recognized | PATH not loaded in current shell | Reopen terminal or add temporary PATH | Resolved |
| 2026-05-31 | Docker driver not healthy | Docker Desktop engine not running | Start Docker Desktop | Resolved |
| 2026-05-31 | Hyper-V requires Administrator | minikube considered Hyper-V without elevated shell | Use Docker driver | Avoided |

---

## Improvement backlog

- Add screenshots for Windows Docker Desktop settings
- Add screenshots for macOS Docker Desktop settings
- Add a diagram explaining minikube architecture
- Add a Helm chart example
- Add a WSO2 API Manager lab later
- Add a troubleshooting decision tree
- Add CI check for YAML syntax
- Add GitHub Actions workflow for Markdown linting
