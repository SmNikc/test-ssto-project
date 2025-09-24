#!/usr/bin/env python3
# -*- coding: utf-8 -*-
# Keycloak seeder for realm 'ssto' (roles, clients, users).

import argparse
import csv
import os
import sys
from typing import List, Tuple, Optional
import requests

requests.packages.urllib3.disable_warnings()

def get_admin_token(base: str, admin_user: str, admin_pass: str) -> str:
    url = f"{base}/realms/master/protocol/openid-connect/token"
    data = {"client_id":"admin-cli","username":admin_user,"password":admin_pass,"grant_type":"password"}
    r = requests.post(url, data=data, timeout=30); r.raise_for_status()
    return r.json()["access_token"]

def kc_get(url: str, token: str, **kw):
    headers = kw.pop("headers", {}); headers["Authorization"] = f"Bearer {token}"
    return requests.get(url, headers=headers, timeout=30, **kw)

def kc_post(url: str, token: str, json_body=None, **kw):
    headers = kw.pop("headers", {}); headers["Authorization"] = f"Bearer {token}"
    return requests.post(url, headers=headers, json=json_body, timeout=30, **kw)

def kc_put(url: str, token: str, json_body=None, **kw):
    headers = kw.pop("headers", {}); headers["Authorization"] = f"Bearer {token}"
    return requests.put(url, headers=headers, json=json_body, timeout=30, **kw)

def ensure_realm(base: str, realm: str, token: str):
    r = kc_get(f"{base}/admin/realms/{realm}", token)
    if r.status_code == 200: print(f"[realm] '{realm}' уже существует"); return
    if r.status_code == 404:
        r2 = kc_post(f"{base}/admin/realms", token, json_body={"realm":realm,"enabled":True})
        if r2.status_code not in (201,204): raise RuntimeError(f"Не удалось создать realm: {r2.status_code} {r2.text}")
        print(f"[realm] создан '{realm}'"); return
    raise RuntimeError(f"Проверка realm вернула {r.status_code}: {r.text}")

def ensure_role(base: str, realm: str, role: str, token: str):
    r = kc_get(f"{base}/admin/realms/{realm}/roles/{role}", token)
    if r.status_code == 200: print(f"[role] '{role}' уже существует"); return
    if r.status_code == 404:
        r2 = kc_post(f"{base}/admin/realms/{realm}/roles", token, json_body={"name":role})
        if r2.status_code not in (201,204): raise RuntimeError(f"Не удалось создать роль {role}: {r2.status_code} {r2.text}")
        print(f"[role] создана '{role}'"); return
    raise RuntimeError(f"Проверка роли '{role}' вернула {r.status_code}: {r.text}")

def get_client_internal_id(base: str, realm: str, client_id: str, token: str) -> Optional[str]:
    r = kc_get(f"{base}/admin/realms/{realm}/clients", token, params={"clientId":client_id})
    r.raise_for_status(); arr = r.json()
    return (arr[0]["id"] if isinstance(arr, list) and arr else None)

def ensure_frontend_client(base: str, realm: str, client_id: str, origin: str, token: str):
    cid = get_client_internal_id(base, realm, client_id, token)
    desired = {"clientId":client_id,"publicClient":True,"directAccessGrantsEnabled":True,"standardFlowEnabled":True,
               "redirectUris":[f"{origin}/*"],"webOrigins":[origin],"rootUrl":origin,"enabled":True,
               "attributes":{"pkce.code.challenge.method":"S256"}}
    if cid is None:
        r = kc_post(f"{base}/admin/realms/{realm}/clients", token, json_body=desired)
        if r.status_code not in (201,204): raise RuntimeError(f"Не удалось создать клиент {client_id}: {r.status_code} {r.text}")
        print(f"[client] создан '{client_id}' (public SPA)")
    else:
        cur = kc_get(f"{base}/admin/realms/{realm}/clients/{cid}", token); cur.raise_for_status()
        rep = cur.json(); rep.update(desired)
        r = kc_put(f"{base}/admin/realms/{realm}/clients/{cid}", token, json_body=rep)
        if r.status_code not in (204,201): raise RuntimeError(f"Не удалось обновить клиент {client_id}: {r.status_code} {r.text}")
        print(f"[client] обновлён '{client_id}'")

def ensure_backend_client(base: str, realm: str, client_id: str, token: str):
    cid = get_client_internal_id(base, realm, client_id, token)
    desired = {"clientId":client_id,"bearerOnly":True,"standardFlowEnabled":False,"directAccessGrantsEnabled":False,"enabled":True}
    if cid is None:
        r = kc_post(f"{base}/admin/realms/{realm}/clients", token, json_body=desired)
        if r.status_code not in (201,204): raise RuntimeError(f"Не удалось создать клиент {client_id}: {r.status_code} {r.text}")
        print(f"[client] создан '{client_id}' (bearer-only)")
    else:
        cur = kc_get(f"{base}/admin/realms/{realm}/clients/{cid}", token); cur.raise_for_status()
        rep = cur.json(); rep.update(desired)
        r = kc_put(f"{base}/admin/realms/{realm}/clients/{cid}", token, json_body=rep)
        if r.status_code not in (204,201): raise RuntimeError(f"Не удалось обновить клиент {client_id}: {r.status_code} {r.text}")
        print(f"[client] обновлён '{client_id}'")

def get_user_id(base: str, realm: str, username: str, token: str) -> Optional[str]:
    r = kc_get(f"{base}/admin/realms/{realm}/users", token, params={"username":username})
    r.raise_for_status(); arr = r.json()
    return (arr[0]["id"] if isinstance(arr, list) and arr else None)

def ensure_user(base: str, realm: str, email: str, password: str, role: str, token: str):
    uid = get_user_id(base, realm, email, token)
    if uid is None:
        r = kc_post(f"{base}/admin/realms/{realm}/users", token, json_body={"username":email,"email":email,"enabled":True,"emailVerified":True})
        if r.status_code not in (201,204): raise RuntimeError(f"Не удалось создать пользователя {email}: {r.status_code} {r.text}")
        uid = get_user_id(base, realm, email, token); print(f"[user] создан '{email}'")
    else:
        print(f"[user] '{email}' уже существует")
    r = kc_put(f"{base}/admin/realms/{realm}/users/{uid}/reset-password", token,
               json_body={"type":"password","value":password,"temporary":False})
    if r.status_code not in (204,201): raise RuntimeError(f"Не удалось установить пароль {email}: {r.status_code} {r.text}")
    rr = kc_get(f"{base}/admin/realms/{realm}/roles/{role}", token)
    if rr.status_code != 200: raise RuntimeError(f"Роль '{role}' не найдена")
    role_rep = rr.json()
    r = kc_post(f"{base}/admin/realms/{realm}/users/{uid}/role-mappings/realm", token,
                json_body=[{"id":role_rep["id"],"name":role_rep["name"]}])
    if r.status_code not in (204,201): raise RuntimeError(f"Не удалось назначить роль {role} пользователю {email}: {r.status_code} {r.text}")
    print(f"[user] пароль установлен и роль '{role}' назначена для '{email}'")

def read_users_from_csv(csv_path: str) -> List[Tuple[str, str, str]]:
    users: List[Tuple[str,str,str]] = []
    with open(csv_path, "r", encoding="utf-8-sig") as f:
        reader = csv.DictReader(f)
        for row in reader:
            email = (row.get("email") or row.get("Email") or "").strip()
            password = (row.get("password") or row.get("Пароль") or "").strip()
            role = (row.get("role") or row.get("Роль") or "").strip()
            if email and password and role:
                users.append((email, password, role))
    return users

def main():
    ap = argparse.ArgumentParser(description="Seed Keycloak for realm 'ssto'")
    ap.add_argument("--base", default=os.getenv("KC_BASE","http://localhost:8080"))
    ap.add_argument("--realm", default=os.getenv("KC_REALM","ssto"))
    ap.add_argument("--admin", dest="admin_user", default=os.getenv("KC_ADMIN","admin"))
    ap.add_argument("--admin-pass", dest="admin_pass", default=os.getenv("KC_ADMIN_PASS","admin"))
    ap.add_argument("--origin", default=os.getenv("FRONTEND_ORIGIN","http://localhost:5173"))
    ap.add_argument("--frontend-client-id", default=os.getenv("FRONTEND_CLIENT_ID","ssto-local-client"))
    ap.add_argument("--backend-client-id", default=os.getenv("BACKEND_CLIENT_ID","ssto-backend"))
    ap.add_argument("--csv", help="Путь к CSV (email,password,role)")
    args = ap.parse_args()

    token = get_admin_token(args.base, args.admin_user, args.admin_pass)
    ensure_realm(args.base, args.realm, token)
    for role in ("admin","operator","client"): ensure_role(args.base, args.realm, role, token)
    ensure_frontend_client(args.base, args.realm, args.frontend_client_id, args.origin, token)
    ensure_backend_client(args.base, args.realm, args.backend_client_id, token)

    users = []
    if args.csv and os.path.isfile(args.csv):
        users = read_users_from_csv(args.csv)
        if not users: print(f"[warn] CSV '{args.csv}' пустой — создам дефолтных двух")
    if not users:
        users = [("operator1@test.com","password123","operator"),
                 ("client1@test.com","password123","client")]
    for email, pwd, role in users: ensure_user(args.base, args.realm, email, pwd, role, token)
    print("\n=== Seed завершён успешно ===")

if __name__ == "__main__":
    try: main()
    except Exception as e:
        print(f"\n[ERROR] {e}"); sys.exit(1)
