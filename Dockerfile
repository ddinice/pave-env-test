FROM node:22-alpine

WORKDIR /app

ENV NEXT_TELEMETRY_DISABLED=1

RUN apk add --no-cache netcat-openbsd

COPY package.json package-lock.json ./
RUN npm ci --ignore-scripts

COPY . .
RUN npm run db:generate
RUN chmod +x docker-entrypoint.sh

EXPOSE 3000

ENTRYPOINT ["./docker-entrypoint.sh"]
CMD ["npm", "run", "dev"]
