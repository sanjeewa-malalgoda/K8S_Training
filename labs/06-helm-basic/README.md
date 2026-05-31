# Lab 06 — Basic Helm

Goal: install a simple NGINX chart using Helm.

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
