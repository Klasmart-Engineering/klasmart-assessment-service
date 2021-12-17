FROM node:16-alpine
WORKDIR /usr/src/app
COPY ./dist ./dist
COPY ./node_modules ./node_modules
ENV NODE_ENV=production
ENV PORT=8080
EXPOSE 8080
WORKDIR /usr/src/app/dist
CMD node src/index.js
