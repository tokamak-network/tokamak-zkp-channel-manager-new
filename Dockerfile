# ============================================
# Tokamak Private App Channels Manager
# Multi-stage Dockerfile for CI/CD and Development
# ============================================

# ===========================================
# Stage 1: Base image with all dependencies
# ===========================================
FROM ubuntu:22.04 AS base

# Prevent interactive prompts
ENV DEBIAN_FRONTEND=noninteractive
ENV TZ=UTC

# Install OS packages
RUN apt-get update && apt-get install -y \
    git curl make build-essential unzip pkg-config libssl-dev jq \
    git-lfs cmake dos2unix ca-certificates gnupg \
    && rm -rf /var/lib/apt/lists/*

# Install Rust
RUN curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y
ENV PATH="/root/.cargo/bin:${PATH}"

# Install Circom
RUN git clone https://github.com/iden3/circom.git /tmp/circom \
    && cd /tmp/circom && cargo build --release \
    && cp /tmp/circom/target/release/circom /usr/local/bin/ \
    && rm -rf /tmp/circom

# Install Node.js 20
RUN curl -fsSL https://deb.nodesource.com/setup_20.x | bash - \
    && apt-get install -y nodejs \
    && rm -rf /var/lib/apt/lists/*

# Install Bun
RUN curl -fsSL https://bun.sh/install | bash
ENV PATH="/root/.bun/bin:${PATH}"

# Install global npm packages
RUN npm install -g snarkjs

# Install Foundry (optional, for contract testing)
RUN curl -L https://foundry.paradigm.xyz | bash \
    && /root/.foundry/bin/foundryup
ENV PATH="/root/.foundry/bin:${PATH}"

# ===========================================
# Stage 2: Tokamak-Zk-EVM Builder
# This stage is cached and only rebuilds when submodule changes
# ===========================================
FROM base AS zkevm-builder

WORKDIR /zkevm

# Copy only the submodule (for better caching)
COPY Tokamak-Zk-EVM/ ./

# Fix line endings and permissions
RUN dos2unix tokamak-cli scripts/* 2>/dev/null || true
RUN chmod +x tokamak-cli scripts/* 2>/dev/null || true

# Build Tokamak-Zk-EVM dependencies
# Note: --install requires RPC_URL, which we'll provide at runtime
# Here we just prepare the build environment
RUN if [ -f "package.json" ]; then npm install || true; fi
RUN if [ -f "bun.lockb" ]; then bun install || true; fi

# ===========================================
# Stage 3: App Dependencies
# ===========================================
FROM base AS deps

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY packages/config/package.json ./packages/config/

# Install dependencies
RUN npm ci --legacy-peer-deps

# ===========================================
# Stage 4: App Builder
# ===========================================
FROM base AS builder

WORKDIR /app

# Copy dependencies from deps stage
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/packages/config/node_modules ./packages/config/node_modules

# Copy source code
COPY . .

# Copy pre-built zkevm
COPY --from=zkevm-builder /zkevm ./Tokamak-Zk-EVM

# Fetch contracts and build
RUN npm run contracts:fetch || true
RUN npm run build

# ===========================================
# Stage 5: Production Runtime
# ===========================================
FROM base AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Create non-root user
RUN groupadd --gid 1001 nodejs \
    && useradd --uid 1001 --gid nodejs --shell /bin/bash --create-home nextjs

# Copy built application
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

# Copy Tokamak-Zk-EVM for runtime synthesis
COPY --from=builder /app/Tokamak-Zk-EVM ./Tokamak-Zk-EVM

# Copy necessary config
COPY --from=builder /app/packages ./packages

# Create data directory
RUN mkdir -p /app/data && chown -R nextjs:nodejs /app/data

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "server.js"]

# ===========================================
# Stage 6: Development (for local dev)
# ===========================================
FROM base AS development

WORKDIR /app

# Copy dependencies
COPY --from=deps /app/node_modules ./node_modules

# Copy source (will be overridden by volume mount)
COPY . .

# Copy pre-built zkevm
COPY --from=zkevm-builder /zkevm ./Tokamak-Zk-EVM

EXPOSE 3000

CMD ["npm", "run", "dev"]

# ===========================================
# Stage 7: E2E Testing (Playwright)
# ===========================================
FROM mcr.microsoft.com/playwright:v1.40.0-jammy AS e2e-test

WORKDIR /app

# Install Node dependencies
COPY package*.json ./
COPY packages/config/package.json ./packages/config/
RUN npm ci --legacy-peer-deps

# Copy source
COPY . .

# Copy built app from builder
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/Tokamak-Zk-EVM ./Tokamak-Zk-EVM

# Install Playwright browsers
RUN npx playwright install --with-deps chromium

CMD ["npx", "playwright", "test"]
