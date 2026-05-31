param(
    [int]$Cpus = 4,
    [int]$Memory = 8192,
    [string]$DiskSize = "40g"
)

Write-Host "Starting minikube with Docker driver..." -ForegroundColor Cyan
minikube start --driver=docker --cpus=$Cpus --memory=$Memory --disk-size=$DiskSize

Write-Host ""
Write-Host "Checking minikube status..." -ForegroundColor Cyan
minikube status

Write-Host ""
Write-Host "Checking nodes..." -ForegroundColor Cyan
kubectl get nodes

Write-Host ""
Write-Host "Checking all pods..." -ForegroundColor Cyan
kubectl get pods -A
