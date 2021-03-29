FROM ubuntu:20.04
  WORKDIR /server
  COPY package.json package.json 
  ENV TZ=Europe/Berlin
  RUN ln -snf /usr/share/zoneinfo/$TZ /etc/localtime && echo $TZ > /etc/timezone
  RUN apt-get update -y
  RUN apt-get install -y python curl libpango-1.0-0 libcairo2-dev libjpeg-dev libgif-dev nodejs npm pkg-config
  RUN npm install --save adm-zip
  RUN npm install
  RUN npm install -g nodemon --unsafe-perm
  COPY . .
  CMD ["nodemon", "app.js", "--legacy-watch"]
