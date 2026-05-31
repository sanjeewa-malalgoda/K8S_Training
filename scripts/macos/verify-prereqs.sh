#!/usr/bin/env bash
set -euo pipefail

echo "Checking Docker..."
docker version

echo
echo "Checking minikube..."
minikube version

echo
echo "Checking kubectl..."
kubectl version --client

echo
echo "Prerequisite check completed."
