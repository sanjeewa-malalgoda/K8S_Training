# kubectl Cheatsheet

## Cluster

```bash
kubectl cluster-info
kubectl get nodes
kubectl describe node minikube
```

## Pods

```bash
kubectl get pods                                           # Get pods in default namespace
kubectl get pods -A                                        # Get all pods across all namespaces
kubectl get pods -n kube-system                            # List pods in kube-system
```

**Then describe an actual running pod:**

```bash
kubectl describe pod etcd-minikube -n kube-system
kubectl describe pod coredns-7d764666f9-6z4rq -n kube-system
kubectl describe pod storage-provisioner -n kube-system
```

**View pod logs (use actual pod names from `kubectl get pods`):**

```bash
kubectl logs etcd-minikube -n kube-system
kubectl logs coredns-7d764666f9-6z4rq -n kube-system
kubectl logs -f storage-provisioner -n kube-system        # Follow logs live
```

## Deployments

```bash
kubectl get deployments                          # List deployments
kubectl get deployments -n minikube-demo         # List in specific namespace
kubectl describe deployment <NAME> -n <NAMESPACE>  # Use actual deployment name
kubectl scale deployment <NAME> -n <NAMESPACE> --replicas=3
```

## Services

```bash
kubectl get svc                              # List services
kubectl get svc -n minikube-demo             # List in specific namespace
kubectl describe svc <NAME> -n <NAMESPACE>   # Use actual service name
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
