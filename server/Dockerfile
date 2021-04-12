FROM ubuntu:20.04
  WORKDIR /server
  COPY package.json package.json 
  ENV TZ=Europe/Berlin
  RUN ln -snf /usr/share/zoneinfo/$TZ /etc/localtime && echo $TZ > /etc/timezone
  RUN apt-get update -y
  RUN apt-get install -y python curl libpango-1.0-0 libcairo2-dev libjpeg-dev libgif-dev nodejs npm pkg-config
  RUN apt-get install -y gconf-service libasound2 libatk1.0-0 libc6 libcairo2 libcups2 libdbus-1-3 libexpat1 libfontconfig1 libgcc1 libgconf-2-4 libgdk-pixbuf2.0-0 libglib2.0-0 libgtk-3-0 libnspr4 libpango-1.0-0 libpangocairo-1.0-0 libstdc++6 libx11-6 libx11-xcb1 libxcb1 libxcomposite1 libxcursor1 libxdamage1 libxext6 libxfixes3 libxi6 libxrandr2 libxrender1 libxss1 libxtst6 ca-certificates fonts-liberation libappindicator1 libnss3 lsb-release xdg-utils libgbm-dev wget
  RUN apt-get install -y ffmpeg
  RUN npm install --save adm-zip
  RUN npm install
  RUN npm install -g nodemon --unsafe-perm
  COPY . .
  CMD ["nodemon", "app.js", "--legacy-watch"]
