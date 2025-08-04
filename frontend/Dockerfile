<<<<<<< HEAD
# Используем официальный образ Node.js
FROM node:18-alpine

# Устанавливаем рабочую директорию
WORKDIR /app

# Копируем package.json и устанавливаем зависимости
COPY package.json package-lock.json ./
RUN npm install

# Копируем остальные файлы проекта
COPY . .

# Собираем приложение
RUN npm run build

# Открываем порт
EXPOSE 5173

# Запускаем приложение
CMD ["npm", "run", "start"]
=======
dockerfile
CopyEdit
FROM node:20-alpine as build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build
FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
>>>>>>> ea6a6b8 (Выгрузка новых и изменённых файлов моделей из docx)
