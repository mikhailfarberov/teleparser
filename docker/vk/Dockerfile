# TELEPARSER
# base image
FROM centos:8
ENV container docker
LABEL maintainer="crack@spb"

# 1. install repos
# 2. pip
RUN  yum -y install epel-release && \
     yum -y install python3 && \
     yum clean all && \
     pip3 install aiostream asyncio requests PyYAML bs4

# create app dir
RUN mkdir -p /usr/local/tgui && \
    mkdir /tmp/app

# add vk parser
ADD ./app/vk /usr/local/tgui/vk
ADD ./app/config /usr/local/tgui/config
COPY ./app/run_app_vk.sh /usr/local/tgui/

WORKDIR /usr/local/tgui

ENTRYPOINT ["/usr/local/tgui/run_app_vk.sh"]
