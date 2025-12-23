# Etapa de build
FROM node:20-alpine AS builder

WORKDIR /app

# Copiar ficheiros de dependências
COPY package*.json ./
COPY bun.lockb ./

# Instalar dependências
RUN npm ci

# Copiar código fonte
COPY . .

# Build da aplicação
RUN npm run build

# Etapa de produção
FROM nginx:alpine

# Copiar configuração do nginx
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copiar ficheiros buildados
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
