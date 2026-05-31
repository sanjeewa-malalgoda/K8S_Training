# 09 - Cleanup

Use these commands to clean up labs.

---

## Delete lab resources

```bash
kubectl delete -f labs/01-hello-deployment/
kubectl delete -f labs/02-service-nodeport/
kubectl delete -f labs/03-ingress/
kubectl delete -f labs/04-configmap-secret/
kubectl delete -f labs/05-persistent-volume/
```

---

## Stop minikube

```bash
minikube stop
```

This keeps the cluster but stops it.

---

## Delete minikube cluster

Warning: this removes the cluster and workloads.

```bash
minikube delete
```

---

## Recreate clean cluster

```bash
minikube start --driver=docker --cpus=4 --memory=8192 --disk-size=40g
minikube addons enable ingress
kubectl get nodes
kubectl get pods -A
```
