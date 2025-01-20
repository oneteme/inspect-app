FROM nginx:latest
COPY dist/inspect-app /usr/share/nginx/html
COPY config/nginx.conf /etc/nginx/nginx.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]