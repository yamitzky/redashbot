FROM mcr.microsoft.com/playwright:bionic

USER root
RUN apt-get update -y --fix-missing && apt-get install -y fonts-noto

RUN mkdir -p /home/pwuser/redashbot
WORKDIR /home/pwuser/redashbot

COPY package.json /home/pwuser/redashbot
COPY package-lock.json /home/pwuser/redashbot

RUN npm install

USER pwuser
COPY . /home/pwuser/redashbot


EXPOSE 3000
CMD [ "npm", "start" ]
