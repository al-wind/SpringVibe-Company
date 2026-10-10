# Built from the repo root (Railway: RAILWAY_DOCKERFILE_PATH=landing/Dockerfile)
FROM nginx:alpine

RUN rm /etc/nginx/conf.d/default.conf
COPY landing/nginx.conf /etc/nginx/conf.d/default.conf.template
COPY landing/index.html /usr/share/nginx/html/index.html
COPY landing/assets /usr/share/nginx/html/assets

CMD sh -c "envsubst '\$PORT' < /etc/nginx/conf.d/default.conf.template > /etc/nginx/conf.d/default.conf && nginx -g 'daemon off;'"
