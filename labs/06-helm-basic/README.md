# Lab 06 - Basic Helm

## What you'll do

Instead of writing raw YAML files (as in Labs 01-05), you'll install a complete application using Helm.

### Before vs After

**Without Helm (Labs 01-05):**
- Write Deployment YAML
- Write Service YAML
- Write ConfigMap YAML
- Write Secret YAML
- Apply each file manually

**With Helm (This lab):**
```bash
helm install demo-nginx bitnami/nginx
```

That's it. Helm handles all the YAML for you.

### How Helm Charts work

1. **Chart Repository** (bitnami) - Collection of packaged apps
2. **Chart** (nginx) - Pre-built YAML templates and defaults
3. **Values** - Customizable settings (version, port, replicas, etc.)
4. **Release** - An installed chart (named `demo-nginx`)

You can override any value without editing the chart.

### Why this matters

- **Production use** - Real apps use Helm
- **Consistency** - Deploy the same app the same way everywhere
- **Upgrades** - `helm upgrade` instead of re-applying YAML
- **Sharing** - Teams publish charts for others to use

---

## Prerequisite

Check Helm:

```bash
helm version
```

---

## Add Bitnami repo

```bash
helm repo add bitnami https://charts.bitnami.com/bitnami
helm repo update
```

---

## Install NGINX

```bash
helm install demo-nginx bitnami/nginx --namespace minikube-demo --create-namespace
```

---

## Verify

```bash
helm list -n minikube-demo
kubectl get pods -n minikube-demo
kubectl get svc -n minikube-demo
```

---

## Access service

```bash
minikube service demo-nginx -n minikube-demo
```

---

## Cleanup

```bash
helm uninstall demo-nginx -n minikube-demo
```
