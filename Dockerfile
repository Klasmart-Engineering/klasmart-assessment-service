FROM node:16-alpine
WORKDIR /usr/src/app
COPY ./node_modules ./node_modules
COPY ./dist .
ENV NODE_ENV=production
ENV PORT=8080
EXPOSE 8080
WORKDIR /usr/src/app
CMD node src/index.js
