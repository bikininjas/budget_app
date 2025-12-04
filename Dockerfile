# Étape 1 : Construction de l'app React
FROM node:22-alpine as build
WORKDIR /app
COPY package.json .
# Note: Assurez-vous d'avoir un package.json avec react, react-dom, lucide-react
RUN npm install
COPY . .
RUN npm run build

# Étape 2 : Serveur Web léger
FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
