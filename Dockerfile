FROM node:18-alpine AS backend-builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:18-alpine AS frontend-builder
WORKDIR /app/src/app
COPY src/app/package*.json ./
RUN npm ci
COPY src/app .
ENV REACT_APP_API_URL=/api
RUN npm run build

FROM node:18-alpine
WORKDIR /app
COPY --from=backend-builder /app/dist ./dist
COPY --from=backend-builder /app/node_modules ./node_modules
COPY --from=backend-builder /app/package.json .
COPY --from=frontend-builder /app/src/app/build ./public/app
COPY src/database ./src/database
ENV NODE_ENV=production
EXPOSE 3000
CMD ["npm", "start"]
