# ---- Base Stage ----
FROM node:20.10-alpine AS base
WORKDIR /app

# Copy dependency files
COPY package*.json ./

# Install all dependencies (including dev for testing)
RUN npm install

# Copy source code
COPY . .

# ---- Production Stage ----
FROM node:20.10-alpine AS production
WORKDIR /app

# Copy only package.json and install production dependencies
COPY package*.json ./
RUN npm install --production

# Copy app source code
COPY . .

# Expose port
EXPOSE 5000

# Env vars
ENV NODE_ENV=production
ENV PORT=5000

CMD ["node", "server.js"]
