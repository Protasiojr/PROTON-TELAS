# Estágio 1: Usar a imagem oficial do Nginx (versão leve/alpine)
FROM nginx:alpine

# Opcional: Remover o conteúdo padrão do Nginx
RUN rm -rf /usr/share/nginx/html/*

# Copiar os arquivos do seu projeto para a pasta do servidor Nginx
# O '.' indica que vai copiar tudo da sua pasta atual para dentro do container
COPY . /usr/share/nginx/html

# Expõe a porta 80 para o mundo externo
EXPOSE 80

# Inicia o Nginx automaticamente ao rodar o container
CMD ["nginx", "-g", "daemon off;"]