# kubectl Cheatsheet

## Cluster

```bash
kubectl cluster-info
kubectl get nodes
kubectl describe node minikube
```

## Pods

```bash
kubectl get pods
kubectl get pods -A
kubectl describe pod <pod-name>
kubectl logs <pod-name>
kubectl logs -f <pod-name>
```

## Deployments

```bash
kubectl get deployments
kubectl describe deployment <deployment-name>
kubectl scale deployment <deployment-name> --replicas=3
```

## Services

```bash
kubectl get svc
kubectl describe svc <service-name>
```

## Namespaces

```bash
kubectl get ns
kubectl create ns minikube-demo
kubectl delete ns minikube-demo
```

## Apply/Delete

```bash
kubectl apply -f <file-or-folder>
kubectl delete -f <file-or-folder>
```
