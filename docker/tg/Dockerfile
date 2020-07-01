# TELEPARSER
# base image
FROM centos:8
ENV container docker
LABEL maintainer="crack@spb"

# 1. install repos
RUN  yum -y install epel-release && \
     yum install -y glibc-langpack-en && \
     yum -y install python3 && \
     yum clean all && \
     pip3 install telethon aiostream asyncio requests PyYAML

# create app dir
RUN mkdir -p /usr/local/tgui && \
    mkdir /tmp/app

# build telethon
ADD ./app/telethon /tmp/app/telethon
ADD ./app/config /usr/local/tgui/config
COPY ./app/run_app_tg.sh /usr/local/tgui/
RUN cd /tmp/app/telethon && \
    mkdir /usr/local/tgui/telethon && \
    cp -r /tmp/app/telethon/* /usr/local/tgui/telethon && \
    rm -rf /tmp/* && \
    rm -rf /root/buildinfo && \
    rm -rf /root/.npm

WORKDIR /usr/local/tgui

ENTRYPOINT ["/usr/local/tgui/run_app_tg.sh"]
