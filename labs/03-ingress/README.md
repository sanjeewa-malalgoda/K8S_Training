# Lab 03 — Ingress

## What you'll learn

In Lab 02, you exposed the app using a NodePort (port 30000+). That works but feels clunky:
- Hard to remember port numbers
- Not realistic for production
- Can't easily run multiple apps

**Ingress solves this:** It routes HTTP requests by hostname and URL path, like a real web server.

### How it works

1. You configure an Ingress resource with a hostname: `hello.local`
2. The Ingress controller (nginx) listens on port 80
3. When a request comes for `hello.local`, it routes to your Service
4. Your Service routes to the Pod

### The result

Instead of:
```
localhost:30000
```

You get:
```
hello.local  (in your browser, like a real website)
```

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
