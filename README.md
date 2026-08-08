> **Build architecture note (Apple Silicon / macOS)**
> This cluster runs on Multipass VMs on an **Apple Silicon Mac**, so the k3s nodes are **`arm64`**. Container images **must** be built for `linux/arm64` — an `amd64` image will crash on startup with `exec /usr/local/bin/docker-entrypoint.sh: exec format error` (`CrashLoopBackOff`).
> Because of this, the app-repo CI builds on GitHub's **native arm64 runner** (`runs-on: ubuntu-24.04-arm`) with `platforms: linux/arm64` — **not** QEMU emulation, which crashes `npm ci` with `qemu: uncaught target signal 4 (Illegal instruction)`. If you later deploy to an `amd64` (cloud) cluster, switch to a true multi-arch build (amd64 on `ubuntu-latest` + arm64 on `ubuntu-24.04-arm`, merged into one manifest).

## Applications

This repo deploys a ride-hailing (Uber-like) microservices stack into the `uber-ns-app` namespace. The `apps/` Helm umbrella chart is synced by **Argo CD** (pull-based GitOps — see the Argo CD section). Non-secret config comes from `apps/values.yaml` + per-service configMaps; secrets come from the `uber-secret` SealedSecret.

| Service                    | Role                                                                                                                                                                | Container port | Replicas | Image                                        | Built by CI? |
| -------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------- | -------- | -------------------------------------------- | ------------ |
| **api-gateway**            | HTTP entry point; routes to the backend services. Exposed to the outside via the nginx **Ingress** (`ingressClassName: nginx`, path `/`) on service port 80 → 3000. | 3000           | 2        | `ghcr.io/zannujulius/api-gateway`            | ✅ yes       |
| **fare-estimation**        | Computes trip fares; Kafka consumer/producer; uses the Google Maps API.                                                                                             | 3012           | 1        | `ghcr.io/zannujulius/fare-estimation`        | ✅ yes       |
| **rider-websocket-server** | Real-time rider WebSocket server; Kafka consumer.                                                                                                                   | 3010           | 1        | `ghcr.io/zannujulius/rider-websocket-server` | ✅ yes       |
| **kafka**                  | Event broker for inter-service messaging. Deployed as a StatefulSet (in this chart).                                                                                | 9092           | 1        | `confluentinc/cp-kafka:7.6.0` (upstream)     | ❌ no        |
| **postgres** (`uber-db`)   | Relational database. **Not** part of this chart — installed separately via the Bitnami chart.                                                                       | 5432           | 1        | `bitnami/postgresql` (upstream)              | ❌ no        |

### Which images the CI/CD pipeline builds

Only the three application services — **api-gateway**, **fare-estimation**, **rider-websocket-server** — are built from source by the app-repo GitHub Actions pipeline (`uber-clone` repo). Each build produces an **`arm64`** image (see the build-architecture note above) tagged with the commit SHA, pushes it to GHCR, then bumps that tag in this repo's `apps/charts/<service>/values.yaml`; Argo CD then rolls it out. **kafka** and **postgres** use upstream images and are never built here.

### Internal service DNS (in-cluster)

- `api-gateway-service` (fronted by the Ingress)
- `rider-websocket-server-service.uber-ns-app.svc.cluster.local:3010`
- `kafka-statefulset-0.kafka-service.uber-ns-app.svc.cluster.local:9092`
- `uber-db-postgresql.uber-ns-app.svc.cluster.local:5432`

### Dependency order (why pods can fail on a fresh cluster)

`kafka` and `postgres` must be up before the app services become healthy — otherwise you'll see `getaddrinfo ENOTFOUND …postgresql…` or Kafka connection errors. Postgres is a separate `helm install` (see below), and the app services depend on both plus the `uber-secret` (SealedSecret) and `ghcr-secret` (image pull) existing first.

---
