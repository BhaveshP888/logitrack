FROM node:20-alpine

WORKDIR /app

COPY package*.json ./

RUN npm ci

COPY . .

RUN DATABASE_URL="postgresql://dummy:dummy@localhost:5432/dummy" npx prisma generate

RUN npm run build

EXPOSE 3001

ENV PORT=3001
ENV NODE_ENV=production

CMD ["sh", "-c", "npx prisma migrate deploy && npx prisma db seed && npm start"]
