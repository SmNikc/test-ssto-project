@echo off
setlocal
REM при необходимости скорректируйте пути/порты
py -m pip install --upgrade pip
py -m pip install -r "C:\Projects\test-ssto-project\scripts\requirements.txt"

py "C:\Projects\test-ssto-project\scripts\seed_keycloak.py" ^
  --base http://localhost:8080 ^
  --realm ssto ^
  --admin admin ^
  --admin-pass admin ^
  --origin http://localhost:5173 ^
  --frontend-client-id ssto-local-client ^
  --backend-client-id ssto-backend ^
  --csv "C:\Projects\test-ssto-project\scripts\users.csv"
endlocal
