# Use Node v20.10-alpine
FROM node:20.10-alpine

# Set working directory
WORKDIR /app

# Copy package.json and install dependencies
COPY package*.json ./
RUN npm install --production

# Copy the rest of the application code
COPY . .

# Expose port
EXPOSE 5000

# Environment variables
ENV NODE_ENV=production
ENV PORT=5000
ENV MONGO_URI=${MONGO_URI}
ENV SMTP_HOST=${SMTP_HOST}
ENV SMTP_PORT=${SMTP_PORT}
ENV SMTP_USER=${SMTP_USER}
ENV SMTP_PASS=${SMTP_PASS}
ENV JWT_SECRET=${JWT_SECRET}
ENV FRONTEND_URL=${FRONTEND_URL}

# Command to run the app
CMD ["node", "server.js"]