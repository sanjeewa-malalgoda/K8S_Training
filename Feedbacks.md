Feedbacks

In the resource impact section to 06-addons.md we need to do below
Show how to enable it and disable after use. lets disable what is not really need after trying. Add missing details

This need to add configure minikube section in right way to align with what we already have there.
1. Add a Windows Docker/WSL memory setup section before Minikube start:

   * Explain that Docker Desktop may not show a Memory slider when using WSL 2.
   * Add `.wslconfig` instructions:

     ```ini
     [wsl2]
     memory=10GB
     processors=4
     swap=4GB
     ```
   * Then restart WSL/Docker:

     ```powershell
     wsl --shutdown
     ```
   * Start Minikube with:

     ```powershell
     minikube start --driver=docker --cpus=4 --memory=8192 --disk-size=40g
     ```

This need to add to addon document. Add  right way to align with what we already have there.
2. Add an ingress-nginx troubleshooting section for `MK_ADDON_ENABLE` timeout:

   * Do not immediately delete Minikube if ingress enable times out.
   * First check:

     ```powershell
     kubectl get pods -n ingress-nginx
     kubectl get events -n ingress-nginx --sort-by=.lastTimestamp
     ```
   * If controller is `ContainerCreating`, wait up to 10–15 minutes:

     ```powershell
     kubectl wait -n ingress-nginx --for=condition=Ready pod -l app.kubernetes.io/component=controller --timeout=600s
     ```
   * Only reset addon/cluster if the pod shows `ImagePullBackOff`, `CrashLoopBackOff`, or repeated readiness failures.
