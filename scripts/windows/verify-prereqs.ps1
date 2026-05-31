Write-Host "Checking Docker..." -ForegroundColor Cyan
docker version

Write-Host ""
Write-Host "Checking minikube..." -ForegroundColor Cyan
minikube version

Write-Host ""
Write-Host "Checking kubectl..." -ForegroundColor Cyan
kubectl version --client

Write-Host ""
Write-Host "Prerequisite check completed." -ForegroundColor Green
