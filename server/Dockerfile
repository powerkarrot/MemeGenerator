FROM ubuntu:20.04
  WORKDIR /server
  COPY . .
  ENV TZ=Europe/Berlin
  RUN ln -snf /usr/share/zoneinfo/$TZ /etc/localtime && echo $TZ > /etc/timezone
  RUN apt-get update -y
  RUN apt-get install -y python curl libpango-1.0-0 libcairo2-dev libjpeg-dev libgif-dev nodejs npm pkg-config
  RUN npm install
  RUN npm install -g nodemon --unsafe-perm
  RUN cp ./replace/index.js ./node_modules/nodejs-meme-generator/index.js
  CMD ["nodemon", "app.js"]