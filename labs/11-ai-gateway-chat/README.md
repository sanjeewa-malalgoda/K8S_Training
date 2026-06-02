# Lab 11 - Build a Chat App Through WSO2 AI Gateway

This lab shows how a browser chat app can call an LLM through WSO2 API Manager AI Gateway.

The app does not call Groq, OpenAI, Mistral, or any provider directly.

It calls:

```text
Browser chat app
  -> WSO2 AI Gateway
  -> LLM provider
```

Why this matters:

```text
The provider API key stays inside WSO2 API Manager.
The browser app only uses an APIM access token.
APIM can apply authentication, subscriptions, throttling, logging, and future AI policies.
```

---

## What you will build

| Item | Purpose |
|---|---|
| AI API in APIM | Proxies requests to an LLM provider |
| APIM subscription token | Allows the browser app to call the AI API |
| Browser chat app | Gives users a real chat experience |

Recommended provider for this lab:

```text
Groq
```

Groq is usually easier for learners to access than paid enterprise LLM providers.
If the trainer already has another provider key, you can use that instead.

---

# 1. Prerequisites

Complete:

```text
Lab 07 - APIM is deployed and gateway port-forward is running
```

You do not need Labs 08, 09, or 10 for this lab.

Check APIM:

```bash
kubectl get pods -n wso2
```

Expected:

```text
apim-wso2am-all-in-one-am-deployment-1-xxxxx   1/1   Running
```

Check Lab 07 port-forward is running:

```text
kubectl port-forward -n wso2 svc/apim-wso2am-all-in-one-am-service 443:9443 8243:8243
```

Check hosts file contains:

```text
127.0.0.1 am.wso2.com
127.0.0.1 gw.wso2.com
```

Open Publisher:

```text
https://am.wso2.com/publisher/
```

Login:

```text
admin / admin
```

---

# 2. Get a provider key

Recommended path:

```text
Groq API key
```

Groq uses an OpenAI-compatible chat-completions style API.

Provider details:

| Setting | Value |
|---|---|
| Provider | Groq |
| Base URL | `https://api.groq.com/openai/v1` |
| Chat completions path | `/chat/completions` |
| Example model | `llama-3.1-8b-instant` |

Important:

```text
Do not paste the provider key into the browser chat app.
The provider key belongs inside WSO2 API Manager.
```

If you cannot use Groq, use another AI provider supported by your APIM setup.
The browser app still works as long as APIM exposes a chat-completions style AI API.

---

# 3. Create or configure the AI provider in APIM

In Publisher or Admin Portal, configure an AI provider.

Use the simplest option available in your APIM UI:

| Situation | Path |
|---|---|
| Groq is listed as a provider | Select Groq and add the API key |
| Groq is not listed | Create a custom AI vendor/provider using the Groq base URL |
| Trainer provides OpenAI/Mistral/Azure key | Use the built-in provider for that key |

For Groq custom provider, use:

```text
https://api.groq.com/openai/v1
```

Add the provider API key in APIM.

Expected:

```text
APIM has an AI provider configured and ready to use.
```

---

# 4. Create an AI API

In Publisher:

1. Click **Create API**.
2. Select **AI API**.
3. Select the provider configured in the previous step.
4. Use these values:

| Field | Value |
|---|---|
| Name | `Government AI Chat` |
| Context | `/gov-ai-chat` |
| Version | `1.0.0` |
| Model | `llama-3.1-8b-instant` or another available model |

If APIM asks for an endpoint or resource path, use the provider chat-completions endpoint:

```text
/chat/completions
```

Expected:

```text
Government AI Chat API is created.
```

---

# 5. Enable CORS for the browser app

The browser app runs from:

```text
http://localhost:5500
```

Because the app calls APIM from the browser, CORS may be required.

In the AI API settings, enable CORS if available.

Use:

| CORS setting | Value |
|---|---|
| Allowed origins | `http://localhost:5500` |
| Allowed methods | `POST, OPTIONS` |
| Allowed headers | `Authorization, Content-Type` |

For local training only, if APIM requires a wildcard:

```text
*
```

Do not use wildcard CORS for production systems.

---

# 6. Deploy and publish the AI API

In Publisher:

1. Go to **Deployments**.
2. Deploy the API to the default gateway.
3. Go to **Lifecycle**.
4. Click **Publish**.

Expected:

```text
Government AI Chat API is published.
```

---

# 7. Subscribe and generate an APIM token

Open Developer Portal:

```text
https://am.wso2.com/devportal/
```

Login:

```text
admin / admin
```

Find:

```text
Government AI Chat
```

Subscribe it to:

```text
DefaultApplication
```

Generate a production access token.

Copy:

```text
APIM access token
```

Do not copy the provider key into the app.

---

# 8. Test the AI API with curl first

Use the APIM gateway URL.

Expected local gateway URL:

```text
https://gw.wso2.com:8243/gov-ai-chat/1.0.0/chat/completions
```

If Developer Portal shows a different invoke URL, use the URL shown by Developer Portal.

## Windows PowerShell

```powershell
$TOKEN = "paste-apim-access-token-here"

$body = @{
  model = "llama-3.1-8b-instant"
  messages = @(
    @{
      role = "system"
      content = "You are a helpful government service assistant."
    },
    @{
      role = "user"
      content = "Explain how to apply for a building permit."
    }
  )
  temperature = 0.4
  stream = $false
} | ConvertTo-Json -Depth 10

curl.exe -k -X POST "https://gw.wso2.com:8243/gov-ai-chat/1.0.0/chat/completions" `
  -H "Authorization: Bearer $TOKEN" `
  -H "Content-Type: application/json" `
  -d $body
```

## macOS Terminal

```bash
TOKEN="paste-apim-access-token-here"

curl -k -X POST "https://gw.wso2.com:8243/gov-ai-chat/1.0.0/chat/completions" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "llama-3.1-8b-instant",
    "messages": [
      {
        "role": "system",
        "content": "You are a helpful government service assistant."
      },
      {
        "role": "user",
        "content": "Explain how to apply for a building permit."
      }
    ],
    "temperature": 0.4,
    "stream": false
  }'
```

Expected:

```json
{
  "choices": [
    {
      "message": {
        "role": "assistant",
        "content": "..."
      }
    }
  ]
}
```

Do not continue until curl works.

---

# 9. Start the browser chat app

From the repository root:

```bash
cd labs/11-ai-gateway-chat/app
```

Start a local static web server.

## Windows PowerShell

```powershell
py -m http.server 5500
```

If `py` is not available:

```powershell
python -m http.server 5500
```

## macOS Terminal

```bash
python3 -m http.server 5500
```

Expected:

```text
Serving HTTP on ... port 5500
```

Open:

```text
http://localhost:5500
```

Expected:

```text
Government AI Assistant chat page opens.
```

---

# 10. Use the chat app

In the left sidebar, enter:

| Field | Value |
|---|---|
| AI Gateway URL | `https://gw.wso2.com:8243/gov-ai-chat/1.0.0/chat/completions` |
| APIM Access Token | Token from Developer Portal |
| Model | `llama-3.1-8b-instant` or the model selected in APIM |
| System Prompt | Keep the default or customize it |

Click:

```text
Save settings
```

Try one of the prompt chips:

```text
Building permit steps
```

Or type:

```text
How do I apply for a building permit?
```

Expected:

```text
The assistant responds in the chat panel.
```

The status card should show:

```text
Connected
```

---

# 11. Understand what just happened

The browser app sent this kind of request:

```http
POST https://gw.wso2.com:8243/gov-ai-chat/1.0.0/chat/completions
Authorization: Bearer <APIM access token>
Content-Type: application/json
```

The browser app did not send:

```text
Groq API key
OpenAI API key
Mistral API key
```

APIM handled the provider key and forwarded the request to the LLM provider.

This is the core AI Gateway pattern:

```text
Application token
  -> APIM
  -> Provider key
  -> LLM provider
```

---

# 12. Try interactive prompts

Use the chat page to try:

```text
Explain the building permit process in five simple steps.
```

```text
What questions should a citizen ask before submitting a market stall permit request?
```

```text
Draft a polite email asking for an update on permit PERMIT-1001.
```

```text
Summarize senior citizen support benefits for a first-time applicant.
```

Try changing the system prompt:

```text
You are a concise public service chatbot. Always answer in bullet points.
```

Expected:

```text
The response style changes based on the system prompt.
```

---

# Troubleshooting

| Error | Meaning | Fix | Validation |
|---|---|---|---|
| `401` or `403` | APIM token is missing, expired, or not subscribed | Generate a new token in Developer Portal | curl test works |
| `404` | Wrong AI API context, version, or path | Copy the invoke URL from Developer Portal | Browser app URL matches DevPortal |
| `CORS` error in browser console | APIM did not allow `http://localhost:5500` | Enable CORS for the AI API | Browser request succeeds |
| Certificate warning | Local APIM uses a self-signed certificate | Open `https://gw.wso2.com:8243` in the browser and accept the certificate warning | Browser app can call gateway |
| Provider quota or billing error | LLM provider rejected the upstream request | Check provider key, quota, model, and provider logs | curl returns an assistant response |
| `py` or `python` not found | Python is not installed or not on PATH | Use VS Code Live Server or install Python | `http://localhost:5500` opens |
| App says request failed | URL, token, CORS, or provider config is wrong | Test with curl first, then retry in browser | Status card shows `Connected` |

---

# Cleanup

Stop the local web server:

```text
Ctrl + C
```

To remove the AI API:

1. Open Publisher.
2. Open `Government AI Chat`.
3. Change lifecycle state to **Retire** if required.
4. Delete the API.

Do not delete Lab 07 APIM unless you are finished with all WSO2 labs.

---

# References

- WSO2 AI Gateway overview: https://apim-docs-stg.wso2.com/en/4.6.0/ai-gateway/ai-gateway-overview/
- WSO2 create an AI API: https://apim.docs.wso2.com/en/4.6.0/api-design-manage/design/create-api/create-ai-api/create-an-ai-api/
- WSO2 custom AI vendors: https://apim.docs.wso2.com/en/4.6.0/ai-gateway/ai-vendor-management/custom-ai-vendors/overview/
- Groq OpenAI-compatible API: https://console.groq.com/docs/openai
