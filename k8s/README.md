helm install <APPLICATION_NAME> <HELM_CHART_PATH>
helm list
helm uninstall <APPLICATION_NAME>
kubectl get deployment
kubectl get svc
kubectl get pods
kubectl describe pod <POD_ID>
kubectl logs <POD_ID>
kubectl describe configmaps <CONFIGMAP_NAME>
kubectl get configmaps <CONFIGMAP_NAME> -o yaml
docker images
docker container ls -a
docker logs <CONTAINER_NAME>

<!--
great now that the values.yml is shared across the all deployment can i just run helm install in the k8s so it will dek -->
