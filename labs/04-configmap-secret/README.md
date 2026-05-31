# Lab 04 — ConfigMap and Secret

Goal: pass configuration and secret values into a pod.

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

Expected logs should show environment variables printed by the container.

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
