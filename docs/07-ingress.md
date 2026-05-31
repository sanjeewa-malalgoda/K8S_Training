# 07 — Ingress

Ingress routes HTTP traffic into services inside the cluster.

---

## 1. Enable ingress controller

```bash
minikube addons enable ingress
```

Verify:

```bash
kubectl get pods -n ingress-nginx
```

---

## 2. Get minikube IP

```bash
minikube ip
```

Example:

```text
192.168.49.2
```

---

## 3. Add hosts file entry

For a local hostname like:

```text
hello.local
```

Map it to the minikube IP.

### Windows

Open Notepad as Administrator and edit:

```text
C:\Windows\System32\drivers\etc\hosts
```

Add:

```text
<MINIKUBE_IP> hello.local
```

### macOS

Edit hosts file:

```bash
sudo nano /etc/hosts
```

Add:

```text
<MINIKUBE_IP> hello.local
```

---

## 4. Test

```bash
curl http://hello.local
```

Or open:

```text
http://hello.local
```

in a browser.
