Write-Host "Enabling ingress..." -ForegroundColor Cyan
minikube addons enable ingress

Write-Host ""
Write-Host "Enabling metrics-server..." -ForegroundColor Cyan
minikube addons enable metrics-server

Write-Host ""
Write-Host "Checking ingress controller..." -ForegroundColor Cyan
kubectl get pods -n ingress-nginx

Write-Host ""
Write-Host "Checking enabled addons..." -ForegroundColor Cyan
minikube addons list
