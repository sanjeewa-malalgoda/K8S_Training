package com.example.mi.mediator;

import org.apache.synapse.MessageContext;
import org.apache.synapse.mediators.AbstractMediator;

/**
 * Small custom mediator used by Lab 15.
 * It enriches the Synapse message context with audit properties.
 */
public class CitizenAuditMediator extends AbstractMediator {

    private static final String DEFAULT_AGENCY_CODE = "BT-GOV";

    private String agencyCode = DEFAULT_AGENCY_CODE;

    @Override
    public boolean mediate(MessageContext context) {
        String citizenId = valueOrDefault(context.getProperty("uri.var.id"), "UNKNOWN");
        String podName = valueOrDefault(System.getenv("HOSTNAME"), "local-mi");
        int riskScore = calculateRiskScore(citizenId);
        String decision = riskScore >= 70 ? "REVIEW_REQUIRED" : "AUTO_APPROVED";

        context.setProperty("citizen.audit.id", citizenId);
        context.setProperty("citizen.audit.agency", agencyCode);
        context.setProperty("citizen.audit.riskScore", Integer.toString(riskScore));
        context.setProperty("citizen.audit.decision", decision);
        context.setProperty("citizen.audit.handledByPod", podName);

        getLog(context).auditLog("CitizenAuditMediator enriched request for " + citizenId
                + " with decision " + decision + " and score " + riskScore);
        return true;
    }

    public void setAgencyCode(String agencyCode) {
        if (agencyCode != null && !agencyCode.isBlank()) {
            this.agencyCode = agencyCode;
        }
    }

    private int calculateRiskScore(String citizenId) {
        int checksum = 0;
        for (int i = 0; i < citizenId.length(); i++) {
            checksum += citizenId.charAt(i);
        }
        return 10 + Math.abs(checksum % 80);
    }

    private String valueOrDefault(Object value, String fallback) {
        if (value == null) {
            return fallback;
        }
        String text = value.toString();
        return text.isBlank() ? fallback : text;
    }
}
