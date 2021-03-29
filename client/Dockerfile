FROM teracy/angular-cli as build
  WORKDIR /client
  COPY package.json package.json
  RUN npm install
  RUN npm install --save ngx-webcam
  COPY . .
  RUN sh initialise.sh
  EXPOSE 4200
  CMD ["ng", "serve", "--host", "0.0.0.0", "--port", "4200", "--poll", "500"]