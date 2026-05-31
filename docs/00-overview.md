# 00 — Overview

Minikube is a tool for running a local Kubernetes cluster on a laptop or workstation.

In this tutorial, Docker Desktop provides the runtime, and minikube creates a local Kubernetes cluster on top of it.

---

## Architecture

```text
User terminal
    |
    v
kubectl
    |
    v
minikube Kubernetes API server
    |
    v
single-node Kubernetes cluster
    |
    v
Docker Desktop runtime
```

---

## Why use Docker driver?

The Docker driver is preferred in this tutorial because:

- It works on both Windows and macOS
- It avoids Hyper-V-specific setup for Windows learners
- It gives a consistent workshop experience
- It is simple to start and reset

---

## What success looks like

At the end of setup:

```bash
kubectl get nodes
```

Expected output:

```text
NAME       STATUS   ROLES           AGE     VERSION
minikube   Ready    control-plane   7m15s   v1.35.1
```

**✓ Success if `STATUS: Ready` is shown**

And:

```bash
kubectl get pods -A
```

Expected output (all core pods must be `Running`):

```text
NAMESPACE     NAME                               READY   STATUS    RESTARTS      AGE
kube-system   coredns-7d764666f9-6z4rq           1/1     Running   0             100m
kube-system   etcd-minikube                      1/1     Running   0             100m
kube-system   kube-apiserver-minikube            1/1     Running   0             100m
kube-system   kube-controller-manager-minikube   1/1     Running   0             100m
kube-system   kube-proxy-699hl                   1/1     Running   0             100m
kube-system   kube-scheduler-minikube            1/1     Running   0             100m
kube-system   storage-provisioner                1/1     Running   1             100m
```
