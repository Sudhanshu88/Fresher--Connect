# Fresher Connect Kubernetes

This directory contains a production-oriented Kubernetes layout for this repo.

It assumes:

- `backend` and `frontend` are built and pushed as separate images
- MongoDB is external and persistent, for example MongoDB Atlas
- file uploads use S3-compatible object storage
- traffic enters through an NGINX-compatible Ingress

## Layout

- `namespace.yaml`
- `backend-configmap.yaml`
- `frontend-configmap.yaml`
- `backend-deployment.yaml`
- `backend-service.yaml`
- `frontend-deployment.yaml`
- `frontend-service.yaml`
- `ingress.yaml`
- `backend-secret.example.yaml`
- `kustomization.yaml`

## Before You Apply

1. Build and push the backend image.

```bash
docker build -t REGISTRY/fresher-connect-backend:TAG ./backend
docker push REGISTRY/fresher-connect-backend:TAG
```

2. Build and push the frontend image.

Use same-origin API routing for Kubernetes. Keep `NEXT_PUBLIC_API_BASE` empty and point the optional internal rewrite target at the backend service DNS name.

```bash
docker build \
  --build-arg NEXT_PUBLIC_API_BASE= \
  --build-arg API_PROXY_TARGET=http://backend.fresher-connect.svc.cluster.local:5000 \
  -t REGISTRY/fresher-connect-frontend:TAG \
  ./frontend

docker push REGISTRY/fresher-connect-frontend:TAG
```

3. Update image names in:

- `backend-deployment.yaml`
- `frontend-deployment.yaml`

4. Copy `backend-secret.example.yaml` to `backend-secret.yaml` and replace every placeholder.

5. Update public hostnames in:

- `backend-configmap.yaml`
- `ingress.yaml`

## Apply Order

```bash
kubectl apply -f k8s/namespace.yaml
kubectl apply -f k8s/backend-secret.yaml
kubectl apply -k k8s
```

## Important Notes

- Never deploy with `MONGODB_USE_MOCK=true`.
- Do not rely on pod filesystem for uploads in Kubernetes. Use `STORAGE_BACKEND=s3`.
- If you prefer local file storage, add a `PersistentVolumeClaim` and mount it at `/app/instance/uploads` in the backend deployment.
- Frontend API behavior in this repo is easiest when the public site serves both frontend and backend on the same host and the Ingress routes `/api` to the backend service.
