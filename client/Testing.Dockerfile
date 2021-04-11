FROM teracy/angular-cli as build
  WORKDIR /client
  COPY package.json package.json
  RUN npm install
  RUN npm install --save ngx-webcam
  COPY . .
  RUN sh initialise.sh
  EXPOSE 4200
  CMD ["ng", "test", "--poll", "500"]