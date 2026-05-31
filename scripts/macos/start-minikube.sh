#!/usr/bin/env bash
set -euo pipefail

CPUS="${CPUS:-4}"
MEMORY="${MEMORY:-8192}"
DISK_SIZE="${DISK_SIZE:-40g}"

echo "Starting minikube with Docker driver..."
minikube start --driver=docker --cpus="$CPUS" --memory="$MEMORY" --disk-size="$DISK_SIZE"

echo
echo "Checking minikube status..."
minikube status

echo
echo "Checking nodes..."
kubectl get nodes

echo
echo "Checking all pods..."
kubectl get pods -A
