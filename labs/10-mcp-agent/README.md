# Lab 10 - Convert APIs into MCP Tools and Test with MCP Inspector

This lab converts the REST API from Lab 09 into an MCP server in WSO2 API Manager.

Then you will:

```text
1. Test the MCP tools with MCP Inspector
```

This lab uses the REST API first because request-response tools are easiest to understand.

Optional extension:

```text
Connect the MCP server to VS Code Copilot Agent Mode after MCP Inspector works.
Convert the Benefit Programs GraphQL API into another MCP server after the REST flow works.
```

---

## What is happening

| Earlier lab | What it created |
|---|---|
| Lab 07 | WSO2 API Manager running in Minikube |
| Lab 08 | Government backend services inside Kubernetes |
| Lab 09 | REST, GraphQL, and WebSocket APIs in APIM |
| Lab 10 | MCP tools generated from the REST API |

Concept:

```text
REST API operation
  -> APIM MCP server
  -> MCP tool
  -> MCP Inspector can call the tool
```

Example:

```text
GET /permits
  -> list permit applications
  -> MCP Inspector can call the tool and show the API response
```

---

# 1. Prerequisites

Complete these first:

```text
Lab 07 - APIM is deployed and reachable
Lab 08 - Government services are deployed
Lab 09 - Government Permit Registry REST API is created and published
```

Install or prepare:

```text
Node.js and npx for MCP Inspector
```

Optional only:

```text
VS Code
GitHub Copilot access with Agent Mode
```

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

Check Lab 08 backend services:

```bash
kubectl get svc -n minikube-demo -l lab=government-services
```

Expected:

```text
gov-permits-rest        ClusterIP   ...   8080/TCP
gov-benefits-graphql    ClusterIP   ...   8080/TCP
gov-alerts-websocket    ClusterIP   ...   8080/TCP
```

Check Lab 09 REST API invoke path:

## Windows PowerShell

```powershell
$TOKEN = "paste-access-token-here"
curl.exe -k -H "Authorization: Bearer $TOKEN" https://gw.wso2.com:8243/gov/permits/1.0.0/permits
```

## macOS Terminal

```bash
TOKEN="paste-access-token-here"
curl -k -H "Authorization: Bearer $TOKEN" https://gw.wso2.com:8243/gov/permits/1.0.0/permits
```

Expected:

```json
{
  "count": 2,
  "permits": [
    {
      "id": "PERMIT-1001",
      "citizenName": "Asha Dorji",
      "permitType": "Building",
      "status": "APPROVED",
      "district": "Thimphu"
    }
  ]
}
```

---

# 2. Create an MCP server from the REST API

Open Publisher:

```text
https://am.wso2.com/publisher/
```

Login:

```text
admin / admin
```

In Publisher:

1. Go to **MCP Servers**.
2. Click **Create MCP Server**.
3. Choose **Start from Existing API**.
4. Choose **Create MCP Server from Existing API**.
5. Select:

| Field | Value |
|---|---|
| Source API | `Government Permit Registry` |
| API version | `1.0.0` |

Click **Next**.

Expected:

```text
APIM shows the REST API operations that can become MCP tools.
```

---

# 3. Select REST operations as tools

Select these operations:

| REST operation | Suggested MCP tool name | Why |
|---|---|---|
| `GET /permits` | `list_permits` | Lets the agent list all permit applications |
| `GET /permits/{id}` | `get_permit_by_id` | Lets the agent inspect one permit |
| `POST /permits` | `create_permit` | Lets the agent create a demo permit |

Click **Next**.

Expected:

```text
The selected operations are ready to become MCP tools.
```

---

# 4. Enter MCP server details

Use these values:

| Field | Value |
|---|---|
| Name | `Government Permit MCP Server` |
| Context | `/gov/permit-tools` |
| Version | `1.0.0` |

If APIM asks for an endpoint, use the same backend endpoint from Lab 09:

```text
http://gov-permits-rest.minikube-demo.svc.cluster.local:8080
```

Click **Create**.

Expected:

```text
Government Permit MCP Server is created.
```

---

# 5. Improve tool descriptions

Open the new MCP server in Publisher.

Go to:

```text
API Configurations -> Tools
```

Use clear descriptions.

| Tool | Description |
|---|---|
| `list_permits` | Lists all government permit applications currently stored in the demo registry. Use this when the user asks to see all permits or review permit status. |
| `get_permit_by_id` | Gets one government permit application by permit ID, for example `PERMIT-1001`. Use this when the user asks about a specific permit. |
| `create_permit` | Creates a new demo permit application with citizen name, permit type, and district. Use this only when the user clearly asks to create a permit. |

Expected:

```text
The MCP tools have names and descriptions that an AI agent can understand.
```

---

# 6. Deploy the MCP server

Go to:

```text
Deploy -> Deployments
```

Select the default gateway and click:

```text
Deploy
```

Expected:

```text
The MCP server deployment succeeds.
```

---

# 7. Test with MCP Playground

Go to:

```text
Test -> MCP Playground
```

Click:

```text
Connect
```

Run the `list_permits` tool.

Expected output includes:

```json
{
  "count": 2,
  "permits": [
    {
      "id": "PERMIT-1001",
      "status": "APPROVED"
    }
  ]
}
```

Run the `get_permit_by_id` tool with:

```text
PERMIT-1001
```

Expected:

```text
The tool returns one permit application.
```

---

# 8. Publish the MCP server

Go to:

```text
Publish -> Lifecycle
```

Click:

```text
Publish
```

Expected:

```text
Government Permit MCP Server is published and visible in Developer Portal.
```

---

# 9. Subscribe and get an access token

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
Government Permit MCP Server
```

Subscribe it to:

```text
DefaultApplication
```

Generate a production access token.

Copy these two values from Developer Portal:

| Value | Where to get it |
|---|---|
| MCP server URL | MCP server overview / try-out / invoke information |
| Access token | `DefaultApplication` production keys |

Important:

```text
Use the MCP server URL shown by APIM.
Do not guess the URL.
```

For this local lab, the MCP server URL should use the Lab 07 gateway host:

```text
https://gw.wso2.com:8243
```

---

# 10. Test with MCP Inspector

MCP Inspector is a developer tool for testing MCP servers before connecting an AI agent.

Install Node.js if `npx` is not available.

Check:

```bash
node --version
npx --version
```

Start MCP Inspector:

```bash
npx @modelcontextprotocol/inspector
```

Expected:

```text
MCP Inspector starts and opens a local browser page.
```

In MCP Inspector:

1. Choose **HTTP** or **Streamable HTTP** transport.
2. Paste the MCP server URL from Developer Portal.
3. Add this header:

| Header | Value |
|---|---|
| `Authorization` | `Bearer <paste-access-token-here>` |

4. Click **Connect**.
5. Open **Tools**.
6. Click **List Tools**.

Expected tools:

```text
list_permits
get_permit_by_id
create_permit
```

Call:

```text
list_permits
```

Expected:

```text
The tool returns permit data from the Lab 08 REST service.
```

---

# 11. Lab Complete

Stop here for the main lab.

You have proven:

```text
REST API
  -> APIM MCP server
  -> MCP Inspector
  -> tool call returns permit data
```

This is the clean success point for the workshop.

The MCP server works when:

```text
MCP Inspector connects
List Tools shows list_permits, get_permit_by_id, and create_permit
Calling list_permits returns data from the Lab 08 REST service
```

The next sections are optional.
Use them only if the learner already has VS Code, GitHub Copilot, and Agent Mode ready.

---

# 12. Optional: Configure VS Code Copilot MCP

Open this repository in VS Code.

Create this file:

```text
.vscode/mcp.json
```

You can use this template:

```text
labs/10-mcp-agent/vscode-mcp-template.json
```

Copy the template content into `.vscode/mcp.json`:

```json
{
  "inputs": [
    {
      "type": "promptString",
      "id": "government-permit-mcp-url",
      "description": "Paste the WSO2 MCP server URL from Developer Portal",
      "password": false
    },
    {
      "type": "promptString",
      "id": "government-permit-mcp-token",
      "description": "Paste the access token for the WSO2 MCP server subscription",
      "password": true
    }
  ],
  "servers": {
    "government-permit-mcp": {
      "type": "http",
      "url": "${input:government-permit-mcp-url}",
      "headers": {
        "Authorization": "Bearer ${input:government-permit-mcp-token}"
      }
    }
  }
}
```

Why this uses prompts:

```text
The MCP server URL and access token can change each time users create or regenerate credentials.
The token should not be hard-coded into the repository.
```

---

# 13. Optional: Start the MCP server in VS Code

In VS Code:

1. Open the Command Palette.
2. Run:

```text
MCP: List Servers
```

3. Select:

```text
government-permit-mcp
```

4. Start the server.
5. When prompted, paste:

| Prompt | Value |
|---|---|
| MCP server URL | URL copied from Developer Portal |
| Access token | Token copied from Developer Portal |

Expected:

```text
VS Code shows the MCP server as running.
```

If VS Code shows tool approval prompts, allow the permit tools for this lab.

---

# 14. Optional: Use Copilot Agent Mode

Open Copilot Chat in VS Code.

Switch to:

```text
Agent Mode
```

Try:

```text
Use the government permit MCP tools to list all permit applications.
```

Expected:

```text
Copilot chooses the list permit tool and returns the permits from Lab 08.
```

Try:

```text
Use the government permit MCP tools to show details for permit PERMIT-1001.
```

Expected:

```text
Copilot calls the get permit tool and summarizes the permit.
```

Try:

```text
Create a demo building permit for Sonam Dorji in Paro using the government permit MCP tools.
```

Expected:

```text
Copilot asks for approval if required, calls the create permit tool, and returns the created permit.
```

Verify the new permit through the original REST API:

## Windows PowerShell

```powershell
$TOKEN = "paste-rest-api-access-token-here"
curl.exe -k -H "Authorization: Bearer $TOKEN" https://gw.wso2.com:8243/gov/permits/1.0.0/permits
```

## macOS Terminal

```bash
TOKEN="paste-rest-api-access-token-here"
curl -k -H "Authorization: Bearer $TOKEN" https://gw.wso2.com:8243/gov/permits/1.0.0/permits
```

Expected:

```text
The newly created permit appears in the list.
```

---

# 15. Optional: Convert the GraphQL API

After the REST MCP server works, repeat the same pattern for:

```text
Government Benefit Programs
```

Suggested MCP server details:

| Field | Value |
|---|---|
| Name | `Government Benefits MCP Server` |
| Context | `/gov/benefit-tools` |
| Version | `1.0.0` |
| Backend endpoint | `http://gov-benefits-graphql.minikube-demo.svc.cluster.local:8080/graphql` |

Suggested tools:

```text
list_benefit_programs
get_benefit_program_by_id
```

Suggested prompt:

```text
Use the government benefits MCP tools to list all open benefit programs.
```

---

# Troubleshooting

| Error | Meaning | Fix | Validation |
|---|---|---|---|
| MCP server is not visible in Developer Portal | It is not published yet | In Publisher, go to Lifecycle and publish it | Open Developer Portal and search for the MCP server |
| MCP Inspector cannot connect | Wrong URL, missing token, or Lab 07 port-forward is stopped | Use the URL copied from Developer Portal, add bearer token, restart port-forward | MCP Inspector connects and lists tools |
| `401` or `403` | Token missing, expired, or not subscribed to the MCP server | Regenerate token for the subscribed application | MCP Inspector can call `list_permits` |
| VS Code does not show MCP tools | MCP server is not started or Copilot MCP support is disabled | Run `MCP: List Servers`, start the server, check Copilot settings | Tools appear in Copilot Agent Mode |
| TLS or certificate error | Local APIM uses a self-signed certificate | Accept/trust the local APIM certificate, or use an HTTP MCP endpoint only if APIM shows one for local testing | MCP Inspector or VS Code connects |
| Tool output is empty | Lab 08 service is not running | Run `kubectl get pods -n minikube-demo -l lab=government-services` | Pods show `1/1 Running` |

---

# Cleanup

This lab creates MCP servers in APIM and a local VS Code MCP config file.

To remove MCP servers:

1. Open Publisher.
2. Open each MCP server.
3. Change lifecycle state to **Retire** if required.
4. Delete the MCP server.

To remove the VS Code config:

```text
Delete .vscode/mcp.json
```

To keep using Labs 07, 08, and 09, do not delete their Kubernetes resources.

---

# References

- WSO2 MCP Gateway getting started: https://apim-docs-stg.wso2.com/en/4.6.0/ai-gateway/mcp-gateway/overview/
- WSO2 create MCP server from existing API: https://apim-docs-stg.wso2.com/en/4.6.0/ai-gateway/mcp-gateway/create-from-api/
- WSO2 update, deploy, test, and publish MCP server: https://apim-docs-stg.wso2.com/en/4.6.0/ai-gateway/mcp-gateway/update-and-deploy-mcp-server/
- MCP Inspector: https://modelcontextprotocol.io/docs/tools/inspector
- VS Code MCP servers: https://code.visualstudio.com/docs/agent-customization/mcp-servers
- VS Code MCP configuration reference: https://code.visualstudio.com/docs/agents/reference/mcp-configuration
