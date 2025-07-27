FROM node:18-alpine

WORKDIR /app

# Copy backend files
COPY backend/package*.json ./backend/
RUN cd backend && npm install --production

# Copy frontend files  
COPY frontend/package*.json ./frontend/
RUN cd frontend && npm install

# Copy source code
COPY backend/ ./backend/
COPY frontend/ ./frontend/

# Build frontend
RUN cd frontend && npm run build

# Move built frontend to backend public folder
RUN mkdir -p backend/public && cp -r frontend/dist/* backend/public/

# Create data directory
RUN mkdir -p /app/data

WORKDIR /app/backend

EXPOSE 3000

CMD ["npm", "start"]