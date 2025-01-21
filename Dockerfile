FROM nginx:latest
COPY dist/inspect-app/ /usr/share/nginx/html
COPY config/nginx.conf /etc/nginx/nginx.conf
COPY config/config.sh /usr/local/bin/config.sh
RUN chmod +x /usr/local/bin/config.sh
EXPOSE 80
ENTRYPOINT ["/bin/sh", "-c", "/usr/local/bin/config.sh /usr/share/nginx/html/environment.remote.json && nginx"]