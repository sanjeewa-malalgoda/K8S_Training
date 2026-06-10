# Lab 18 - Test a Broken DB CApp in WSO2 MI

This lab shows what happens when a CApp with a database dependency is deployed
to an already working WSO2 Micro Integrator runtime.

Complete Lab 14 first. Lab 14 gives you a known-good MI deployment and proves
that `/citizen/health` works before you introduce the broken CApp.

Recommended baseline: complete Lab 14 from the Lab 12 direct Synapse ConfigMap
path. If your Lab 14 environment is using the Lab 13 CApp/PVC path, this lab
reuses the same `carbonapps` mount location and can replace or remove that CApp
volume during cleanup.

---

# 1. What You Test

```text
Known-good MI from Lab 14
  -> add shared carbonapps PVC
  -> load a DB-dependent CApp
  -> observe whether MI still starts and whether only the broken flow fails
```

This lab uses:

| Need | Resource |
|---|---|
| Namespace | `minikube-demo` |
| Existing MI deployment | `cloud-citizen-info-mi` |
| Existing healthy API | `/citizen/health` |
| Broken CApp source | `labs/18-wso2-mi-broken-capp-db/source/broken-db-capp` |
| Generated CApp output | `labs/18-wso2-mi-broken-capp-db/capps/generated` |
| Shared CApp storage | `mi-carbonapps-pvc` |
| Broken API context | `/citizen-db` |

Generated `.car` files are local build output and should not be committed.

---

# 2. Important Learning Point

A broken DB CApp does not always stop the whole MI server.

| Where the DB connection fails | What you may observe |
|---|---|
| During artifact deployment | CApp fails to deploy, and the broken API may return `HTTP 404` |
| During request processing | MI starts, the healthy API still works, and only the DB-backed API returns an error |
| During custom artifact startup code | The MI pod may fail readiness or restart, depending on the artifact |

This lab uses a safe request-time DB failure. The CApp points to a database host
that does not exist:

```text
missing-citizen-db.minikube-demo.svc.cluster.local
```

The goal is to observe the actual runtime behavior instead of assuming every DB
problem stops the whole MI server.

---

# 3. Confirm the Lab 14 Baseline

Run from the repository root.

```powershell
kubectl get deployment cloud-citizen-info-mi -n minikube-demo
kubectl get pods -n minikube-demo -l deployment=cloud-citizen-info-mi
```

Expected output includes:

```text
NAME                    READY   UP-TO-DATE   AVAILABLE
cloud-citizen-info-mi   1/1     1            1

cloud-citizen-info-mi-...   1/1   Running
```

Confirm the known-good API still works:

```powershell
kubectl run mi-health-check -n minikube-demo --rm -i --restart=Never --image=curlimages/curl:8.10.1 -- -k -sS -w "`nHTTP %{http_code}`n" https://cloud-citizen-info-mi:8253/citizen/health
```

Expected response:

```json
{
  "service": "citizen-info-mi",
  "status": "UP",
  "pod": "cloud-citizen-info-mi-xxxxxxxxxx-xxxxx"
}
HTTP 200
```

Do not continue until this returns `HTTP 200`.

---

# 4. Pause the Lab 14 Load Test

This makes the failure easier to inspect.

```powershell
kubectl delete job mi-load-generator -n minikube-demo --ignore-not-found
kubectl delete hpa cloud-citizen-info-mi -n minikube-demo --ignore-not-found
kubectl scale deployment cloud-citizen-info-mi -n minikube-demo --replicas=1
kubectl rollout status deployment/cloud-citizen-info-mi -n minikube-demo --timeout=5m
```

Expected output includes:

```text
deployment.apps/cloud-citizen-info-mi scaled
deployment "cloud-citizen-info-mi" successfully rolled out
```

---

# 5. Package the Broken DB CApp

The repository stores CApp source only. This step creates a local `.car` file.

## Windows PowerShell

```powershell
.\labs\18-wso2-mi-broken-capp-db\scripts\package-broken-db-capp.ps1
```

Expected output includes:

```text
Created ...\labs\18-wso2-mi-broken-capp-db\capps\generated\BrokenDbCompositeExporter_1.0.0.car
```

## macOS Terminal

```bash
bash ./labs/18-wso2-mi-broken-capp-db/scripts/package-broken-db-capp.sh
```

Expected output includes:

```text
Created .../labs/18-wso2-mi-broken-capp-db/capps/generated/BrokenDbCompositeExporter_1.0.0.car
```

---

# 6. Create the Shared CApp Volume

## Windows PowerShell

```powershell
$REPO = (Get-Location).Path

kubectl apply -f "$REPO\labs\18-wso2-mi-broken-capp-db\k8s\mi-carbonapps-shared-volume.yaml"
kubectl wait --for=condition=Ready pod/mi-capp-loader -n minikube-demo --timeout=2m
```

## macOS Terminal

```bash
REPO="$(pwd)"

kubectl apply -f "$REPO/labs/18-wso2-mi-broken-capp-db/k8s/mi-carbonapps-shared-volume.yaml"
kubectl wait --for=condition=Ready pod/mi-capp-loader -n minikube-demo --timeout=2m
```

Expected output includes:

```text
persistentvolumeclaim/mi-carbonapps-pvc created
pod/mi-capp-loader created
pod/mi-capp-loader condition met
```

If the PVC and loader already exist from Lab 13, `unchanged` is OK.

---

# 7. Copy the Broken CApp

## Windows PowerShell

```powershell
$CAPP = ".\labs\18-wso2-mi-broken-capp-db\capps\generated\BrokenDbCompositeExporter_1.0.0.car"

kubectl cp $CAPP minikube-demo/mi-capp-loader:/carbonapps/BrokenDbCompositeExporter_1.0.0.car
kubectl exec -n minikube-demo mi-capp-loader -- ls -l /carbonapps
```

## macOS Terminal

```bash
CAPP="./labs/18-wso2-mi-broken-capp-db/capps/generated/BrokenDbCompositeExporter_1.0.0.car"

kubectl cp "$CAPP" minikube-demo/mi-capp-loader:/carbonapps/BrokenDbCompositeExporter_1.0.0.car
kubectl exec -n minikube-demo mi-capp-loader -- ls -l /carbonapps
```

Expected output includes:

```text
BrokenDbCompositeExporter_1.0.0.car
```

---

# 8. Mount the CApp Volume into MI

## Windows PowerShell

```powershell
$REPO = (Get-Location).Path

& "$REPO\labs\18-wso2-mi-broken-capp-db\scripts\patch-mi-carbonapps-volume.ps1"
```

## macOS Terminal

```bash
REPO="$(pwd)"

bash "$REPO/labs/18-wso2-mi-broken-capp-db/scripts/patch-mi-carbonapps-volume.sh"
```

Expected output includes:

```text
deployment.apps/cloud-citizen-info-mi patched
deployment "cloud-citizen-info-mi" successfully rolled out
BrokenDbCompositeExporter_1.0.0.car
```

---

# 9. Observe the CApp Deployment

Check pod status:

```powershell
kubectl get pods -n minikube-demo -l deployment=cloud-citizen-info-mi
```

Expected result for the safe broken CApp:

```text
The MI pod remains Running and Ready.
```

Check logs:

## Windows PowerShell

```powershell
kubectl logs -n minikube-demo deployment/cloud-citizen-info-mi --all-containers=true --tail=1000 |
  Select-String -Pattern "BrokenDb|citizen-db|CApp|Carbon Application|database|dblookup|ERROR|Exception"
```

## macOS Terminal

```bash
kubectl logs -n minikube-demo deployment/cloud-citizen-info-mi --all-containers=true --tail=1000 | grep -E "BrokenDb|citizen-db|CApp|Carbon Application|database|dblookup|ERROR|Exception"
```

Expected healthy runtime observation:

```text
Logs show the broken CApp or BrokenDatabaseAPI is visible to MI.
The MI pod does not restart only because the database host is missing.
```

---

# 10. Invoke the Broken DB API

```powershell
kubectl run mi-broken-db-check -n minikube-demo --rm -i --restart=Never --image=curlimages/curl:8.10.1 -- -k -sS -w "`nHTTP %{http_code}`n" https://cloud-citizen-info-mi:8253/citizen-db/profile/CIT-1001
```

Expected result:

```text
The request fails because the CApp cannot reach the configured database.
```

You may see one of these results:

| Result | Meaning |
|---|---|
| `HTTP 503` | The API deployed, the DB lookup failed at request time, and the fault sequence responded |
| `HTTP 500` | The API deployed, but the DB error was returned by MI before the fault response completed |
| `HTTP 404` | The CApp or API did not deploy successfully |
| Pod restarts or stays not ready | The artifact affected MI startup or readiness |

Now prove the known-good Lab 14 API still works:

```powershell
kubectl run mi-health-check-after-broken-capp -n minikube-demo --rm -i --restart=Never --image=curlimages/curl:8.10.1 -- -k -sS -w "`nHTTP %{http_code}`n" https://cloud-citizen-info-mi:8253/citizen/health
```

Expected response:

```text
HTTP 200
```

This is the key observation: if `/citizen/health` still returns `HTTP 200`, the
DB failure affected the broken flow but did not stop the whole MI runtime.

---

# 11. Cleanup

Warning: this removes the Lab 18 broken CApp helper resources.

If you were using the Lab 13 CApp/PVC path before this lab, do not run the
`kubectl delete -f` cleanup command until you are ready to remove that shared
`carbonapps` PVC. Re-run the Lab 13 patch steps afterward if you need to
restore the working CApp path.

## Windows PowerShell

```powershell
$REPO = (Get-Location).Path

kubectl delete -f "$REPO\labs\18-wso2-mi-broken-capp-db\k8s\mi-carbonapps-shared-volume.yaml"
kubectl rollout restart deployment/cloud-citizen-info-mi -n minikube-demo
kubectl rollout status deployment/cloud-citizen-info-mi -n minikube-demo --timeout=5m
```

## macOS Terminal

```bash
REPO="$(pwd)"

kubectl delete -f "$REPO/labs/18-wso2-mi-broken-capp-db/k8s/mi-carbonapps-shared-volume.yaml"
kubectl rollout restart deployment/cloud-citizen-info-mi -n minikube-demo
kubectl rollout status deployment/cloud-citizen-info-mi -n minikube-demo --timeout=5m
```

Expected output includes:

```text
persistentvolumeclaim "mi-carbonapps-pvc" deleted
pod "mi-capp-loader" deleted
deployment "cloud-citizen-info-mi" successfully rolled out
```

Optional local cleanup:

## Windows PowerShell

```powershell
Remove-Item -Recurse -Force .\labs\18-wso2-mi-broken-capp-db\capps\generated
```

## macOS Terminal

```bash
rm -rf ./labs/18-wso2-mi-broken-capp-db/capps/generated
```

Warning: only remove the generated folder shown above.

---

# Project Shape

```text
labs/18-wso2-mi-broken-capp-db/
  README.md
  capps/
    README.md
  k8s/
    mi-carbonapps-shared-volume.yaml
  scripts/
    package-broken-db-capp.ps1
    package-broken-db-capp.sh
    patch-mi-carbonapps-volume.ps1
    patch-mi-carbonapps-volume.sh
  source/
    broken-db-capp/
      artifacts.xml
      BrokenDatabaseAPI_1.0.0/
```

---

# Troubleshooting

| Error | Meaning | Fix | Validation |
|---|---|---|---|
| `/citizen/health` fails before the broken CApp is loaded | Lab 14 baseline is not healthy | Go back to Lab 14 and restore the working MI deployment | `/citizen/health` returns `HTTP 200` |
| `kubectl cp` says `one of src or dest must be a local file specification` | Windows absolute paths such as `C:\...` contain `:`, and `kubectl cp` can mistake them for `pod:path` syntax | Run from the repo root and use the relative `$CAPP` path shown in section 7 | `kubectl exec -n minikube-demo mi-capp-loader -- ls -l /carbonapps` shows the `.car` |
| `BrokenDbCompositeExporter_1.0.0.car` not found | The local package step was not run | Run section 5 | The generated `.car` exists under `capps/generated` |
| Broken API returns `HTTP 404` | The CApp or API did not deploy | Check MI logs for CApp deployment errors | Logs explain whether artifact metadata or deployment failed |
| Broken API returns `HTTP 503` or `HTTP 500` | The CApp deployed and failed while trying to use the missing database | This is expected for the lab | `/citizen/health` still returns `HTTP 200` |
| MI pod restarts after mounting the CApp | The artifact affected startup or readiness | Check logs and delete the shared volume manifest to remove the broken CApp | Pod becomes `Running` again after cleanup |
