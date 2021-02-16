FROM teracy/angular-cli as build
  WORKDIR /client
  COPY package.json package.json
  RUN npm install
  COPY . .
  RUN sh initialise.sh
  EXPOSE 4200
  CMD ["ng", "serve", "--host", "0.0.0.0", "--port", "4200", "--poll", "500"]