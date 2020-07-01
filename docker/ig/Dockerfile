# TELEPARSER
# base image
FROM centos:8
ENV container docker
LABEL maintainer="crack@spb"

# 1. install repos
# 2. php composer
RUN  yum -y install epel-release && \
     yum install -y glibc-langpack-en && \
     yum clean all && \
     PATH="$PATH" && \
     yum -y install php php-json php-mbstring php-gd php-bcmath unzip php-devel php-pear make && \
     dnf --enablerepo=PowerTools -y install libyaml-devel && \
     pecl install yaml && \
     echo "extension=yaml" > /etc/php.d/50-yaml.ini

# create app dir
RUN mkdir -p /usr/local/tgui && \
    mkdir /tmp/app

# build instagram
ADD ./app/config /usr/local/tgui/config
ADD ./app/instagram /usr/local/tgui/instagram
RUN cd /usr/local/tgui/instagram/lib && \
    chmod u+x setup-composer.sh && \
    ./setup-composer.sh && \
    php composer.phar install
COPY ./app/run_app_ig.sh /usr/local/tgui/

WORKDIR /usr/local/tgui

ENTRYPOINT ["/usr/local/tgui/run_app_ig.sh"]
