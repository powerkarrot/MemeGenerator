FROM node:12-alpine as build
  WORKDIR /client
  COPY . .
  RUN npm install -g @angular/cli
  RUN npm install
  RUN sh initialise.sh
  EXPOSE 4200
  CMD ["ng", "serve", "--host", "0.0.0.0", "--port", "4200"]