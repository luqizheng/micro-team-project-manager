cd server
docker buildx build --push --platform linux/amd64 -t zhcoder-docker-registry.com:8000/coder/project-manager-server:latest .
cd ..