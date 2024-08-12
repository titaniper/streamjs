FROM public.ecr.aws/docker/library/node:20-alpine AS builder
WORKDIR /app

COPY package*.json ./

RUN npm ci

ARG NODE_ENV
ARG COMMIT_HASH

ENV NODE_ENV=$NODE_ENV \
    COMMIT_HASH=$COMMIT_HASH

COPY . .

RUN npm run build

# NOTE: npm 스크립트로 실행하면 안된다. https://github.com/npm/npm/pull/10868
CMD ["node", "./dist/server.js"]
