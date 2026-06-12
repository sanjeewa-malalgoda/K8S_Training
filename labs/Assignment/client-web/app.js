(function () {
  const config = window.assignmentConfig;
  const sessionState = document.getElementById("sessionState");
  const userName = document.getElementById("userName");
  const userSubject = document.getElementById("userSubject");
  const tokenSource = document.getElementById("tokenSource");
  const tokenOutput = document.getElementById("tokenOutput");
  const loginOutput = document.getElementById("loginOutput");
  const apimTokenOutput = document.getElementById("apimTokenOutput");
  const apiOutput = document.getElementById("apiOutput");
  const applicationsTable = document.getElementById("applicationsTable");
  const isFlowState = document.getElementById("isFlowState");
  const apimFlowState = document.getElementById("apimFlowState");
  const gatewayFlowState = document.getElementById("gatewayFlowState");
  const backendFlowState = document.getElementById("backendFlowState");
  const totalApplications = document.getElementById("totalApplications");
  const approvedApplications = document.getElementById("approvedApplications");
  const reviewApplications = document.getElementById("reviewApplications");
  const submittedApplications = document.getElementById("submittedApplications");
  const lastApiStatus = document.getElementById("lastApiStatus");
  const operationPanel = document.getElementById("operationPanel");
  const operationTitle = document.getElementById("operationTitle");
  const operationMessage = document.getElementById("operationMessage");
  const callApiButton = document.getElementById("callApiButton");
  const callApiWithoutTokenButton = document.getElementById("callApiWithoutTokenButton");

  const authUrl = `${config.issuerBaseUrl.replace(/\/$/, "")}/oauth2/authorize`;
  const tokenUrl = `${config.issuerBaseUrl.replace(/\/$/, "")}/oauth2/token`;
  const logoutUrl = `${config.issuerBaseUrl.replace(/\/$/, "")}/oidc/logout`;
  const apimTokenUrl = config.apimTokenUrl || "https://gw.wso2.com:8243/token";

  function base64UrlEncode(buffer) {
    return btoa(String.fromCharCode(...new Uint8Array(buffer)))
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/, "");
  }

  async function sha256(value) {
    return crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  }

  function randomString() {
    const values = new Uint8Array(32);
    crypto.getRandomValues(values);
    return base64UrlEncode(values);
  }

  function decodeJwt(token) {
    if (!token || token.split(".").length < 2) {
      return {};
    }

    const payload = token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
    const padded = payload.padEnd(payload.length + ((4 - payload.length % 4) % 4), "=");

    try {
      return JSON.parse(decodeURIComponent(escape(atob(padded))));
    } catch (_error) {
      return {};
    }
  }

  function maskToken(token) {
    if (!token) {
      return "Not available";
    }

    if (token.length <= 24) {
      return token;
    }

    return `${token.slice(0, 12)}...${token.slice(-8)}`;
  }

  function formatTime(epochSeconds) {
    if (!epochSeconds) {
      return "Not available";
    }

    return new Date(epochSeconds * 1000).toLocaleString();
  }

  function setText(element, value) {
    if (element) {
      element.textContent = value;
    }
  }

  function formatJson(value) {
    return JSON.stringify(value, null, 2);
  }

  function setOperation(title, message, state) {
    setText(operationTitle, title);
    setText(operationMessage, message);

    if (operationPanel) {
      operationPanel.className = `status-panel ${state || ""}`.trim();
    }
  }

  function isExpiredJwt(token) {
    const claims = decodeJwt(token);

    if (!claims.exp) {
      return false;
    }

    const refreshSkewSeconds = 30;
    return claims.exp <= Math.floor(Date.now() / 1000) + refreshSkewSeconds;
  }

  async function signIn() {
    if (!config.clientId || config.clientId.includes("PASTE_")) {
      apiOutput.textContent = "Update client-web/config.js with the SPA client ID from WSO2 Identity Server.";
      return;
    }

    const verifier = randomString();
    const state = randomString();
    const challenge = base64UrlEncode(await sha256(verifier));

    sessionStorage.setItem("pkce_verifier", verifier);
    sessionStorage.setItem("oauth_state", state);

    const params = new URLSearchParams({
      response_type: "code",
      client_id: config.clientId,
      redirect_uri: config.redirectUri,
      scope: config.scope,
      state,
      code_challenge: challenge,
      code_challenge_method: "S256"
    });

    if (config.forceLoginPrompt !== false) {
      params.set("prompt", "login");
    }

    window.location.href = `${authUrl}?${params.toString()}`;
  }

  async function finishLogin() {
    const url = new URL(window.location.href);
    const code = url.searchParams.get("code");
    const returnedState = url.searchParams.get("state");

    if (!code) {
      renderSession();
      return;
    }

    if (returnedState !== sessionStorage.getItem("oauth_state")) {
      apiOutput.textContent = "Returned OAuth state did not match the browser session.";
      return;
    }

    const body = new URLSearchParams({
      grant_type: "authorization_code",
      code,
      redirect_uri: config.redirectUri,
      client_id: config.clientId,
      code_verifier: sessionStorage.getItem("pkce_verifier")
    });

    const response = await fetch(tokenUrl, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body
    });

    const payload = await response.json();
    loginOutput.textContent = formatJson(payload);

    if (!response.ok) {
      apiOutput.textContent = JSON.stringify(payload, null, 2);
      return;
    }

    sessionStorage.setItem("access_token", payload.access_token);

    if (payload.id_token) {
      sessionStorage.setItem("id_token", payload.id_token);
    }

    history.replaceState({}, document.title, config.redirectUri);
    renderSession();
  }

  function renderSession() {
    const isToken = sessionStorage.getItem("access_token");
    const idToken = sessionStorage.getItem("id_token");
    const apimToken = getConfiguredApimToken() || sessionStorage.getItem("apim_access_token");
    const configuredApimTokenExpired = hasValue(config.apimAccessToken) && isExpiredJwt(config.apimAccessToken);
    const cachedApimTokenExpired = Boolean(sessionStorage.getItem("apim_access_token")) &&
      isExpiredJwt(sessionStorage.getItem("apim_access_token"));
    const isClaims = decodeJwt(idToken || isToken);
    const apimClaims = decodeJwt(apimToken);
    const displayName = isClaims.name || isClaims.given_name || isClaims.preferred_username || isClaims.username || isClaims.sub;

    userName.textContent = displayName || "Not signed in";
    userSubject.textContent = isClaims.sub ? `Subject: ${isClaims.sub}` : "No IS session";
    tokenSource.textContent = apimToken
      ? (isToken ? "APIM token ready" : "APIM token ready; IS sign-in still required")
      : "No APIM token";
    setText(isFlowState, isToken ? "Signed in" : "Waiting");
    setText(apimFlowState, apimToken ? "Ready" : "Waiting");

    if (isToken && apimToken) {
      sessionState.textContent = "Signed in with IS; APIM token ready";
      tokenOutput.textContent = buildSessionDetails(isClaims, apimClaims, isToken, apimToken, configuredApimTokenExpired, cachedApimTokenExpired);
      return;
    }

    if (apimToken) {
      sessionState.textContent = "APIM token ready; sign in with IS";
      tokenOutput.textContent = buildSessionDetails(isClaims, apimClaims, isToken, apimToken, configuredApimTokenExpired, cachedApimTokenExpired);
      return;
    }

    sessionState.textContent = isToken ? "Signed in with IS" : "No token";
    tokenOutput.textContent = buildSessionDetails(isClaims, apimClaims, isToken, apimToken, configuredApimTokenExpired, cachedApimTokenExpired);
  }

  function buildSessionDetails(isClaims, apimClaims, isToken, apimToken, configuredApimTokenExpired, cachedApimTokenExpired) {
    return [
      "IS session",
      `User: ${isClaims.name || isClaims.preferred_username || isClaims.username || isClaims.sub || "Not signed in"}`,
      `Email: ${isClaims.email || "Not available"}`,
      `Subject: ${isClaims.sub || "Not available"}`,
      `Issuer: ${isClaims.iss || "Not available"}`,
      `Expires: ${formatTime(isClaims.exp)}`,
      `IS access token: ${maskToken(isToken)}`,
      "",
      "APIM API token",
      `Token: ${maskToken(apimToken)}`,
      `Issuer: ${apimClaims.iss || "Not available"}`,
      `Client ID: ${apimClaims.client_id || apimClaims.azp || "Not available"}`,
      `Scope: ${apimClaims.scope || "Not available"}`,
      `Expires: ${formatTime(apimClaims.exp)}`,
      `Configured token expired: ${configuredApimTokenExpired ? "yes" : "no"}`,
      `Cached token expired: ${cachedApimTokenExpired ? "yes" : "no"}`
    ].join("\n");
  }

  function hasValue(value) {
    return Boolean(value && !value.includes("PASTE_"));
  }

  function getConfiguredApimToken() {
    if (!hasValue(config.apimAccessToken)) {
      return "";
    }

    return isExpiredJwt(config.apimAccessToken) ? "" : config.apimAccessToken;
  }

  function signOut() {
    const idToken = sessionStorage.getItem("id_token");
    sessionStorage.clear();
    renderSession();

    if (!idToken) {
      apiOutput.textContent = "Signed out locally. No IS ID token was available for server logout.";
      return;
    }

    const params = new URLSearchParams({
      id_token_hint: idToken,
      post_logout_redirect_uri: config.redirectUri
    });

    window.location.href = `${logoutUrl}?${params.toString()}`;
  }

  async function getApimAccessToken() {
    const configuredToken = getConfiguredApimToken();

    if (configuredToken) {
      return configuredToken;
    }

    const cachedToken = sessionStorage.getItem("apim_access_token");

    if (cachedToken && !isExpiredJwt(cachedToken)) {
      return cachedToken;
    }

    sessionStorage.removeItem("apim_access_token");

    if (!hasValue(config.apimConsumerKey) || !hasValue(config.apimConsumerSecret)) {
      return "";
    }

    const credentials = btoa(`${config.apimConsumerKey}:${config.apimConsumerSecret}`);
    let response;

    try {
      response = await fetch(apimTokenUrl, {
        method: "POST",
        headers: {
          Authorization: `Basic ${credentials}`,
          "Content-Type": "application/x-www-form-urlencoded"
        },
        body: new URLSearchParams({ grant_type: "client_credentials" })
      });
    } catch (error) {
      throw new Error([
        "Browser could not request an APIM access token.",
        "",
        "Check these in order:",
        "1. kubectl port-forward -n wso2 svc/assignment-apim 8243:8243 is running.",
        "2. gw.wso2.com resolves to 127.0.0.1 in your hosts file.",
        "3. Open https://gw.wso2.com:8243/token once and accept the local certificate warning.",
        "4. Refresh this app after accepting the certificate.",
        "",
        `Original error: ${error.message}`
      ].join("\n"));
    }

    const payload = await response.json();
    apimTokenOutput.textContent = formatJson(payload);

    if (!response.ok) {
      throw new Error(JSON.stringify(payload, null, 2));
    }

    sessionStorage.setItem("apim_access_token", payload.access_token);
    return payload.access_token;
  }

  function readXmlText(element, tagName) {
    return element.getElementsByTagName(tagName)[0]?.textContent || "";
  }

  function parseApplicationsXml(xmlText) {
    const documentXml = new DOMParser().parseFromString(xmlText, "application/xml");
    const parserError = documentXml.getElementsByTagName("parsererror")[0];

    if (parserError) {
      return [];
    }

    return Array.from(documentXml.getElementsByTagName("application")).map((application) => ({
      applicationId: readXmlText(application, "applicationId"),
      citizenId: readXmlText(application, "citizenId"),
      serviceName: readXmlText(application, "serviceName"),
      status: readXmlText(application, "status"),
      submittedDate: readXmlText(application, "submittedDate").replace("+00:00", ""),
      departmentName: readXmlText(application, "departmentName"),
      departmentCode: readXmlText(application, "departmentCode")
    }));
  }

  function statusClass(status) {
    if (status === "APPROVED") {
      return "approved";
    }

    if (status === "IN_REVIEW") {
      return "review";
    }

    return "submitted";
  }

  function escapeHtml(value) {
    return String(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function renderApplications(xmlText) {
    const applications = parseApplicationsXml(xmlText);

    if (!applications.length) {
      applicationsTable.className = "empty-state";
      applicationsTable.textContent = "No application records found in the response.";
      updateMetrics([]);
      return;
    }

    updateMetrics(applications);
    applicationsTable.className = "table-wrap";
    applicationsTable.innerHTML = `
      <table>
        <thead>
          <tr>
            <th>ID</th>
            <th>Citizen ID</th>
            <th>Service</th>
            <th>Status</th>
            <th>Submitted</th>
            <th>Department</th>
          </tr>
        </thead>
        <tbody>
          ${applications.map((application) => `
            <tr>
              <td>${escapeHtml(application.applicationId)}</td>
              <td>${escapeHtml(application.citizenId)}</td>
              <td>${escapeHtml(application.serviceName)}</td>
              <td><span class="status ${statusClass(application.status)}">${escapeHtml(application.status)}</span></td>
              <td>${escapeHtml(application.submittedDate)}</td>
              <td>${escapeHtml(application.departmentName)} (${escapeHtml(application.departmentCode)})</td>
            </tr>
          `).join("")}
        </tbody>
      </table>
    `;
  }

  function updateMetrics(applications) {
    const approved = applications.filter((application) => application.status === "APPROVED").length;
    const inReview = applications.filter((application) => application.status === "IN_REVIEW").length;
    const submitted = applications.filter((application) => application.status === "SUBMITTED").length;

    totalApplications.textContent = String(applications.length);
    approvedApplications.textContent = String(approved);
    reviewApplications.textContent = String(inReview);
    submittedApplications.textContent = String(submitted);
  }

  async function callApi(withToken) {
    const headers = {};

    if (withToken) {
      if (!sessionStorage.getItem("access_token")) {
        apiOutput.textContent = "Sign in with IS first. The API call will still use an APIM-issued token.";
        setOperation("IS sign-in required", "Sign in with IS first. After that, the API call will use the APIM token.", "warning");
        setText(isFlowState, "Required");
        return;
      }

      const token = await getApimAccessToken();

      if (!token) {
        apiOutput.textContent = "Add an APIM access token or APIM consumer key/secret in client-web/config.js.";
        setOperation("APIM token missing", "Add an APIM access token or APIM consumer key/secret in client-web/config.js.", "error");
        setText(apimFlowState, "Missing");
        return;
      }

      headers.Authorization = `Bearer ${token}`;
      setText(apimFlowState, "Ready");
      renderSession();
    }

    let response;

    try {
      response = await fetch(config.apiInvokeUrl, { headers });
    } catch (error) {
      throw new Error([
        "Browser could not reach APIM Gateway.",
        "",
        "Check these in order:",
        "1. kubectl port-forward -n wso2 svc/assignment-apim 8243:8243 is running.",
        "2. gw.wso2.com resolves to 127.0.0.1 in your hosts file.",
        "3. Open https://gw.wso2.com:8243 once and accept the local certificate warning.",
        "4. Refresh this app after accepting the certificate.",
        "",
        `Original error: ${error.message}`
      ].join("\n"));
    }

    const text = await response.text();
    setText(gatewayFlowState, `HTTP ${response.status}`);
    setText(lastApiStatus, `HTTP ${response.status}`);
    const details = response.status === 401
      ? [
          `HTTP ${response.status}`,
          "",
          text || "(empty response)",
          "",
          "APIM rejected the API token. The usual causes are:",
          "1. The APIM token is expired.",
          "2. The token was generated for a different APIM application.",
          "3. The APIM application is not subscribed to this API.",
          "",
          "Use Sign out to clear the cached token, or remove/replace apimAccessToken in config.js so the app can fetch a fresh token from CK/CS."
        ]
      : [
          `HTTP ${response.status}`,
          "",
          text || "(empty response)"
        ];

    apiOutput.textContent = details.join("\n");

    if (response.ok) {
      renderApplications(text);
      setOperation("API call succeeded", `Loaded application records through APIM Gateway. Status: HTTP ${response.status}.`, "success");
      setText(backendFlowState, "Loaded");
    } else {
      applicationsTable.className = "empty-state";
      applicationsTable.textContent = "No application data loaded.";
      updateMetrics([]);
      setOperation("API call failed", `Gateway returned HTTP ${response.status}. Open Raw API Response for details.`, "error");
      setText(backendFlowState, "No data");
    }
  }

  document.getElementById("signInButton").addEventListener("click", signIn);
  document.getElementById("signOutButton").addEventListener("click", signOut);
  callApiButton.addEventListener("click", () => {
    callApiButton.disabled = true;
    callApiButton.textContent = "Calling...";
    setOperation("Calling secured API", "Sending an APIM bearer token to the gateway.", "");
    callApi(true).catch((error) => {
      apiOutput.textContent = error.stack || String(error);
      setOperation("API call failed", error.message || String(error), "error");
    }).finally(() => {
      callApiButton.disabled = false;
      callApiButton.textContent = "Call secured API";
    });
  });
  callApiWithoutTokenButton.addEventListener("click", () => {
    callApiWithoutTokenButton.disabled = true;
    callApiWithoutTokenButton.textContent = "Calling...";
    setOperation("Calling without token", "This should be rejected by APIM and proves the API is protected.", "");
    callApi(false).catch((error) => {
      apiOutput.textContent = error.stack || String(error);
      setOperation("API call failed", error.message || String(error), "error");
    }).finally(() => {
      callApiWithoutTokenButton.disabled = false;
      callApiWithoutTokenButton.textContent = "Call without token";
    });
  });

  finishLogin().catch((error) => {
    apiOutput.textContent = error.stack || String(error);
  });
}());
