FROM nginx:latest
COPY dist/inspect-app/ /usr/share/nginx/html
COPY config/nginx.conf /etc/nginx/nginx.conf
COPY config/env.sh /usr/local/bin/env.sh
RUN chmod +x /usr/local/bin/env.sh
EXPOSE 80
ENTRYPOINT ["/bin/sh", "-c", "/usr/local/bin/env.sh /usr/share/nginx/html/environment.remote.json && nginx -g 'daemon off;'"]
