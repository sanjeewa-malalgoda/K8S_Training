#!/usr/bin/env bash
set -euo pipefail

echo "Enabling ingress..."
minikube addons enable ingress

echo
echo "Enabling metrics-server..."
minikube addons enable metrics-server

echo
echo "Checking ingress controller..."
kubectl get pods -n ingress-nginx

echo
echo "Checking enabled addons..."
minikube addons list
