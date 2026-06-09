# Frontend image — build the Vite SPA, then serve it with a non-root nginx that
# proxies /api to the backend. Works under an arbitrary OpenShift UID.

# ---- build stage ----
FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# ---- runtime stage (unprivileged nginx on :8080) ----
FROM nginxinc/nginx-unprivileged:1.27-alpine
# Backend URL used by the /api proxy; override per environment (k8s Service DNS).
ENV BACKEND_URL=http://backend:8080
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/templates/default.conf.template
EXPOSE 8080
