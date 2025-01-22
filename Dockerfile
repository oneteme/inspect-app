FROM nginx:latest
COPY dist/inspect-app/ /usr/share/nginx/html
COPY docker/nginx.conf /etc/nginx/nginx.conf
COPY docker/rungnx.sh /usr/local/bin/rungnx.sh
COPY docker/config-env.map /usr/local/bin/config-env.map
RUN chmod +x /usr/local/bin/rungnx.sh
EXPOSE 80
ENTRYPOINT ["rungnx.sh", "/usr/share/nginx/html/environment.remote.json"]