# Pin the minor so rebuilds are reproducible; bump deliberately.
FROM node:20-slim

WORKDIR /app

# The image has no dependencies to install. Copy the app in owned by the
# unprivileged `node` user so the server can write its state file and log
# without running as root.
COPY --chown=node:node . /app

# Writable mount point for an optional state volume (see docker-compose.yml).
# Created here so it is owned by `node` when a named volume is attached.
RUN mkdir -p /data && chown node:node /data

USER node

EXPOSE 8787

# Cheap liveness probe that does not run the ranking (see /healthz).
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:'+(process.env.FREE_ROUTER_PORT||8787)+'/healthz').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

CMD ["node", "server.mjs"]
