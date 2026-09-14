ARG NODE_VERSION=22.20.0
ARG PYTHON_VERSION=3.12.14
FROM node:${NODE_VERSION}-bookworm AS node
FROM python:${PYTHON_VERSION}-bookworm
COPY --from=node /usr/local/bin/node /usr/local/bin/node
COPY --from=node /usr/local/lib/node_modules /usr/local/lib/node_modules
RUN apt-get update \
 && apt-get install -y --no-install-recommends build-essential cmake autoconf automake libtool pkg-config libgl1 libglib2.0-0 libportaudio2 \
 && rm -rf /var/lib/apt/lists/*
RUN ln -s ../lib/node_modules/npm/bin/npm-cli.js /usr/local/bin/npm \
 && ln -s ../lib/node_modules/npm/bin/npx-cli.js /usr/local/bin/npx \
 && ln -s ../lib/node_modules/corepack/dist/corepack.js /usr/local/bin/corepack
WORKDIR /work
RUN pip install --no-cache-dir uv==0.12.11
