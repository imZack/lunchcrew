FROM node:9

COPY . /data

WORKDIR  /data

RUN npm install

EXPOSE 3000

CMD ["npm", "start"]
