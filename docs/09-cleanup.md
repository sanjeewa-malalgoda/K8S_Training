# 09 - Cleanup (Documentation Section)

This document covers cleanup for the **documentation learning section (Stages 1)** only.

> **Note:** Lab cleanup is handled separately in each lab README (Labs 01-06). See [README.md Stage 2](../README.md#stage-2-labs-session-apply-what-you-learned) for lab cleanup commands.

---

## When to use this

After completing all documentation sections (1-8) and before starting labs, you may want to validate your cleanup process or reset.

---

## Stop minikube (keeps cluster)

```bash
minikube stop
```

Your cluster is preserved and can be restarted with:

```bash
minikube start --driver=docker --cpus=4 --memory=8192
```

---

## Disable Ingress addon

If you enabled Ingress during the documentation phase:

```bash
minikube addons disable ingress
```

---

## Delete entire minikube cluster

⚠️ **Warning:** This removes the cluster and all workloads permanently.

```bash
minikube delete
```

---

## Recreate clean cluster for labs

After cleanup, recreate a fresh cluster for the labs:

```bash
minikube start --driver=docker --cpus=4 --memory=8192 --disk-size=40g
minikube addons enable ingress
kubectl get nodes
kubectl get pods -A
```

✓ Cluster is ready for labs.
