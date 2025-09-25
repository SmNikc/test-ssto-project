## 2. Инструкция для развертывания (deployment.md):
```markdown
# Инструкция по развертыванию на Linux сервере

## Системные требования
- Ubuntu 20.04+ / Debian 11+
- Node.js 16+ 
- PostgreSQL 12+
- Nginx (для reverse proxy)
- PM2 (для управления процессами)

## Важные параметры

### Порты
- Backend: 3001
- Frontend: 5173 (dev) / 80 (production)
- PostgreSQL: 5432

### Переменные окружения (backend)
```bash
# Создайте файл backend-nest/.env
PORT=3001
DB_HOST=localhost
DB_PORT=5432
DB_USER=ssto
DB_PASSWORD=<УСТАНОВИТЕ_ПАРОЛЬ>
DB_NAME=sstodb
NODE_ENV=production
SIMPLE_AUTH_MODE=false  # Включите Keycloak в production
KEYCLOAK_URL=http://your-keycloak:8080/realms/ssto