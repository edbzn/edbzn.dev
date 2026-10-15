---
title: How to configure DNS using Heroku and Google Domains
date: '2019-05-25T00:00:00.000Z'
description: Learn how to configure DNS using Heroku and Google Domains to point your custom domains to your Heroku apps.
tags: [infrastructure]
cover: ./cover.svg
---

My app is composed of two Docker images, the first one is a JavaScript SPA and second one is the server which is a Node.js API. The client basically call the API through HTTP. Here is the `Dockerfile` for the client.

```docker
FROM node:10 AS builder
WORKDIR /codamit-client
COPY package.json
./RUN npm install
COPY ./.env.production ./.env
COPY . .
RUN npm run build

FROM nginx:1.17.0
COPY nginx/default.conf.template /etc/nginx/conf.d/default.conf.template
COPY nginx/nginx.conf /etc/nginx/nginx.conf
COPY --from=builder /codamit-client/dist /usr/share/nginx/html
CMD /bin/bash -c "envsubst '\$PORT' < /etc/nginx/conf.d/default.conf.template > /etc/nginx/conf.d/default.conf" && nginx -g 'daemon off;'
```

And here is the `Dockerfile` for the server.Note that for environmental variables I'm using a `.env` file dropped inside the container at build time.

When I run the container the `CMD` uses `dotenv` which basically map values from the `.env` file to the Node.js process.

```docker
FROM node:10
WORKDIR /usr/src/codamit-server
COPY package.json ./
RUN npm install
COPY ./.env.production ./.env
COPY . .
RUN npm run build
EXPOSE 8081
CMD [ "node", "-r", "dotenv/config", "dist/index.js" ]
```

Next to that Heroku provide a CLI to manage Docker images. I wrote a small npm script to build, push and release images in one single command.

## Custom domains

At this point I had two services running online under Heroku defaults domains.
* The client hosted on `https://codamit-client.herokuapp.com`
* The API hosted on `https://codamit-server.herokuapp.com`

I wanted to be able to visit the app under `https://edbzn.github.io` and the API to respond under `https://www.api.edbzn.github.io`, let's see how.

### 1- Add Heroku custom domains

Firstly I created custom domains for each project using Heroku dashboard.

*Project settings* > *Domains and certificates* > *Add Domain*

I added `edbzn.github.io` for the client and `www.api.edbzn.github.io` for the API. It gives me two DNS addresses that I reused later in Google Domains interface.
Last but not least I configured the SSL to automatically generates certificates, it requires to upgrade the Dyno to the paying plan.

### 2- Configure Google Domains DNS settings

In the *DNS section* > *Synthetic records* panel I added :

Sub-domain : `@` <br/>
Temporary redirection (302) : ✅ <br/>
Forward path : ✅ <br/>
Destination URL : `http://edbzn.github.io` <br/>
Activate SSL : ✅ <br/>

Then in the *Custom Resources Records* panel I created two records :

Name : `www` <br/>
Type : `CNAME` <br/>
TTL : `1h` <br/>
Data : `* paste Heroku DNS target *`Name : `www.api` <br/>
Type : `CNAME`<br/>
TTL : `1h` <br/>
Data : `* paste Heroku DNS target *`

I needed to wait a short time due to DNS propagation. To ensure DNS are well configured we can run :

```bash
$ host edbzn.github.io
```

It should return that `edbzn.github.io` is an alias for the Heroku DNS target I pasted just before from the Heroku dashboard.

```bash
edbzn.github.io is an alias for [* DNS target *][* DNS target *] has address [* IP *]
```
