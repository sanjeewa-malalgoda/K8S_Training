# Lab 04 — ConfigMap and Secret

## What are ConfigMap and Secret?

Sometimes your application needs configuration data (API endpoints, features flags) or sensitive data (passwords, API keys).

### ConfigMap

A **ConfigMap** stores non-sensitive configuration data as key-value pairs. Examples:
- Database URL
- API endpoint
- Feature flags
- Logging level

**Storage:** Plain text (not encrypted)

### Secret

A **Secret** stores sensitive data. Examples:
- Database password
- API tokens
- SSH keys
- OAuth credentials

**Storage:** Base64-encoded (not truly encrypted by default)

### Why not just hardcode values?

- **Flexibility** — Change config without rebuilding container image
- **Reusability** — Same image runs in dev/staging/production with different configs
- **Separation** — Devs write code, ops manage secrets
- **Security** — Secrets are treated specially (e.g., they don't appear in pod logs)

### What you'll do

You'll create a ConfigMap and Secret, then inject them into a pod as environment variables. The pod will print them to logs so you can verify they're available.

---

## Apply

```bash
kubectl apply -f labs/04-configmap-secret/
```

---

## Verify

```bash
kubectl get pods -n minikube-demo
kubectl logs deployment/config-demo -n minikube-demo
```

Expected output (example):

```text
MY_CONFIG_VALUE=hello-from-configmap
MY_SECRET_VALUE=hello-from-secret
```

✓ Success if both environment variables appear in the logs from the container startup.

---

## Inspect ConfigMap and Secret

```bash
kubectl get configmap app-config -n minikube-demo -o yaml
kubectl get secret app-secret -n minikube-demo -o yaml
```

Note: Kubernetes stores Secret data base64-encoded by default. Do not treat this as strong encryption.

---

## Cleanup

```bash
kubectl delete -f labs/04-configmap-secret/
```
