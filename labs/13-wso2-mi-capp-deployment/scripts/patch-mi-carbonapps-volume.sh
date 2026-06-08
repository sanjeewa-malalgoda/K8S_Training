#!/usr/bin/env bash
set -euo pipefail

NAMESPACE="minikube-demo"
DEPLOYMENT="cloud-citizen-info-mi"
VOLUME_NAME="mi-carbonapps"
CLAIM_NAME="mi-carbonapps-pvc"
MOUNT_PATH="/home/wso2carbon/wso2mi-4.6.0/repository/deployment/server/carbonapps"

echo "Finding MI container in deployment/$DEPLOYMENT ..."
CONTAINER="$(kubectl get deployment "$DEPLOYMENT" -n "$NAMESPACE" -o jsonpath='{.spec.template.spec.containers[0].name}')"

if [ -z "$CONTAINER" ]; then
  echo "Could not find a container in deployment/$DEPLOYMENT in namespace $NAMESPACE." >&2
  exit 1
fi

echo "Patching deployment/$DEPLOYMENT container '$CONTAINER' with shared carbonapps volume ..."

PATCH_FILE="$(mktemp)"
trap 'rm -f "$PATCH_FILE"' EXIT

cat > "$PATCH_FILE" <<EOF
spec:
  template:
    spec:
      volumes:
      - name: $VOLUME_NAME
        persistentVolumeClaim:
          claimName: $CLAIM_NAME
      containers:
      - name: $CONTAINER
        volumeMounts:
        - name: $VOLUME_NAME
          mountPath: $MOUNT_PATH
EOF

kubectl patch deployment "$DEPLOYMENT" -n "$NAMESPACE" --type strategic --patch-file "$PATCH_FILE"
kubectl rollout status "deployment/$DEPLOYMENT" -n "$NAMESPACE" --timeout=10m
kubectl exec -n "$NAMESPACE" "deployment/$DEPLOYMENT" -- ls -l "$MOUNT_PATH"
  