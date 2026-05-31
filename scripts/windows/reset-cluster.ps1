Write-Warning "This will delete the current minikube cluster and all workloads."
$confirm = Read-Host "Type DELETE to continue"

if ($confirm -ne "DELETE") {
    Write-Host "Cancelled." -ForegroundColor Yellow
    exit 0
}

minikube delete
minikube start --driver=docker --cpus=4 --memory=8192 --disk-size=40g
minikube addons enable ingress
kubectl get nodes
kubectl get pods -A
kubectl get pods -n ingress-nginx
