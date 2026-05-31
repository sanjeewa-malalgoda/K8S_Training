# 08 — Helm Basics

Helm is a package manager for Kubernetes.

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
