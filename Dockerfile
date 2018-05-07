FROM node:8.11.1-slim

RUN apt-get update && apt-get install -yq libgconf-2-4

RUN apt-get update && apt-get install -y wget --no-install-recommends \
    && wget -q -O - https://dl-ssl.google.com/linux/linux_signing_key.pub | apt-key add - \
    && sh -c 'echo "deb [arch=amd64] http://dl.google.com/linux/chrome/deb/ stable main" >> /etc/apt/sources.list.d/google.list' \
    && apt-get update \
    && apt-get install -y google-chrome-unstable fonts-ipaexfont-gothic \
      --no-install-recommends \
    && rm -rf /var/lib/apt/lists/* \
    && apt-get purge --auto-remove -y curl \
    && rm -rf /src/*.deb

ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD true

RUN mkdir /opt/redashbot
WORKDIR /opt/redashbot

ADD package.json /opt/redashbot
ADD package-lock.json /opt/redashbot
RUN npm install
ADD . /opt/redashbot

ENV CHROMIUM_BROWSER_PATH=google-chrome-unstable

ENTRYPOINT [ "node" ]
CMD [ "index.js" ]
