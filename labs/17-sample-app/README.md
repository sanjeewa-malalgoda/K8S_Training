# Lab 17 - Run a Local OIDC Sample App

This lab runs a small React sample app on your laptop and connects it to the
WSO2 Identity Server deployed in Kubernetes from Lab 16.

The sample app does not run in Kubernetes. Kubernetes runs IAM; the app runs
locally on `http://localhost:3000`.

---

# 1. What You Build

```text
Browser
  -> http://localhost:3000
  -> local React dev server
  -> WSO2 IAM through https://localhost
  -> kubectl port-forward
  -> WSO2 IAM pod in minikube
```

This lab uses:

| Need | Resource |
|---|---|
| IAM namespace | `wso2-iam` |
| IAM service | `wso2iam-identity-server` |
| App folder | `labs/17-sample-app/app` |
| Local app URL | `http://localhost:3000` |
| IAM URL | `https://localhost` |

---

# 2. Prerequisites

Complete Lab 16 first and keep the IAM port-forward running:

```powershell
kubectl port-forward -n wso2-iam svc/wso2iam-identity-server 443:9443
```

Expected output:

```text
Forwarding from 127.0.0.1:443 -> 9443
Forwarding from [::1]:443 -> 9443
```

Required on your laptop:

```text
Docker Desktop is running
minikube is running with the Docker driver
kubectl works
Node.js and npm are installed
```

Validate:

```powershell
kubectl get pods -n wso2-iam
node -v
npm -v
```

Expected output includes:

```text
wso2iam-identity-server-...   1/1   Running
v...
...
```

---

# 3. Create an IAM Application

Open the WSO2 IAM Console:

```text
https://localhost/console
```

Use:

```text
Username: admin
Password: admin
```

Create a Standard-Based Application for the sample app.

Use these application URLs:

| Setting | Value |
|---|---|
| Authorized redirect URL | `http://localhost:3000` |
| Allowed origin | `http://localhost:3000` |
| Logout return URL | `http://localhost:3000` |

Copy the generated client ID.

Expected result:

```text
The IAM application is created and a client ID is available.
```

---

# 4. Configure the Sample App

Edit:

```text
labs/17-sample-app/app/src/config.json
```

Set `clientID` to the value from your IAM application:

```json
{
    "clientID": "PASTE_CLIENT_ID_HERE",
    "baseUrl": "https://localhost",
    "signInRedirectURL": "http://localhost:3000",
    "signOutRedirectURL": "http://localhost:3000",
    "scope": ["profile", "email"]
}
```

Expected result:

```text
The app points to WSO2 IAM through https://localhost and returns to http://localhost:3000.
```

---

# 5. Install Dependencies

Run commands from the repository root.

## Windows PowerShell

```powershell
cd .\labs\17-sample-app\app
npm install
```

Expected output includes:

```text
added ... packages
```

If dependencies were already installed, npm may show:

```text
up to date
```

## macOS Terminal

```bash
cd ./labs/17-sample-app/app
npm install
```

Expected output includes:

```text
added ... packages
```

---

# 6. Run the Local App

Keep the Lab 16 IAM port-forward running in another terminal.

## Windows PowerShell

```powershell
npm start
```

## macOS Terminal

```bash
npm start
```

Expected output includes:

```text
Project is running at:
Loopback: http://localhost:3000/
```

Open:

```text
http://localhost:3000
```

Expected result:

```text
The Corlence Identity Console opens and the sign-in button redirects to WSO2 IAM.
```

---

# 7. Verify Login

Sign in through WSO2 IAM.

Expected result:

```text
The browser returns to http://localhost:3000 and the app shows the logged-in user profile.
```

Open the session details view in the app.

Expected result:

```text
The app shows token timing, scopes, subject, username, and profile details returned by IAM.
```

---

# 8. Optional Build Check

You can confirm the app compiles without committing the generated output:

```powershell
cd labs/17-sample-app/app
npm run build
```

Expected output includes:

```text
webpack ... compiled successfully
```

The generated `dist/` folder is ignored and should not be committed.

# 9. Stop and Cleanup

Stop the local app with `Ctrl+C`.

To remove local dependencies:

```powershell
Remove-Item -Recurse -Force .\node_modules
```

macOS equivalent:

```bash
rm -rf node_modules
```

Warning: only remove `node_modules` from inside `labs/17-sample-app/app`.

---

# Project Shape

```text
labs/17-sample-app/
  README.md
  app/
    package.json
    src/
```

Generated files such as `app/dist/` and `app/node_modules/` are ignored and
should not be committed.

---

# Troubleshooting

| Error | Meaning | Fix | Validation |
|---|---|---|---|
| Browser shows `invalid_callback` | The IAM application callback URL does not match the app URL | Set redirect URL, origin, and logout return URL to `http://localhost:3000` | Login returns to the sample app |
| Browser cannot reach IAM | The Lab 16 IAM port-forward is not running | Run `kubectl port-forward -n wso2-iam svc/wso2iam-identity-server 443:9443` | `https://localhost/console` opens |
| `npm install` fails | Node.js, npm, or network access is not available | Check `node -v`, `npm -v`, and network/proxy settings | `npm install` completes |
| App still uses an old client ID | Browser cache or the dev server is still using old config | Restart `npm start` and clear site data for `http://localhost:3000` | Login starts with the new IAM app |
| Browser shows certificate warning for IAM | Lab 16 uses local/self-signed TLS | Accept the local lab certificate warning for `https://localhost` | IAM login page opens |
