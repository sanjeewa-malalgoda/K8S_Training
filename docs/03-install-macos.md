# 03 — Install on macOS

This section explains how to install Docker Desktop, minikube, and kubectl on macOS.

---

## 1. Check Mac architecture

```bash
uname -m
```

| Output | Meaning |
|---|---|
| `arm64` | Apple Silicon Mac |
| `x86_64` | Intel Mac |

---

## 2. Install Docker Desktop

1. Download Docker Desktop for Mac.
2. Choose the correct installer:
   - Apple Silicon for `arm64`
   - Intel for `x86_64`
3. Open the `.dmg`.
4. Drag Docker to Applications.
5. Open Docker Desktop.
6. Complete permission prompts.
7. Wait until Docker is running.

Verify:

```bash
docker version
```

Expected:

```text
Client:
Server:
```

---

## 3. Install minikube with Homebrew

```bash
brew install minikube
```

Verify:

```bash
which minikube
minikube version
```

---

## 4. Install minikube without Homebrew

### Apple Silicon

```bash
curl -LO https://github.com/kubernetes/minikube/releases/latest/download/minikube-darwin-arm64
sudo install minikube-darwin-arm64 /usr/local/bin/minikube
minikube version
```

### Intel Mac

```bash
curl -LO https://github.com/kubernetes/minikube/releases/latest/download/minikube-darwin-amd64
sudo install minikube-darwin-amd64 /usr/local/bin/minikube
minikube version
```

---

## 5. macOS notes

You may be asked for your password when:

- Installing into `/usr/local/bin`
- Docker Desktop configures helper tools
- Running `minikube tunnel`

This is expected.
