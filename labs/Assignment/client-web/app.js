(function () {
  const config = window.assignmentConfig;
  const sessionState = document.getElementById("sessionState");
  const tokenOutput = document.getElementById("tokenOutput");
  const apiOutput = document.getElementById("apiOutput");

  const authUrl = `${config.issuerBaseUrl.replace(/\/$/, "")}/oauth2/authorize`;
  const tokenUrl = `${config.issuerBaseUrl.replace(/\/$/, "")}/oauth2/token`;

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

    if (!response.ok) {
      apiOutput.textContent = JSON.stringify(payload, null, 2);
      return;
    }

    sessionStorage.setItem("access_token", payload.access_token);
    history.replaceState({}, document.title, config.redirectUri);
    renderSession();
  }

  function renderSession() {
    const token = sessionStorage.getItem("access_token");
    sessionState.textContent = token ? "Signed in" : "Not signed in";
    tokenOutput.textContent = token || "No token yet.";
  }

  async function callApi(withToken) {
    const headers = {};
    const token = sessionStorage.getItem("access_token");

    if (withToken && token) {
      headers.Authorization = `Bearer ${token}`;
    }

    const response = await fetch(config.apiInvokeUrl, { headers });
    const text = await response.text();

    apiOutput.textContent = [
      `HTTP ${response.status}`,
      "",
      text || "(empty response)"
    ].join("\n");
  }

  document.getElementById("signInButton").addEventListener("click", signIn);
  document.getElementById("signOutButton").addEventListener("click", () => {
    sessionStorage.clear();
    renderSession();
    apiOutput.textContent = "Session cleared.";
  });
  document.getElementById("callApiButton").addEventListener("click", () => callApi(true));
  document.getElementById("callApiWithoutTokenButton").addEventListener("click", () => callApi(false));

  finishLogin().catch((error) => {
    apiOutput.textContent = error.stack || String(error);
  });
}());
