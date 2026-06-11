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
| 2026-06-02 | Add APIM gateway host and port-forward flow for Lab 07 and Lab 09 invoke URLs | README.md, labs/07-wso2-apim, labs/09-apim-api-creation | Done |
| 2026-06-03 | Add WSO2 server log watch step to Lab 07 startup flow | labs/07-wso2-apim/README.md | Done |
| 2026-06-03 | Add OAuth JWKS URL to Lab 07 base APIM values configuration | labs/07-wso2-apim/README.md, labs/07-wso2-apim/values-local.yaml, labs/07-wso2-apim/values-minikube-windows.yaml | Done |
| 2026-06-03 | Fix and verify Lab 08 GraphQL test command using URL-encoded query | labs/08-government-services/README.md | Done |
| 2026-06-03 | Add Lab 10 for APIM API-to-MCP conversion, MCP Inspector, and VS Code Copilot Agent Mode | README.md, labs/10-mcp-agent | Drafted |
| 2026-06-03 | Add Lab 11 AI Gateway chat app with Groq-first provider guidance | README.md, labs/11-ai-gateway-chat | Superseded by Anthropic flow |
| 2026-06-04 | Add Lab 12 WSO2 MI Helm deployment, scaling, and APIM exposure guide | README.md, labs/12-wso2-mi-scaling | Drafted |
| 2026-06-04 | Rework Lab 12 into a problem-solving flow with artifact packaging and dynamic loading guidance | README.md, labs/12-wso2-mi-scaling/README.md | Drafted |
| 2026-06-04 | Initially drafted Lab 12 as combined MI Helm, CApp PVC, and HPA flow before splitting into Labs 12-14 | README.md, labs/12-wso2-mi-scaling | Superseded |
| 2026-06-04 | Add Lab 12 chart-folder checks for `values_local.yaml` Helm install error | README.md, labs/12-wso2-mi-scaling/README.md | Drafted |
| 2026-06-04 | Simplify Lab 12 to run from repository root with `CHART` and `VALUES` variables instead of switching folders | README.md, labs/12-wso2-mi-scaling/README.md | Drafted |
| 2026-06-04 | Update Lab 12 commands to use absolute `REPO`, `CHART`, and `VALUES` paths so they work from any current folder | README.md, labs/12-wso2-mi-scaling/README.md | Drafted |
| 2026-06-04 | Replace unsupported Lab 12 `kubectl set volume --add` with cross-platform patch scripts | labs/12-wso2-mi-scaling/README.md, labs/12-wso2-mi-scaling/scripts | Drafted |
| 2026-06-04 | Remove laptop-specific parent folder from Lab 12 `REPO` examples and use `Downloads/K8S_Training` default | labs/12-wso2-mi-scaling/README.md | Drafted |
| 2026-06-04 | Clarify that the working Lab 12 MI JSON responses come from direct Synapse XML and that pod names vary | labs/12-wso2-mi-scaling/README.md | Done |
| 2026-06-04 | Move the attempted demo `CitizenInfoCompositeExporter_1.0.0.car` into the Lab 13 CApp drop folder | labs/13-wso2-mi-capp-deployment/capps | Drafted |
| 2026-06-04 | Fix Lab 12 Windows paths to avoid hardcoded repo folders and `kubectl cp` drive-letter parsing errors | labs/12-wso2-mi-scaling/README.md | Drafted |
| 2026-06-04 | Add direct Synapse API ConfigMap mount fallback for Lab 12 after CApp dependency resolution failed in MI | labs/12-wso2-mi-scaling/README.md, labs/12-wso2-mi-scaling/k8s | Verified on Windows |
| 2026-06-04 | Split MI training into Lab 12 basic Helm/direct Synapse, Lab 13 CApp/CAR, and Lab 14 HPA scaling | README.md, labs/12-wso2-mi-scaling, labs/13-wso2-mi-capp-deployment, labs/14-wso2-mi-hpa-scaling | Drafted |
| 2026-06-04 | Move CAR, carbonapps PVC, CAR patch scripts, and load generator out of Lab 12 into Labs 13 and 14 | README.md, labs/12-wso2-mi-scaling, labs/13-wso2-mi-capp-deployment, labs/14-wso2-mi-hpa-scaling | Done |
| 2026-06-05 | Convert Lab 11 from OpenAI-compatible chat-completions flow to Anthropic Messages API flow tested with APIM Try Out shape | README.md, labs/11-ai-gateway-chat | Drafted |
| 2026-06-05 | Remove fragile Lab 11 browser app path; keep APIM Try Out and curl as the working Claude validation path | README.md, labs/11-ai-gateway-chat | Drafted |
| 2026-06-05 | Simplify MCP lab so the required path stops at MCP Inspector and VS Code Copilot Agent Mode is optional | README.md, labs/10-mcp-agent/README.md | Drafted |
| 2026-06-05 | Raise Lab 14 MI HPA CPU target from 10% to 50% so scale-down can return to one pod after load stops | labs/14-wso2-mi-hpa-scaling | Drafted |
| 2026-06-06 | Add Lab 14 stuck-HPA reset path for `FailedGetScale Unauthorized` controller events | labs/14-wso2-mi-hpa-scaling/README.md | Drafted |
| 2026-06-08 | Make MI image registry explicit and add a Lab 12 image-pull checkpoint for participant `ImagePullBackOff` failures | labs/12-wso2-mi-scaling/README.md, labs/12-wso2-mi-scaling/values-mi-minikube-working.yaml, labs/13-wso2-mi-capp-deployment/values-mi-minikube-working.yaml, labs/14-wso2-mi-hpa-scaling/values-mi-minikube-working.yaml | Drafted |
| 2026-06-08 | Add Lab 15 custom Java mediator flow for WSO2 MI with Maven install steps, Maven build, ConfigMap JAR deployment, API invocation, cleanup, and troubleshooting | README.md, labs/15-wso2-mi-custom-java-mediator | Drafted |
| 2026-06-08 | Add Apple Silicon macOS image-load fallback for Lab 12 MI `linux/amd64` image pulls | labs/12-wso2-mi-scaling/README.md | Drafted |
| 2026-06-09 | Add Lab 16 WSO2 IAM 7.0.0 using official Helm chart package download, lint, install, OIDC validation, UI access, cleanup, and troubleshooting | README.md, labs/16-wso2-iam-helm-basic | Drafted |
| 2026-06-10 | Switch Lab 16 IAM image from protected WSO2 registry path to public Docker Hub image and update Apple Silicon image-load commands | labs/16-wso2-iam-helm-basic | Drafted - not pull-tested locally |
| 2026-06-10 | Add explicit `minikube image load` after Lab 16 IAM `docker pull` so the image is available to the minikube node cache | labs/16-wso2-iam-helm-basic/README.md | Drafted - not pull-tested locally |
| 2026-06-10 | Change Lab 16 IAM browser port-forward to local `443:9443` so Console OAuth callbacks match `https://localhost` | labs/16-wso2-iam-helm-basic/README.md | Drafted |
| 2026-06-10 | Restructure Lab 17 as a local React OIDC sample app that connects to the Kubernetes-deployed IAM server; move app source under `app/`, remove generated `dist` output, remove copied favicon/changelog/license files, and ignore JS build artifacts | README.md, .gitignore, labs/17-sample-app | Drafted - not npm-tested locally |
| 2026-06-11 | Add Lab 18 to test a broken DB-dependent CApp against the working Lab 14 MI baseline, including source-only CApp artifacts, local packaging scripts, carbonapps PVC manifest, patch scripts, observation steps, cleanup, and troubleshooting | README.md, .gitignore, labs/18-wso2-mi-broken-capp-db | Drafted - not MI-tested locally |
| 2026-06-11 | Add Assignment capstone with one Helm chart for MySQL, MI, APIM, IS, APIM OpenAPI artifact, local host-run web app, setup guide, cleanup, and troubleshooting | README.md, labs/Assignment | Drafted - Helm rendered locally, not cluster-tested |
| 2026-06-12 | Verify Assignment chart on running minikube: MySQL, MI, APIM, and IS pods reached `1/1 Running`; MySQL seed count was 4; MI GET and POST operations were tested; APIM Publisher and IS OIDC discovery responded | labs/Assignment | Verified on Windows minikube |
| 2026-06-12 | Tried reusing Lab 07 APIM to avoid the Assignment APIM localhost redirect | README.md, labs/Assignment, PROGRESS.md | Superseded |
| 2026-06-12 | Added recovery note for `namespaces "wso2" not found` during the temporary Lab 07 dependency approach | README.md, labs/Assignment, PROGRESS.md | Superseded |
| 2026-06-12 | Restore Assignment as a self-contained Helm chart that deploys its own APIM with `am.wso2.com` and `gw.wso2.com` configuration | README.md, labs/Assignment, PROGRESS.md | Verified on Windows minikube |

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
| 8 | Add WSO2-specific local labs | Drafted | Labs 12-14 cover MI basic deployment, CApp deployment, and HPA scaling |

---

## Issue log

| Date | Issue | Cause | Fix | Status |
|---|---|---|---|---|
| 2026-05-31 | `Requested registry access is not allowed` | Tried to set Machine PATH without Administrator PowerShell | Use Admin PowerShell or User PATH | Resolved |
| 2026-05-31 | `minikube` not recognized | PATH not loaded in current shell | Reopen terminal or add temporary PATH | Resolved |
| 2026-05-31 | Docker driver not healthy | Docker Desktop engine not running | Start Docker Desktop | Resolved |
| 2026-05-31 | Hyper-V requires Administrator | minikube considered Hyper-V without elevated shell | Use Docker driver | Avoided |
| 2026-06-05 | Lab 11 browser app showed only `Request failed` | Local APIM self-signed TLS plus browser CORS made the frontend path unreliable | Removed the browser app path and kept APIM Try Out/curl validation | Superseded |
| 2026-06-08 | Lab 12 MI pod shows `ImagePullBackOff` on participant machines | Participant minikube cluster could not pull the MI image from Docker Hub, while trainer machine likely used a cached image | Set `containerRegistry` to `docker.io` and add `minikube image pull docker.io/wso2/wso2mi:4.6.0` before Helm install | Drafted |
| 2026-06-08 | Lab 12 MI image pull exits on Apple Silicon macOS but image is not usable in minikube | Docker/minikube platform handling needed the AMD64 MI image loaded explicitly | Run `docker pull --platform linux/amd64 wso2/wso2mi:4.6.0`, then `minikube image load wso2/wso2mi:4.6.0` | Drafted |
| 2026-06-10 | Lab 16 IAM image pull returned `401 Unauthorized` from `registry.wso2.com/wso2is/is:7.0.0` | Lab 16 used WSO2's protected registry path while APIM and MI labs used public Docker Hub images | Use `docker.io/wso2/wso2is:7.0.0` and update Apple Silicon fallback to pull/load that image | Drafted - not pull-tested locally |
| 2026-06-10 | Lab 16 IAM pod showed `Pulling image` after a successful `docker pull` | Docker Desktop and the minikube Kubernetes node can use separate image caches | Add `minikube image load docker.io/wso2/wso2is:7.0.0` after the local pull | Drafted - not pull-tested locally |
| 2026-06-10 | Lab 16 IAM Console login redirected to `https://localhost/authenticationendpoint/oauth2_error.do` with `invalid_callback` | The lab opened Console on `https://localhost:9443`, while the Console callback expected `https://localhost` on port `443` | Forward local `443` to service `9443` and open `https://localhost/console` | Drafted |
| 2026-06-10 | Lab 17 contained copied app project artifacts such as `dist`, favicon, changelog, and license files at the lab root | The sample app was copied into the lab as a standalone project instead of being shaped like the workshop labs | Keep only source under `labs/17-sample-app/app`, remove generated output, and add ignore rules for `node_modules` and `dist` | Drafted |
| 2026-06-11 | Lab 17 login showed `Your application's callback URL does not match with the registered redirect URLs` | Lab 16 still referenced `http://localhost:3000/callback`, but the Lab 17 React app sends `http://localhost:3000` as `signInRedirectURL` | Updated Lab 16 handoff text and Lab 17 troubleshooting to use the exact root redirect URL and remove stale `/callback` values | Drafted |
| 2026-06-11 | Student claim that a DB connection failure in a CAR file always stops the whole MI server needed validation | DB failures can happen at deployment time, request time, or startup code time, and the blast radius differs | Add Lab 18 to observe the behavior with a safe broken DB CApp and compare the failing `/citizen-db` flow against healthy `/citizen/health` | Drafted - not MI-tested locally |
| 2026-06-08 | Lab 15 custom mediator returned `HTTP 404` and then `ClassNotFoundException` | The Lab 15 API ConfigMap was not mounted after the Lab 13 CApp path, and the mediator JAR was mounted under `repository/components/lib` instead of MI runtime `lib` | Reapply the Lab 12 API mount patch, mount the JAR at `/home/wso2carbon/wso2mi-4.6.0/lib`, and restart MI | Verified locally |
| 2026-06-12 | Assignment APIM Publisher login redirected to `https://localhost:9443/oauth2/authorize` | The assignment chart deployed a plain `wso2/wso2am` container as `assignment-apim`, so APIM used default localhost UI and server settings | Configure assignment-owned APIM with `am.wso2.com` and `gw.wso2.com`, patch Publisher/Admin/DevPortal settings during startup, then use `svc/assignment-apim` | Verified |
| 2026-06-12 | Assignment APIM port-forward returned `namespaces "wso2" not found` | A temporary Lab 07 dependency approach required an external `wso2` namespace | Superseded by restoring assignment-owned APIM and always rendering the `wso2` namespace when APIM is enabled | Superseded |
| 2026-06-12 | Assignment was incorrectly documented as depending on Lab 07 APIM | A previous fix avoided the APIM hostname bug by reusing Lab 07 instead of fixing assignment APIM directly | Restore `assignment-apim`, mount an assignment APIM `deployment.toml` with `am.wso2.com` management and `gw.wso2.com` gateway URLs, and update docs to use `svc/assignment-apim` | Verified |
| 2026-06-12 | Assignment APIM Publisher settings still showed `origin.host` as `localhost` after fixing `deployment.toml` | The Publisher UI has its own runtime settings JSON in the webapp | Wrap the APIM startup command and patch Publisher/Admin/DevPortal settings JSON files to use `am.wso2.com` while APIM starts | Verified |
| 2026-06-12 | Assignment upgrade deleted `wso2` and `wso2-iam` namespaces | The namespace template used `lookup`, so Helm rendered namespaces on first install but omitted them on later upgrades and pruned them from the release | Always render the APIM and IS namespaces when those components are enabled | Verified |
| 2026-06-12 | Assignment APIM Publisher login page showed `Error 500` | Publisher login JSP made an internal HTTPS call to `am.wso2.com`, but the local WSO2 self-signed certificate did not have that DNS name as a SAN | Set APIM `JAVA_OPTS=-Djdk.internal.httpclient.disableHostnameVerification=true` for this local lab deployment | Verified |
| 2026-06-12 | Assignment APIM needed to match the proven Lab 07 APIM setup | Assignment had drifted from the working Lab 07 values by using an unpinned APIM image tag and `am.wso2.com` for JWKS | Pin Assignment APIM to the Lab 07 image digest and use the Lab 07 `https://localhost:9443/oauth2/jwks` setting while keeping the Assignment-owned `assignment-apim` service | Verified |

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
