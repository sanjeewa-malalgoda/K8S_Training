# 05 — kubectl Basics

## What is kubectl?

`kubectl` (pronounced "kube-control") is the command-line tool for interacting with Kubernetes clusters. Think of it as `git` for Kubernetes:

- **git commit** → `kubectl apply` (create/update resources)
- **git status** → `kubectl get` (view resources)
- **git log** → `kubectl logs` (view pod output)
- **git show** → `kubectl describe` (detailed resource info)

Everything you do in Kubernetes goes through `kubectl`. It communicates with the API server to manage your cluster.

---

## Basic commands

Check nodes:

```bash
kubectl get nodes
```

Check pods in **current namespace** (default):

```bash
kubectl get pods
```

Check pods in **all namespaces** across the cluster:

```bash
kubectl get pods -A
```

**Why namespaces?** Kubernetes uses namespaces to partition cluster resources. Each team or app can have its own namespace, like separate folders. This helps with isolation, permissions, and organization.

Check namespaces:

```bash
kubectl get namespaces
```

Create namespace:

```bash
kubectl create namespace minikube-demo
```

Delete namespace:

```bash
kubectl delete namespace minikube-demo
```

---

## Describe resources

```bash
kubectl describe node minikube
```

```bash
kubectl describe pod <pod-name>
```

---

## Logs

```bash
kubectl logs <pod-name>
```

Follow logs:

```bash
kubectl logs -f <pod-name>
```

---

## Apply and delete YAML

Apply:

```bash
kubectl apply -f file.yaml
```

Delete:

```bash
kubectl delete -f file.yaml
```
