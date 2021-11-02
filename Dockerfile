FROM node:16-alpine AS base
RUN apk add --no-cache tini
ENTRYPOINT ["/sbin/tini", "--"]
WORKDIR /root/app

# ---- Build ----
FROM base AS build
WORKDIR /root/app
COPY ./package*.json ./
RUN npm ci
# RUN npm audit fix
COPY ./ ./
RUN npm run build

#
# ---- Release ----
FROM base AS release
WORKDIR /root/app
# expose port and define CMD
ENV PORT=8080
ENV NODE_ENV=production
ENV HUSKY=0
EXPOSE 8080
# install production node_modules
COPY ./package*.json ./
RUN npm ci --only=production
# RUN npm audit --ignore
# copy app sources
COPY --from=build /root/app/dist ./dist
CMD node dist/index.js
