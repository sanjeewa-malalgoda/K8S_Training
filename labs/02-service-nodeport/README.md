# Lab 02 — Service and NodePort

Goal: expose a Deployment using a Kubernetes Service.

---

## Apply

```bash
kubectl apply -f labs/02-service-nodeport/
```

---

## Verify

```bash
kubectl get pods -n minikube-demo
kubectl get svc -n minikube-demo
```

---

## Open service

```bash
minikube service hello-nginx-nodeport -n minikube-demo
```

This should open the app in your browser.

---

## Cleanup

```bash
kubectl delete -f labs/02-service-nodeport/
```
