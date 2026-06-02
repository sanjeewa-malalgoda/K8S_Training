# Progress Tracker

Use this file as the living record of what has been completed, what failed, and what still needs improvement.

---

## Current baseline

| Item | Status |
|---|---|
| Docker Desktop installed on Windows | Done |
| Docker Desktop version recorded | Done - 4.71.0 (225177) |
| minikube installed on Windows | Done |
| minikube version recorded | Done - v1.38.1 |
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

Expected output (all pods should show `Running` status):

```text
NAMESPACE     NAME                               READY   STATUS    RESTARTS      AGE
kube-system   coredns-7d764666f9-6z4rq           1/1     Running   0             100m
kube-system   etcd-minikube                      1/1     Running   0             100m
kube-system   kube-apiserver-minikube            1/1     Running   0             100m
kube-system   kube-controller-manager-minikube   1/1     Running   0             100m
kube-system   kube-proxy-699hl                   1/1     Running   0             100m
kube-system   kube-scheduler-minikube            1/1     Running   0             100m
kube-system   storage-provisioner                1/1     Running   1 (99m ago)   100m
```

**Validation criteria:**
- All 7 pods must show `STATUS: Running`
- `READY` column must show `1/1` for each pod
- No pods should show `Pending`, `Failed`, `CrashLoopBackOff`, or `Unknown` status

---

## Documentation Improvements

| Date | Change | Files | Status |
|---|---|---|---|
| 2026-05-31 | Restructure README.md | README.md | Done |
| 2026-05-31 | Replace vague expected outputs with exact command output | docs/00-overview.md, docs/01-prerequisites.md, docs/04-start-minikube.md, docs/06-addons.md, QUICKSTART.md, labs/01-hello-deployment/README.md, labs/04-configmap-secret/README.md, labs/05-persistent-volume/README.md | Done |
| 2026-05-31 | Add concept explanations to all guides and labs | docs/05-kubectl-basics.md, docs/06-addons.md, docs/07-ingress.md, docs/08-helm.md, labs/01-hello-deployment/README.md, labs/02-service-nodeport/README.md, labs/03-ingress/README.md, labs/04-configmap-secret/README.md, labs/05-persistent-volume/README.md, labs/06-helm-basic/README.md | Done |
| 2026-06-02 | Align Lab 07 README with working README-News flow | README.md, labs/07-wso2-apim/README.md | Done |
| 2026-06-02 | Add Lab 08 government backend services and Lab 09 APIM API creation guide | README.md, labs/08-government-services, labs/09-apim-api-creation | Drafted |

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

- [ ] Add validation checkpoints to each learning path section
- [ ] Verify all links in README.md lead to correct doc sections
- [ ] Add expected outcomes for each learning path step
- [ ] Enhance lab READMEs with step-by-step instructions (similar to learning path format)
- [ ] Add screenshots for Windows Docker Desktop settings
- [ ] Add screenshots for macOS Docker Desktop settings
- [ ] Add a diagram explaining minikube architecture
- [ ] Add a Helm chart example
- [ ] Add a WSO2 API Manager lab later
- [ ] Add a troubleshooting decision tree
- [ ] Add CI check for YAML syntax
- Add GitHub Actions workflow for Markdown linting
