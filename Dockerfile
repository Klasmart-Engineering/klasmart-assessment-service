FROM node:lts-alpine AS base
RUN apk add --no-cache tini
ENTRYPOINT ["/sbin/tini", "--"]
WORKDIR /root/app
COPY ./ ./



# ---- Build ----
FROM base AS build
WORKDIR /root/app
RUN npm ci
RUN npm audit fix
RUN npm run build

#
# ---- Release ----
FROM base AS release
WORKDIR /root/app
# expose port and define CMD
ENV PORT=8080
EXPOSE 8080
# install production node_modules
RUN npm ci --only=production
RUN npm audit fix --only=production
# copy app sources
COPY --from=build /root/app/dist ./dist
CMD node dist/index.js
