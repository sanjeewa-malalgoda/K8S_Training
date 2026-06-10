/**
 * Copyright (c) 2021, WSO2 Inc. (http://www.wso2.org) All Rights Reserved.
 *
 * WSO2 Inc. licenses this file to you under the Apache License,
 * Version 2.0 (the "License"); you may not use this file except
 * in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied. See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */

import { BasicUserInfo, Hooks, useAuthContext } from "@asgardeo/auth-react";
import React, { FunctionComponent, ReactElement, useCallback, useEffect, useState } from "react";
import { default as authConfig } from "../config.json";
import { DefaultLayout } from "../layouts/default";
import { useLocation } from "react-router-dom";
import { LogoutRequestDenied } from "../components/LogoutRequestDenied";
import { USER_DENIED_LOGOUT } from "../constants/errors";

interface DerivedState {
    authenticateResponse: BasicUserInfo,
    idToken: string[],
    decodedIdTokenHeader: Record<string, string | number | boolean>,
    decodedIDTokenPayload: Record<string, string | number | boolean>;
}

const navItems = [ "Overview", "Customers", "Projects", "Security", "Audit", "Session Details" ];

const getDisplayValue = (value: unknown, fallback: string = "Not available"): string => {
    if (Array.isArray(value)) {
        return value.join(", ");
    }

    if (typeof value === "object") {
        return JSON.stringify(value, null, 2);
    }

    if (value === undefined || value === null || value === "") {
        return fallback;
    }

    return String(value);
};

/**
 * Home page for the Sample.
 *
 * @param props - Props injected to the component.
 *
 * @return {React.ReactElement}
 */
export const HomePage: FunctionComponent = (): ReactElement => {

    const {
        state,
        signIn,
        signOut,
        getBasicUserInfo,
        getIDToken,
        getDecodedIDToken,
        on
    } = useAuthContext();

    const [ derivedAuthenticationState, setDerivedAuthenticationState ] = useState<DerivedState>(null);
    const [ hasAuthenticationErrors, setHasAuthenticationErrors ] = useState<boolean>(false);
    const [ hasLogoutFailureError, setHasLogoutFailureError ] = useState<boolean>();
    const [ activeNavItem, setActiveNavItem ] = useState<string>("Overview");

    const search = useLocation().search;
    const stateParam = new URLSearchParams(search).get('state');
    const errorDescParam = new URLSearchParams(search).get('error_description');

    useEffect(() => {

        if (!state?.isAuthenticated) {
            return;
        }

        (async (): Promise<void> => {
            const basicUserInfo = await getBasicUserInfo();
            const idToken = await getIDToken();
            const decodedIDToken = await getDecodedIDToken();

            const derivedState: DerivedState = {
                authenticateResponse: basicUserInfo,
                idToken: idToken.split("."),
                decodedIdTokenHeader: JSON.parse(atob(idToken.split(".")[0])),
                decodedIDTokenPayload: decodedIDToken
            };

            setDerivedAuthenticationState(derivedState);
        })();
    }, [ state.isAuthenticated , getBasicUserInfo, getIDToken, getDecodedIDToken ]);

    useEffect(() => {
        if(stateParam && errorDescParam) {
            if(errorDescParam === "End User denied the logout request") {
                setHasLogoutFailureError(true);
            }
        }
    }, [stateParam, errorDescParam]);

    const handleLogin = useCallback(() => {
        setHasLogoutFailureError(false);
        signIn()
            .catch(() => setHasAuthenticationErrors(true));
    }, [ signIn ]);

   /**
     * handles the error occurs when the logout consent page is enabled
     * and the user clicks 'NO' at the logout consent page
     */
    useEffect(() => {
        on(Hooks.SignOut, () => {
            setHasLogoutFailureError(false);
        });

        on(Hooks.SignOutFailed, () => {
            if(!errorDescParam) {
                handleLogin();
            }
        })
    }, [ on, handleLogin, errorDescParam]);

    const handleLogout = () => {
        signOut();
    };

    const userInfo = derivedAuthenticationState?.authenticateResponse ?? {};
    const idTokenPayload = derivedAuthenticationState?.decodedIDTokenPayload ?? {};
    const idTokenHeader = derivedAuthenticationState?.decodedIdTokenHeader ?? {};
    const idTokenSegments = derivedAuthenticationState?.idToken ?? [];
    const displayName = getDisplayValue(
        userInfo["displayName"] || userInfo["username"] || idTokenPayload["name"] || idTokenPayload["preferred_username"],
        "Corlence user"
    );
    const email = getDisplayValue(userInfo["email"] || idTokenPayload["email"]);
    const username = getDisplayValue(userInfo["username"] || idTokenPayload["preferred_username"]);
    const subject = getDisplayValue(userInfo["sub"] || idTokenPayload["sub"]);
    const tenantDomain = getDisplayValue(userInfo["tenantDomain"] || idTokenPayload["tenantDomain"]);
    const allowedScopes = getDisplayValue(userInfo["allowedScopes"] || idTokenPayload["scope"], "openid profile email");
    const issuer = getDisplayValue(idTokenPayload["iss"]);
    const audience = getDisplayValue(idTokenPayload["aud"]);
    const issuedAt = idTokenPayload["iat"]
        ? new Date(Number(idTokenPayload["iat"]) * 1000).toLocaleString()
        : "Not available";
    const expiresAt = idTokenPayload["exp"]
        ? new Date(Number(idTokenPayload["exp"]) * 1000).toLocaleString()
        : "Not available";

    // If `clientID` is not defined in `config.json`, show a UI warning.
    if (!authConfig?.clientID) {

        return (
            <div className="content">
                <h2>Corlence needs a client ID.</h2>
                <p>Update <code>src/config.json</code> with the registered application client ID.</p>
            </div>
        );
    }

    if (hasLogoutFailureError) {
        return (
            <LogoutRequestDenied
                errorMessage={USER_DENIED_LOGOUT}
                handleLogin={handleLogin}
                handleLogout={handleLogout}
            />
        );
    }

    return (
        <DefaultLayout
            isLoading={ state.isLoading }
            hasErrors={ hasAuthenticationErrors }
        >
            {
                state.isAuthenticated
                    ? (
                        <div className="app-shell">
                            <aside className="sidebar">
                                <div className="brand-lockup">
                                    <div className="brand-mark">C</div>
                                    <div>
                                        <div className="brand-name">Corlence</div>
                                        <div className="brand-section">Identity Console</div>
                                    </div>
                                </div>
                                <nav className="nav-menu" aria-label="Main navigation">
                                    {
                                        navItems.map((item: string) => (
                                            <button
                                                key={ item }
                                                className={ `nav-item ${activeNavItem === item ? "active" : ""}` }
                                                onClick={ () => setActiveNavItem(item) }
                                                type="button"
                                            >
                                                { item }
                                            </button>
                                        ))
                                    }
                                </nav>
                                <div className="sidebar-footer">
                                    <div className="sidebar-label">Signed in as</div>
                                    <div className="sidebar-user">{ username }</div>
                                </div>
                            </aside>

                            <main className="workspace">
                                <header className="topbar">
                                    <div>
                                        <p className="eyebrow">{ activeNavItem }</p>
                                        <h1>Welcome back, { displayName }</h1>
                                    </div>
                                    <div className="topbar-actions">
                                        <div className="profile-chip">
                                            <div className="profile-avatar">{ displayName.charAt(0).toUpperCase() }</div>
                                            <div>
                                                <strong>{ displayName }</strong>
                                                <span>{ email !== "Not available" ? email : username }</span>
                                            </div>
                                        </div>
                                        <button
                                            className="btn secondary"
                                            onClick={ () => {
                                                handleLogout();
                                            } }
                                            type="button"
                                        >
                                            Sign out
                                        </button>
                                    </div>
                                </header>

                                {
                                    activeNavItem === "Session Details"
                                        ? (
                                            <section className="session-details">
                                                <div className="panel full-width">
                                                    <h2>Login Session Details</h2>
                                                    <div className="session-section">
                                                        <h3>Auth State</h3>
                                                        <div className="claims-grid">
                                                            {
                                                                Object.entries(state).map(([ key, value ]) => (
                                                                    <div className="claim-item" key={ key }>
                                                                        <span>{ key }</span>
                                                                        <strong>{ getDisplayValue(value) }</strong>
                                                                    </div>
                                                                ))
                                                            }
                                                        </div>
                                                    </div>

                                                    <div className="session-section">
                                                        <h3>Basic User Info</h3>
                                                        <div className="claims-grid">
                                                            {
                                                                Object.entries(userInfo).map(([ key, value ]) => (
                                                                    <div className="claim-item" key={ key }>
                                                                        <span>{ key }</span>
                                                                        <strong>{ getDisplayValue(value) }</strong>
                                                                    </div>
                                                                ))
                                                            }
                                                        </div>
                                                    </div>

                                                    <div className="session-section">
                                                        <h3>ID Token Header</h3>
                                                        <div className="claims-grid">
                                                            {
                                                                Object.entries(idTokenHeader).map(([ key, value ]) => (
                                                                    <div className="claim-item" key={ key }>
                                                                        <span>{ key }</span>
                                                                        <strong>{ getDisplayValue(value) }</strong>
                                                                    </div>
                                                                ))
                                                            }
                                                        </div>
                                                    </div>

                                                    <div className="session-section">
                                                        <h3>ID Token Payload</h3>
                                                        <div className="claims-grid">
                                                            {
                                                                Object.entries(idTokenPayload).map(([ key, value ]) => (
                                                                    <div className="claim-item" key={ key }>
                                                                        <span>{ key }</span>
                                                                        <strong>{ getDisplayValue(value) }</strong>
                                                                    </div>
                                                                ))
                                                            }
                                                        </div>
                                                    </div>

                                                    <div className="session-section">
                                                        <h3>Encoded ID Token</h3>
                                                        <div className="token-segments">
                                                            {
                                                                idTokenSegments.map((segment: string, index: number) => (
                                                                    <div className="token-segment" key={ index }>
                                                                        <span>Segment { index + 1 }</span>
                                                                        <code>{ segment }</code>
                                                                    </div>
                                                                ))
                                                            }
                                                        </div>
                                                    </div>
                                                </div>
                                            </section>
                                        )
                                        : (
                                            <>
                                                <section className="metric-grid">
                                                    <div className="metric-card">
                                                        <span>Status</span>
                                                        <strong>Authenticated</strong>
                                                    </div>
                                                    <div className="metric-card">
                                                        <span>Session</span>
                                                        <strong>OIDC Code Flow</strong>
                                                    </div>
                                                    <div className="metric-card">
                                                        <span>Scopes</span>
                                                        <strong>{ allowedScopes }</strong>
                                                    </div>
                                                </section>

                                                <section className="dashboard-grid">
                                                    <div className="panel user-panel">
                                                        <div className="avatar">{ displayName.charAt(0).toUpperCase() }</div>
                                                        <div>
                                                            <h2>{ displayName }</h2>
                                                            <p>{ email }</p>
                                                            <div className="tag-row">
                                                                <span className="tag">Active</span>
                                                                <span className="tag">SSO</span>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <div className="panel">
                                                        <h2>Account Details</h2>
                                                        <dl className="detail-list">
                                                            <div>
                                                                <dt>Username</dt>
                                                                <dd>{ username }</dd>
                                                            </div>
                                                            <div>
                                                                <dt>Email</dt>
                                                                <dd>{ email }</dd>
                                                            </div>
                                                            <div>
                                                                <dt>Subject</dt>
                                                                <dd>{ subject }</dd>
                                                            </div>
                                                            <div>
                                                                <dt>Tenant</dt>
                                                                <dd>{ tenantDomain }</dd>
                                                            </div>
                                                        </dl>
                                                    </div>

                                                    <div className="panel">
                                                        <h2>Token Details</h2>
                                                        <dl className="detail-list">
                                                            <div>
                                                                <dt>Issuer</dt>
                                                                <dd>{ issuer }</dd>
                                                            </div>
                                                            <div>
                                                                <dt>Audience</dt>
                                                                <dd>{ audience }</dd>
                                                            </div>
                                                            <div>
                                                                <dt>Issued</dt>
                                                                <dd>{ issuedAt }</dd>
                                                            </div>
                                                            <div>
                                                                <dt>Expires</dt>
                                                                <dd>{ expiresAt }</dd>
                                                            </div>
                                                        </dl>
                                                    </div>

                                                    <div className="panel full-width">
                                                        <h2>Identity Claims</h2>
                                                        <div className="claims-grid">
                                                            {
                                                                Object.entries(idTokenPayload).map(([ key, value ]) => (
                                                                    <div className="claim-item" key={ key }>
                                                                        <span>{ key }</span>
                                                                        <strong>{ getDisplayValue(value) }</strong>
                                                                    </div>
                                                                ))
                                                            }
                                                        </div>
                                                    </div>
                                                </section>
                                            </>
                                        )
                                }
                            </main>
                        </div>
                    )
                    : (
                        <div className="login-screen">
                            <div className="login-panel">
                                <div className="brand-lockup login-brand">
                                    <div className="brand-mark">C</div>
                                    <div>
                                        <div className="brand-name">Corlence</div>
                                        <div className="brand-section">Secure Workspace</div>
                                    </div>
                                </div>
                                <h1>Sign in to Corlence</h1>
                                <p>
                                    Access your workspace, user profile, and security context with your organization account.
                                </p>
                                <button
                                    className="btn primary"
                                    onClick={ () => {
                                        handleLogin();
                                    } }
                                    type="button"
                                >
                                    Sign in
                                </button>
                            </div>
                        </div>
                    )
            }
        </DefaultLayout>
    );
};
