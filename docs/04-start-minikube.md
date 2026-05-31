# 04 — Start Minikube

Use the Docker driver for both Windows and macOS.

---

## Start cluster

```bash
minikube start --driver=docker --cpus=4 --memory=8192
```

For heavier labs:

```bash
minikube start --driver=docker --cpus=4 --memory=8192 --disk-size=40g
```

---

## Verify status

```bash
minikube status
```

Expected:

```text
host: Running
kubelet: Running
apiserver: Running
kubeconfig: Configured
```

---

## Verify node

```bash
kubectl get nodes
```

Expected:

```text
NAME       STATUS   ROLES           AGE   VERSION
minikube   Ready    control-plane    ...   ...
```

---

## Verify all pods

```bash
kubectl get pods -A
```

Expected:

```text
kube-system pods should be Running
```

---

## Confirm current context

```bash
kubectl config current-context
```

Expected:

```text
minikube
```
