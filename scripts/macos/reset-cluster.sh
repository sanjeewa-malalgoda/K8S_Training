#!/usr/bin/env bash
set -euo pipefail

echo "WARNING: This will delete the current minikube cluster and all workloads."
read -r -p "Type DELETE to continue: " CONFIRM

if [[ "$CONFIRM" != "DELETE" ]]; then
  echo "Cancelled."
  exit 0
fi

minikube delete
minikube start --driver=docker --cpus=4 --memory=8192 --disk-size=40g
minikube addons enable ingress
kubectl get nodes
kubectl get pods -A
kubectl get pods -n ingress-nginx
