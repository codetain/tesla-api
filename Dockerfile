FROM node:16.16.0-alpine AS build

WORKDIR /home/node/app

COPY package*.json ./

RUN npm ci

COPY --chown=node:node . .

RUN npm run build

FROM node:16.16.0-alpine

WORKDIR /home/node/app

COPY package*.json ./

RUN npm ci --omit=dev

COPY --chown=node:node --from=build /home/node/app/dist ./dist

CMD ["node", "./dist/main.js"]
