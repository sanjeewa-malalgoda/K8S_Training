# Lab 11 - Call Claude Through WSO2 AI Gateway

This lab uses WSO2 API Manager AI Gateway to call Anthropic Claude.

There is no browser app in this lab.

Why:

```text
Local APIM uses self-signed HTTPS certificates.
Browser apps also need CORS.
Those two issues made the previous browser app path unreliable for training.
```

The clean training flow is:

```text
curl or Developer Portal Try Out
  -> WSO2 AI Gateway
  -> Anthropic Claude
```

The Anthropic provider key stays inside WSO2 API Manager.
Learners only use an APIM API key or access token for the published API.

Tested training shape:

```text
Tested on: 2026-06-05
Provider: Anthropic / Claude
Gateway URL: https://gw.wso2.com:8243/anthropicapis/1/v1/messages
Provider header: anthropic-version: 2023-06-01
Request method: POST
```

Important:

```text
This lab depends on the Anthropic API definition deployed in your local APIM.
If the API context, version, resource path, security scheme, or model changes,
copy the exact values from Developer Portal Try Out and update the curl command.
```

---

# 1. Prerequisites

Complete:

```text
Lab 07 - APIM is deployed and gateway port-forward is running
```

Check APIM:

```powershell
kubectl get pods -n wso2
```

Expected:

```text
apim-wso2am-all-in-one-am-deployment-1-xxxxx   1/1   Running
```

Start or confirm the Lab 07 APIM port-forward.

Use a dedicated terminal and keep it open.

```powershell
kubectl port-forward -n wso2 svc/apim-wso2am-all-in-one-am-service 443:9443 8243:8243
```

Expected:

```text
Forwarding from 127.0.0.1:443 -> 9443
Forwarding from 127.0.0.1:8243 -> 8243
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

# 2. Configure the Anthropic Provider

Get an Anthropic API key from the trainer.

Do not put this provider key in curl, JavaScript, or any browser app.
The provider key belongs inside WSO2 API Manager.

In APIM, configure an Anthropic provider.

Use:

| Setting | Value |
|---|---|
| Provider | `Anthropic` |
| Base URL | `https://api.anthropic.com` |
| Messages path | `/v1/messages` |
| Required provider header | `anthropic-version: 2023-06-01` |

Expected:

```text
APIM has an Anthropic provider configured with the provider API key.
```

---

# 3. Create the Claude AI API

In Publisher:

1. Click **Create API**.
2. Select **AI API**.
3. Select the Anthropic provider.
4. Use these values:

| Field | Value |
|---|---|
| Name | `Anthropic APIs` |
| Context | `/anthropicapis` |
| Version | `1` |
| Resource path | `/v1/messages` |
| Model | Use the Claude model configured by the trainer |

For the current tested local training setup, the model value used by APIM was:

```text
anthropic base mode
```

Expected:

```text
Anthropic APIs is created.
```

---

# 4. Deploy and Publish the API

In Publisher:

1. Go to **Deployments**.
2. Deploy the API to the default gateway.
3. Go to **Lifecycle**.
4. Click **Publish**.

Expected:

```text
Anthropic APIs is published.
```

---

# 5. Subscribe and Generate Credentials

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
Anthropic APIs
```

Subscribe it to:

```text
DefaultApplication
```

Generate a production API key or access token, depending on the security scheme shown in Developer Portal.

For the tested local training setup, Developer Portal Try Out used:

```text
ApiKey: <generated-api-key>
```

Copy:

```text
APIM API key
```

Do not copy the Anthropic provider key.

---

# 6. Test in Developer Portal Try Out

Open the `Anthropic APIs` page in Developer Portal.

Go to:

```text
Try Out
```

Use:

| Field | Value |
|---|---|
| Operation | `POST /v1/messages` |
| Header | `anthropic-version: 2023-06-01` |
| Auth | APIM API key or token from Developer Portal |

Use this request body:

```json
{
  "model": "anthropic base mode",
  "max_tokens": 128,
  "messages": [
    {
      "role": "user",
      "content": "Explain how to apply for a building permit."
    }
  ],
  "system": "You are a helpful government service assistant.",
  "temperature": 0.4,
  "stream": false
}
```

Expected:

```text
Try Out returns a Claude response.
```

Do not continue until Try Out works.

---

# 7. Test with Curl

Use curl after Developer Portal Try Out works.

The local gateway URL tested for this lab is:

```text
https://gw.wso2.com:8243/anthropicapis/1/v1/messages
```

If Developer Portal shows a different invoke URL, use the Developer Portal URL.

## Windows PowerShell

```powershell
$API_KEY = "paste-apim-api-key-here"

$body = @{
  model = "anthropic base mode"
  max_tokens = 128
  messages = @(
    @{
      role = "user"
      content = "Explain how to apply for a building permit."
    }
  )
  system = "You are a helpful government service assistant."
  temperature = 0.4
  stream = $false
} | ConvertTo-Json -Depth 10

curl.exe -k -X POST "https://gw.wso2.com:8243/anthropicapis/1/v1/messages" `
  -H "ApiKey: $API_KEY" `
  -H "anthropic-version: 2023-06-01" `
  -H "Content-Type: application/json" `
  --data-raw $body
```

## macOS Terminal

```bash
API_KEY="paste-apim-api-key-here"

curl -k -X POST "https://gw.wso2.com:8243/anthropicapis/1/v1/messages" \
  -H "ApiKey: $API_KEY" \
  -H "anthropic-version: 2023-06-01" \
  -H "Content-Type: application/json" \
  --data-raw '{
    "model": "anthropic base mode",
    "max_tokens": 128,
    "messages": [
      {
        "role": "user",
        "content": "Explain how to apply for a building permit."
      }
    ],
    "system": "You are a helpful government service assistant.",
    "temperature": 0.4,
    "stream": false
  }'
```

Expected response includes:

```json
{
  "content": [
    {
      "type": "text",
      "text": "..."
    }
  ]
}
```

---

# 8. Try More Prompts

Change only the user message.

Try:

```text
Explain the building permit process in five simple steps.
```

```text
What questions should a citizen ask before submitting a market stall permit request?
```

```text
Draft a polite email asking for an update on permit PERMIT-1001.
```

Expected:

```text
Claude responds through WSO2 AI Gateway.
```

---

# 9. Understand What Happened

The request went through APIM:

```http
POST https://gw.wso2.com:8243/anthropicapis/1/v1/messages
ApiKey: <APIM API key>
anthropic-version: 2023-06-01
Content-Type: application/json
```

The request did not send:

```text
Anthropic provider API key
```

APIM handled the provider key and forwarded the request to Claude.

Core pattern:

```text
APIM API key
  -> WSO2 API Manager AI Gateway
  -> Anthropic provider key stored in APIM
  -> Claude
```

---

# Troubleshooting

| Error | Meaning | Fix | Validation |
|---|---|---|---|
| `401` or `403` | APIM API key or token is missing, expired, or not subscribed | Generate fresh credentials in Developer Portal | Try Out and curl work |
| `404` | Wrong context, version, or resource path | Copy the exact invoke URL from Developer Portal | Curl hits `/v1/messages` successfully |
| Provider error | Anthropic rejected the upstream request | Check provider key, quota, selected model, and APIM logs | Try Out returns Claude response |
| TLS or certificate error in curl | Local APIM uses a self-signed certificate | Use `curl -k` for this local lab | Curl reaches APIM |
| `anthropic-version` error | Header is missing or wrong | Send `anthropic-version: 2023-06-01` | Claude response returns |
| Model error | The model value is not valid for the configured provider | Use the model shown by APIM/Try Out or trainer | Try Out succeeds |

---

# Cleanup

To remove the AI API:

1. Open Publisher.
2. Open `Anthropic APIs`.
3. Change lifecycle state to **Retire** if required.
4. Delete the API.

Do not delete Lab 07 APIM unless you are finished with all WSO2 labs.

---

# References

- WSO2 Anthropic provider: https://apim-docs-stg.wso2.com/en/4.6.0/ai-gateway/ai-vendor-management/anthropic/
- WSO2 AI Gateway getting started: https://apim.docs.wso2.com/en/latest/ai-gateway/getting-started-with-ai-gateway/
- Anthropic Messages API: https://platform.claude.com/docs/en/api/messages
