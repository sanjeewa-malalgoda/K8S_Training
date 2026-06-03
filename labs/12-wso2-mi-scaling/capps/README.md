# CApp Folder

This folder contains the demo WSO2 CApp file for Lab 12:

```text
CitizenInfoCompositeExporter_1.0.0.car
```

Expected path from the repository root:

```text
labs/12-wso2-mi-scaling/capps/CitizenInfoCompositeExporter_1.0.0.car
```

The lab copies this `.car` file into a Kubernetes PVC and mounts that PVC into the WSO2 MI `carbonapps` hot-deployment directory.

The included CApp packages the demo Synapse API from:

```text
labs/12-wso2-mi-scaling/artifacts/synapse-configs/default/api/citizen-info-api.xml
```
