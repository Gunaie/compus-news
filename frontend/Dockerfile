FROM node:20-alpine AS build

WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
ARG VITE_IMAGE_CDN_BASE_URL=
ARG VITE_MONITOR_SAMPLE_RATE=0.1
ENV VITE_IMAGE_CDN_BASE_URL=$VITE_IMAGE_CDN_BASE_URL
ENV VITE_MONITOR_SAMPLE_RATE=$VITE_MONITOR_SAMPLE_RATE
RUN npm run build

FROM node:20-alpine AS runtime

ENV NODE_ENV=production
ENV PORT=5175
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --omit=dev && npm cache clean --force
COPY --from=build /app/dist ./dist
COPY server.js ./
USER node
EXPOSE 5175
CMD ["node", "server.js"]
