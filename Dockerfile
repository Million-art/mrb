# ----------- Stage 1: Build the app ----------- #
FROM node:18-alpine AS builder

WORKDIR /app

# Copy only package files first to leverage caching
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the source code
COPY . .

# Build the app
RUN npm run build

# ----------- Stage 2: Serve with Nginx ----------- #
FROM nginx:alpine

# Remove default Nginx static files if any
RUN rm -rf /usr/share/nginx/html/*

# Copy built app from builder
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy custom Nginx config for SPA routing support
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expose the port the app runs on
EXPOSE 80

# Start Nginx
CMD ["nginx", "-g", "daemon off;"]
