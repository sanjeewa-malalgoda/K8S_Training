# 07 - Ingress

## What is Ingress?

Ingress is a Kubernetes resource that routes **HTTP/HTTPS traffic** from outside the cluster into services.

### How it works

1. **Incoming request** → `hello.local:80`
2. **DNS resolves** → minikube IP (192.168.49.2)
3. **Ingress controller receives** → looks at hostname and path
4. **Routes to service** → forwards to the correct pod
5. **Pod responds** → returns the web page

### Ingress vs NodePort

| Feature | NodePort | Ingress |
|---------|----------|---------|
| Access | Port-based (30000+) | DNS/URL-based (port 80/443) |
| TLS/SSL | Not easy | Built-in support |
| Path routing | No | Yes (e.g., `/api` vs `/app`) |
| Multiple services | Multiple ports | Single port, multiple paths |
| Production use | Rarely | Often |

**In this guide:** You'll use Ingress to access `hello.local` in your browser instead of using a NodePort.

---

## 1. Enable Ingress controller

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
