# 08 - Helm Basics

## What is Helm?

Helm is a **package manager** for Kubernetes (think: `npm` for Node.js, `apt` for Linux, `brew` for macOS).

### The problem Helm solves

With raw YAML files, deploying an app requires:
1. Create Deployment YAML (pod config)
2. Create Service YAML (networking)
3. Create ConfigMap YAML (config)
4. Create Secret YAML (credentials)
5. Create PVC YAML (storage)

That's 5+ files for one app. **Helm packages all of this** into a reusable bundle called a **Chart**.

### Helm Chart = Application Bundle

A Helm Chart includes:
- Kubernetes YAML templates
- Default configuration values
- Metadata and version
- Installation/uninstall logic

**Example:** The `bitnami/nginx` chart is a pre-packaged Nginx installation that handles all the YAML for you.

### Why use Helm?

- **Reusability** - Share charts across projects
- **Templates** - Customize values without editing YAML
- **Versioning** - Easy upgrades and rollbacks
- **Package management** - Similar to `npm install`

---

## Check Helm

```bash
helm version
```

If Helm is not installed, install it later using the official Helm installation guide.

---

## Add a repo

```bash
helm repo add bitnami https://charts.bitnami.com/bitnami
helm repo update
```

---

## Search charts

```bash
helm search repo nginx
```

---

## Install a chart

```bash
helm install demo-nginx bitnami/nginx --namespace minikube-demo --create-namespace
```

Check:

```bash
kubectl get pods -n minikube-demo
kubectl get svc -n minikube-demo
```

Cleanup:

```bash
helm uninstall demo-nginx -n minikube-demo
```
