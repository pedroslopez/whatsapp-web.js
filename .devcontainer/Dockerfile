FROM debian:buster
USER root
RUN echo 'deb http://deb.debian.org/debian buster-backports main' > /etc/apt/sources.list.d/backports.list
# Pré requisitos
RUN apt update && apt install -y curl git wget tree docker docker-compose chromium imagemagick git-flow vim nano ffmpeg gpac
# Copia o id do usuário docker da maquina host (para usar o CLI no devcontainer) esse argumento é passado na construção da imagem
ARG HOST_DOCKER_GROUP_ID
RUN groupmod -g $HOST_DOCKER_GROUP_ID docker 
# Cria o usuário developer
RUN useradd -ms /bin/bash developer
# Adiciona o usuário developer ao grupo do docker
RUN usermod -aG docker developer
# Atualiza os grupos do usuário developer
RUN newgrp docker 

USER developer
WORKDIR /home/developer
# Instala o node
RUN wget https://nodejs.org/dist/v18.12.1/node-v18.12.1-linux-x64.tar.xz -O node.tar.xz
RUN tar -xf node.tar.xz
ENV PATH "$PATH:/home/developer/node-v18.12.1-linux-x64/bin"
