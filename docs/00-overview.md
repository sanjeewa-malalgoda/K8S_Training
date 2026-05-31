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

Should show:

```text
NAME       STATUS   ROLES           AGE   VERSION
minikube   Ready    control-plane    ...   ...
```

And:

```bash
kubectl get pods -A
```

Should show core Kubernetes pods in `Running` state.
