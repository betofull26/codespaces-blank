FROM node:20-alpine

WORKDIR /app

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY src ./src
COPY index.html ./index.html
COPY vite.config.ts ./vite.config.ts
COPY postcss.config.mjs ./postcss.config.mjs
COPY public ./public

RUN corepack enable && pnpm install --frozen-lockfile

EXPOSE 5173

CMD ["pnpm", "run", "dev", "--", "--host", "0.0.0.0"]
