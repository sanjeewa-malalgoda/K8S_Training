# Lab 01 - Hello Deployment

## What is a Deployment?

A **Deployment** is the most common way to run applications in Kubernetes. It manages creating and maintaining pods.

### Why use Deployments?

Without Deployments, if a pod crashes, it's gone. Deployments automatically:
- **Replace failed pods** - If a pod dies, Deployment creates a new one
- **Scale pods** - Run multiple copies for load balancing
- **Rolling updates** - Update app version without downtime
- **Rollback** - Go back to previous version if something breaks

### What you'll do

You'll deploy a simple Nginx container using Kubernetes YAML files. This deployment will keep running as long as your cluster is alive.

---

## Apply

```bash
kubectl apply -f labs/01-hello-deployment/
```

---

## Verify

```bash
kubectl get namespace minikube-demo
kubectl get deployments -n minikube-demo
kubectl get pods -n minikube-demo
```

Expected output:

```text
NAMESPACE       NAME                            READY   STATUS    RESTARTS   AGE
minikube-demo   hello-nginx-5d9d98b8b9-abcde    1/1     Running   0          2m
```

✓ Success if pod shows `STATUS: Running` and `READY: 1/1`

---

## Inspect

```bash
kubectl describe deployment hello-nginx -n minikube-demo
```

---

## Cleanup

```bash
kubectl delete -f labs/01-hello-deployment/
```
