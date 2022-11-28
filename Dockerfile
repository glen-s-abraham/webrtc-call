FROM node:alpine

WORKDIR /app
COPY package.json ./
RUN npm install -g npm@9.1.2
RUN npm install
COPY ./ ./
CMD ["npm","start"]