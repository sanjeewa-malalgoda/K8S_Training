# Lab 03 — Ingress

Goal: expose a service using Ingress.

---

## Before starting

Enable ingress:

```bash
minikube addons enable ingress
kubectl get pods -n ingress-nginx
```

Wait until the ingress controller is Running.

---

## Apply

```bash
kubectl apply -f labs/03-ingress/
```

---

## Get minikube IP

```bash
minikube ip
```

---

## Add hosts file entry

Map the minikube IP to:

```text
hello.local
```

### Windows

Edit as Administrator:

```text
C:\Windows\System32\drivers\etc\hosts
```

Add:

```text
<MINIKUBE_IP> hello.local
```

### macOS

```bash
sudo nano /etc/hosts
```

Add:

```text
<MINIKUBE_IP> hello.local
```

---

## Test

```bash
curl http://hello.local
```

Or open in browser:

```text
http://hello.local
```

---

## Verify resources

```bash
kubectl get ingress -n minikube-demo
kubectl describe ingress hello-nginx-ingress -n minikube-demo
```

---

## Cleanup

```bash
kubectl delete -f labs/03-ingress/
```
