# TELEPARSER
# base image
FROM centos:8
ENV container docker
LABEL maintainer="crack@spb"

# 1. install repos
# 2. nodejs
# 3. upgrade nodejs
# 4. nginx
RUN  yum -y install epel-release && \
     yum install -y glibc-langpack-en && \
     yum -y install nginx nodejs sqlite sqlite-devel python3 libSM libXrender libXext && \
     pip3 install aiostream asyncio requests flask flask_cors PyYAML numpy opencv-python && \
     systemctl enable nginx && \
     yum clean all && \
     npm install -g n && \
     n stable && \
     PATH="$PATH"

# create app dir
RUN mkdir -p /usr/local/tgui && \
    mkdir /tmp/app

# build fe
ADD ./app/fe /tmp/app/fe
RUN cd /tmp/app/fe && \
    npm install && \
    npm run build && \
    rm -rf /usr/share/nginx/html/* && \
    cp -r /tmp/app/fe/build/* /usr/share/nginx/html

# build be
ADD ./app/be /usr/local/tgui/be
ADD ./migration /usr/local/tgui/migration
ADD ./app/config /usr/local/tgui/config
COPY ./app/run_app_ui.sh /usr/local/tgui
COPY ./app/nginx.conf /etc/nginx

# map port
EXPOSE 8000

WORKDIR /usr/local/tgui

ENTRYPOINT ["/usr/local/tgui/run_app_ui.sh"]
