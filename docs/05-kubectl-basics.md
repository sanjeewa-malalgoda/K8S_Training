# 05 — kubectl Basics

`kubectl` is the command-line tool used to interact with Kubernetes.

---

## Basic commands

Check nodes:

```bash
kubectl get nodes
```

Check pods in current namespace:

```bash
kubectl get pods
```

Check pods in all namespaces:

```bash
kubectl get pods -A
```

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
