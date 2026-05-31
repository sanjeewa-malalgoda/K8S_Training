# Lab 05 — PersistentVolumeClaim

## What is Persistent Storage?

By default, pod data is **temporary**. When a pod dies, all data is lost.

### The problem

Your app writes logs or database files to disk. Kubernetes replaces the pod. Data is gone.

### The solution: PersistentVolume

A **PersistentVolume (PV)** is storage that outlives pods. It exists at the cluster level.

A **PersistentVolumeClaim (PVC)** is a request for storage:
- "I need 1GB of storage"
- "I need read-write access"
- Kubernetes finds a matching PV and binds them

### Real-world examples

- **Database pod** — needs data to survive pod restarts
- **Log collector** — needs to persist logs to disk
- **Cache** — stores data across pod replacements
- **Shared data** — multiple pods access the same file

### What you'll do

You'll create a PVC and mount it into a pod. The pod writes a file to the volume. Even if the pod is deleted and recreated, the file persists.

---

## Apply

```bash
kubectl apply -f labs/05-persistent-volume/
```

---

## Verify

```bash
kubectl get pvc -n minikube-demo
kubectl get pods -n minikube-demo
```

Expected output (PVC):

```text
NAME        STATUS   VOLUME                                     CAPACITY   ACCESS MODES   AGE
data-pvc    Bound    pvc-1234567890-abcdef                     1Gi        RWO            2m
```

Expected output (Pod):

```text
NAMESPACE       NAME            READY   STATUS    RESTARTS   AGE
minikube-demo   storage-pod     1/1     Running   0          2m
```

✓ Success if PVC shows `STATUS: Bound` and Pod shows `STATUS: Running`

---

## Write data

```bash
kubectl exec -n minikube-demo pvc-demo -- sh -c "echo hello-from-minikube > /data/message.txt"
```

Read data:

```bash
kubectl exec -n minikube-demo pvc-demo -- cat /data/message.txt
```

---

## Cleanup

```bash
kubectl delete -f labs/05-persistent-volume/
```
