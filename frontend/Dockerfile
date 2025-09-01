FROM node:20-alpine

# Update and install security patches
RUN apk update && apk upgrade --no-cache

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY tsconfig.json ./
COPY tsconfig.*.json ./
COPY vite.config.ts ./
COPY index.html ./
COPY eslint.config.js ./

# Install dependencies
RUN npm ci --verbose && \
    npm install @rollup/rollup-linux-arm64-musl --save-optional

# Copy all frontend code
COPY ./src ./src
COPY ./public ./public

# Expose Vite dev server port
EXPOSE 5173

# Run frontend
CMD ["npm", "run", "dev", "--", "--host"]
