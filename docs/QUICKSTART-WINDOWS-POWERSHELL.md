# Быстрый старт (Windows PowerShell)

> Требования: Docker Desktop, Node.js 18+ и npm, Git.  
> Папка проекта: `C:\Projects\test-ssto-project`.

## 0) Поднимаем БД (Postgres + pgAdmin)

```powershell
cd C:\Projects\test-ssto-project
docker compose up -d postgres pgadmin
# если у вас старая версия Docker Compose:
# docker-compose up -d postgres pgadmin
