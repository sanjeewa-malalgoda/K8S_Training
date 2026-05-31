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

Expected:

```text
PVC status is Bound
pod status is Running
```

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
