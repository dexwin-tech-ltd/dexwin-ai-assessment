FROM node:20-alpine
WORKDIR /app
COPY package.json ./
COPY src ./src
COPY docs ./docs
COPY eval ./eval
ENV PORT=3000
EXPOSE 3000
CMD ["node", "src/server.js"]
