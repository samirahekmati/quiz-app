FROM node:22-slim AS web

USER node
WORKDIR /home/node

COPY package*.json .npmrc ./
COPY --chown=node web/package.json web/

RUN npm \
  --no-fund \
  --include-workspace-root \
  --workspace web \
  ci && \
  npm --workspace web install @rollup/rollup-linux-x64-gnu lightningcss-linux-x64-gnu @tailwindcss/oxide-linux-x64-gnu --no-save

COPY --chown=node web/ web/
RUN npm --workspace web run build

FROM node:22-alpine

RUN apk add --no-cache tini

USER node
WORKDIR /home/node

COPY package*.json .npmrc ./
COPY api/package.json api/
RUN npm \
  --no-fund \
  --omit dev \
  --include-workspace-root \
  --workspace api \
  ci

COPY --chown=node bin/start.sh .
COPY --chown=node api/ api/
COPY --from=web /home/node/api/static api/static/

EXPOSE 80
ENV PORT=80

ENTRYPOINT [ "./start.sh" ]
