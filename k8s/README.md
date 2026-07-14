## Multipass — Local VM Setup for k3s

Multipass is used to create lightweight Ubuntu VMs on your Mac to run a local k3s cluster that mirrors a real Kubernetes deployment.

### Install

```bash
brew install --cask multipass
```

Open the Multipass app from Applications and wait for the daemon to start before running any commands.

### Create nodes

```bash
multipass launch --name k3s-server --cpus 3 --memory 4G --disk 20G
multipass launch --name k3s-agent1 --cpus 3 --memory 4G --disk 20G
```

### Install k3s on server

```bash
multipass exec k3s-server -- bash -c "curl -sfL https://get.k3s.io | sh -"
```

### Join agent to the cluster

```bash
TOKEN=$(multipass exec k3s-server -- sudo cat /var/lib/rancher/k3s/server/node-token)
SERVER_IP=$(multipass info k3s-server | grep IPv4 | awk '{print $2}')

multipass exec k3s-agent1 -- bash -c "curl -sfL https://get.k3s.io | K3S_URL=https://${SERVER_IP}:6443 K3S_TOKEN=${TOKEN} sh -"
```

### Configure kubectl to use the k3s cluster

```bash
multipass exec k3s-server -- sudo cat /etc/rancher/k3s/k3s.yaml > ~/.kube/k3s-config
SERVER_IP=$(multipass info k3s-server | grep IPv4 | awk '{print $2}')
sed -i '' "s/127.0.0.1/${SERVER_IP}/" ~/.kube/k3s-config
export KUBECONFIG=~/.kube/k3s-config
```

### Verify both nodes are ready

```bash
kubectl get nodes
```

### Useful multipass commands

```bash
multipass list                        # list all VMs
multipass info k3s-server             # show VM details and IP
multipass shell k3s-server            # SSH into a VM
multipass stop k3s-server k3s-agent1  # stop VMs
multipass start k3s-server k3s-agent1 # start VMs
multipass delete k3s-server           # delete a VM
multipass purge                       # permanently remove deleted VMs
```

---

## Nginx Ingress Controller

The nginx ingress controller is the cluster-wide traffic entry point. It handles all incoming HTTP/HTTPS requests and routes them to the correct service based on ingress rules. It runs in its own namespace and serves all namespaces in the cluster.

### Install

```bash
helm repo add ingress-nginx https://kubernetes.github.io/ingress-nginx
helm repo update

helm install ingress-nginx ingress-nginx/ingress-nginx \
  --namespace ingress-nginx \
  --create-namespace
```

### Verify controller is running

```bash
kubectl get pods -n ingress-nginx
kubectl get svc ingress-nginx-controller -n ingress-nginx --watch
```

On k3s the `EXTERNAL-IP` will stay `<pending>` — install MetalLB (see section below) to assign a real IP.

### Check ingress rules across namespaces

```bash
kubectl get ingress -n uber-ns-app
```

---

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

nginx controller
helm repo add ingress-nginx https://kubernetes.github.io/ingress-nginx
helm repo update

helm install ingress-nginx ingress-nginx/ingress-nginx \
 --namespace ingress-nginx \
 --create-namespace
Then watch until it gets an external IP:

kubectl get svc ingress-nginx-controller -n ingress-nginx --watch

---

## MetalLB

k3s has no cloud load balancer so `LoadBalancer` services stay `<pending>` indefinitely.
MetalLB assigns real IPs from your local network to those services, making the ingress reachable from your Mac.

### Install

```bash
kubectl apply -f https://raw.githubusercontent.com/metallb/metallb/v0.14.5/config/manifests/metallb-native.yaml

kubectl wait --namespace metallb-system \
  --for=condition=ready pod \
  --selector=app=metallb \
  --timeout=90s
```

### Get VM subnet

```bash
multipass info k3s-server | grep IPv4
```

### Configure IP pool (match your VM subnet)

```bash
cat <<EOF | kubectl apply -f -
apiVersion: metallb.io/v1beta1
kind: IPAddressPool
metadata:
  name: default-pool
  namespace: metallb-system
spec:
  addresses:
  - 192.168.252.200-192.168.252.250
---
apiVersion: metallb.io/v1beta1
kind: L2Advertisement
metadata:
  name: default
  namespace: metallb-system
EOF
```

### Verify

```bash
kubectl get svc ingress-nginx-controller -n ingress-nginx --watch
```

---

## Kubernetes Dashboard

### Install

```bash
kubectl apply -f https://raw.githubusercontent.com/kubernetes/dashboard/v2.7.0/aio/deploy/recommended.yaml
```

### Create admin user and generate token

```bash
kubectl create serviceaccount dashboard-admin -n kubernetes-dashboard

kubectl create clusterrolebinding dashboard-admin \
  --clusterrole=cluster-admin \
  --serviceaccount=kubernetes-dashboard:dashboard-admin

kubectl create token dashboard-admin -n kubernetes-dashboard
```

### Start proxy and open dashboard

```bash
kubectl proxy
```

Open in browser:

```
http://localhost:8001/api/v1/namespaces/kubernetes-dashboard/services/https:kubernetes-dashboard:/proxy/
```

Paste the token from above to log in.
