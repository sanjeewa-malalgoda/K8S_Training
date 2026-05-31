# Lab 05 — PersistentVolumeClaim

Goal: create a PersistentVolumeClaim and mount it into a pod.

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
