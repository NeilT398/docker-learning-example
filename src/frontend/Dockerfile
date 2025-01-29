FROM nginx:1.27-alpine

WORKDIR /usr/share/nginx/html/
COPY web .
COPY config /etc/nginx/conf.d

CMD ["nginx", "-g", "daemon off;"]
