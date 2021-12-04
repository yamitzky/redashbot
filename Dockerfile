FROM mcr.microsoft.com/playwright:bionic

USER root
RUN apt-get update
RUN apt-get install -y fonts-noto

USER pwuser

RUN mkdir -p /home/pwuser/redashbot
WORKDIR /home/pwuser/redashbot

COPY package.json /home/pwuser/redashbot
COPY package-lock.json /home/pwuser/redashbot
RUN npm install
COPY . /home/pwuser/redashbot


EXPOSE 3000
CMD [ "npm", "start" ]
