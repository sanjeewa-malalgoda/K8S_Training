$ErrorActionPreference = "Stop"

$Namespace = "minikube-demo"
$Deployment = "cloud-citizen-info-mi"
$VolumeName = "mi-carbonapps"
$ClaimName = "mi-carbonapps-pvc"
$MountPath = "/home/wso2carbon/wso2mi-4.6.0/repository/deployment/server/carbonapps"

Write-Host "Finding MI container in deployment/$Deployment ..."
$Container = kubectl get deployment $Deployment -n $Namespace -o jsonpath="{.spec.template.spec.containers[0].name}"

if ([string]::IsNullOrWhiteSpace($Container)) {
    throw "Could not find a container in deployment/$Deployment in namespace $Namespace."
}

Write-Host "Patching deployment/$Deployment container '$Container' with shared carbonapps volume ..."

$Patch = @"
spec:
  template:
    spec:
      volumes:
      - name: $VolumeName
        persistentVolumeClaim:
          claimName: $ClaimName
      containers:
      - name: $Container
        volumeMounts:
        - name: $VolumeName
          mountPath: $MountPath
"@

$PatchFile = New-TemporaryFile
try {
    Set-Content -Path $PatchFile -Value $Patch -NoNewline
    kubectl patch deployment $Deployment -n $Namespace --type strategic --patch-file $PatchFile
}
finally {
    Remove-Item -LiteralPath $PatchFile -Force -ErrorAction SilentlyContinue
}

kubectl rollout status deployment/$Deployment -n $Namespace --timeout=10m
kubectl exec -n $Namespace deployment/$Deployment -- ls -l $MountPath
