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
NAME       STATUS   ROLES           AGE     VERSION
minikube   Ready    control-plane   7m15s   v1.35.1
```

**✓ Success if `STATUS: Ready` is shown (AGE and VERSION will vary)**

---

## Verify all pods

```bash
kubectl get pods -A
```

Expected:

```text
NAMESPACE     NAME                               READY   STATUS    RESTARTS      AGE
kube-system   coredns-7d764666f9-6z4rq           1/1     Running   0             100m
kube-system   etcd-minikube                      1/1     Running   0             100m
kube-system   kube-apiserver-minikube            1/1     Running   0             100m
kube-system   kube-controller-manager-minikube   1/1     Running   0             100m
kube-system   kube-proxy-699hl                   1/1     Running   0             100m
kube-system   kube-scheduler-minikube            1/1     Running   0             100m
kube-system   storage-provisioner                1/1     Running   1 (99m ago)   100m
```

**✓ Success criteria:**
- All 7 pods must show `STATUS: Running`
- `READY` column must show `1/1` for each pod
- No `Pending`, `Failed`, `CrashLoopBackOff`, or `Unknown` status

---

## Confirm current context

```bash
kubectl config current-context
```

Expected:

```text
minikube
```
