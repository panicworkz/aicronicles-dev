FROM node:20-alpine
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

COPY package.json ./
RUN npm install --omit=dev --legacy-peer-deps

COPY . .

EXPOSE 3000
CMD ["npm", "run", "start"]
