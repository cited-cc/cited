# syntax=docker/dockerfile:1

# Pin to a maintained Node 22 Debian slim base. Operators may pin by digest:
# FROM node:22-bookworm-slim@sha256:<digest>
FROM node:22-bookworm-slim AS base
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1

FROM base AS deps
COPY package.json package-lock.json ./
RUN npm ci

FROM deps AS build
COPY . .
ENV CITED_DOCKER_BUILD=true \
    CITED_DEPLOYMENT_MODE=self_hosted \
    NEXT_PUBLIC_CITED_DEPLOYMENT_MODE=self_hosted \
    NODE_ENV=production \
    NEXT_PUBLIC_APP_URL=http://localhost:3000 \
    NEXT_PUBLIC_SUPPORT_EMAIL=hello@example.com \
    SECURITY_CONTACT_EMAIL=security@example.com \
    CITED_AUTH_PROVIDER=local \
    NEXT_PUBLIC_CITED_AUTH_PROVIDER=local \
    CITED_DATABASE_PROVIDER=postgres \
    CITED_MONITORING_PROVIDER=mock \
    CITED_ALLOW_MOCK_PROVIDER=true \
    MONITORING_ENABLED=false \
    NOTIFICATIONS_ENABLED=false \
    CITED_EMAIL_PROVIDER=disabled
RUN npm run build

FROM base AS prod-deps
COPY package.json package-lock.json ./
RUN npm ci --omit=dev

FROM base AS runtime
ARG VERSION=0.0.0-dev
ARG REVISION=unknown
ARG SOURCE_URL=https://github.com/PLACEHOLDER/PLACEHOLDER
LABEL org.opencontainers.image.title="Cited" \
    org.opencontainers.image.description="Open-source citation monitoring platform for AI answers that matter." \
    org.opencontainers.image.version="${VERSION}" \
    org.opencontainers.image.source="${SOURCE_URL}" \
    org.opencontainers.image.revision="${REVISION}" \
    org.opencontainers.image.licenses="AGPL-3.0-only"
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3000 \
    HOSTNAME=0.0.0.0 \
    CITED_IMAGE_VERSION="${VERSION}" \
    CITED_IMAGE_REVISION="${REVISION}"

RUN groupadd --gid 1001 cited \
    && useradd --uid 1001 --gid cited --create-home --shell /usr/sbin/nologin cited

COPY --from=build /app/public ./public
COPY --from=build /app/.next/standalone ./
COPY --from=build /app/.next/static ./.next/static
COPY --from=build /app/LICENSE ./LICENSE
COPY --from=build /app/NOTICE ./NOTICE
COPY --from=build /app/supabase/migrations ./supabase/migrations
COPY --from=build /app/scripts ./scripts
COPY --from=build /app/lib ./lib
COPY --from=build /app/docker ./docker
COPY --from=prod-deps /app/node_modules ./node_modules_overlay

RUN cp -rn node_modules_overlay/* node_modules/ \
    && rm -rf node_modules_overlay \
    && chown -R cited:cited /app

USER cited
WORKDIR /app

EXPOSE 3000

HEALTHCHECK --interval=15s --timeout=5s --start-period=60s --retries=5 \
  CMD node docker/healthcheck-web.mjs || exit 1

CMD ["node", "docker/entrypoint-web.mjs"]
