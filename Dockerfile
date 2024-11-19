FROM node:18 AS base

# Install Packages
RUN apt-get update && \
  apt-get install -y \
  ffmpeg python3

# Install pnpm
RUN npm install -g pnpm

# Build
FROM base AS builder
WORKDIR /app
COPY . .
RUN pnpm install
RUN pnpm run build

# Run
FROM base AS deploy
WORKDIR /app
ENV NODE_ENV production
COPY --from=builder /app ./
CMD ["pnpm" ,"start"]