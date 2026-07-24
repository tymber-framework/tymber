import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# Deployment Checklist

## Files to upload

The following files should be uploaded to your server:

<Tabs groupId="package-manager">
  <TabItem value="npm" default>
    - `dist/`
    - `assets/`
    - `package.json`
    - `package-lock.json`
  </TabItem>
  <TabItem value="bun" label="Bun">
    - `src/`
    - `assets/`
    - `package.json`
    - `bun.lock`
  </TabItem>
</Tabs>

## Enable production mode

Set the `ENV` (or `NODE_ENV`) environment variable to `"production"` before starting your application:

<Tabs groupId="package-manager">
  <TabItem value="npm" default>
    ```sh
    ENV=production node dist/entrypoint.js
    ```
  </TabItem>
  <TabItem value="bun" label="Bun">
    ```sh
    ENV=production bun src/entrypoint.ts
    ```
  </TabItem>
</Tabs>


This will automatically:

- enable cache for static files with the `cache-control` header
- enable in-memory cache for compiled templates

## Use HTTPS

Using HTTPS is highly recommended for security reasons.

In the configuration:

- set `ADMIN_COOKIE_SECURE_ATTRIBUTE` to `true`
- set `USER_COOKIE_SECURE_ATTRIBUTE` to `true` if you use `@tymber/user`

## Filter admin traffic

It is highly recommended to restrict access to the administration interface to authorized IP addresses only. This should be done at your reverse proxy (e.g., Nginx, Apache) or firewall level.

Filter traffic for the following paths:

- `/admin/*`
- `/api/admin/*`

Example with nginx:

```nginx
server {
    listen 443 ssl;
    server_name my-app.com;

    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;

    location ~ ^/(admin|api/admin)/ {
        allow 1.2.3.4;
        deny all;

        proxy_pass http://localhost:8080;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header X-Forwarded-Host $host;
    }

    location / {
        proxy_pass http://localhost:8080;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header X-Forwarded-Host $host;
    }
}
```

## Manage secrets securely

Do not commit production secrets to your repository. Use environment variables, your deployment platform's secret store, or a dedicated secrets manager.

## Configure process management

Run the application with a process manager, container runtime, or service manager that can restart it automatically after crashes or server reboots.

Examples include:

- systemd
- Docker with a restart policy
- Kubernetes
- PM2
