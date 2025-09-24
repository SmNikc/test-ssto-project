param(
  [string]$KeycloakBase       = "http://localhost:8080",
  [string]$Realm              = "ssto",
  [string]$AdminUser          = "admin",
  [string]$AdminPassword      = "admin",
  [string]$FrontendOrigin     = "http://localhost:5173",
  [string]$FrontendClientId   = "ssto-local-client",
  [string]$BackendClientId    = "ssto-backend"
)

Write-Host "===> Keycloak seed started for realm '$Realm' at $KeycloakBase"

function Get-AdminToken {
  $resp = Invoke-RestMethod -Method Post `
    -Uri "$KeycloakBase/realms/master/protocol/openid-connect/token" `
    -ContentType "application/x-www-form-urlencoded" `
    -Body "client_id=admin-cli&username=$AdminUser&password=$AdminPassword&grant_type=password"
  return $resp.access_token
}

function Ensure-Realm([string]$realm, $headers) {
  try {
    Invoke-RestMethod -Method Get -Uri "$KeycloakBase/admin/realms/$realm" -Headers $headers | Out-Null
    Write-Host "Realm '$realm' уже существует"
  } catch {
    Write-Host "Создаю realm '$realm'..."
    $body = @{ realm=$realm; enabled=$true } | ConvertTo-Json
    Invoke-RestMethod -Method Post -Uri "$KeycloakBase/admin/realms" -Headers $headers -ContentType "application/json" -Body $body | Out-Null
  }
}

function Ensure-RealmRole([string]$realm, [string]$roleName, $headers) {
  try {
    Invoke-RestMethod -Method Get -Uri "$KeycloakBase/admin/realms/$realm/roles/$roleName" -Headers $headers | Out-Null
    Write-Host "Роль '$roleName' уже существует"
  } catch {
    $body = @{ name=$roleName } | ConvertTo-Json
    Invoke-RestMethod -Method Post -Uri "$KeycloakBase/admin/realms/$realm/roles" -Headers $headers -ContentType "application/json" -Body $body | Out-Null
    Write-Host "Создана роль '$roleName'"
  }
}

function Get-ClientId([string]$realm, [string]$clientId, $headers) {
  $arr = Invoke-RestMethod -Method Get -Uri "$KeycloakBase/admin/realms/$realm/clients?clientId=$([uri]::EscapeDataString($clientId))" -Headers $headers
  if ($arr -and $arr.Count -gt 0) { return $arr[0].id } else { return $null }
}

function Ensure-FrontendClient([string]$realm, [string]$clientId, [string]$origin, $headers) {
  $cid = Get-ClientId $realm $clientId $headers
  if (-not $cid) {
    Write-Host "Создаю клиент '$clientId' (public, SPA)..."
    $body = @{
      clientId                   = $clientId
      publicClient               = $true
      directAccessGrantsEnabled  = $true   # удобно на dev
      standardFlowEnabled        = $true   # OIDC Code + PKCE
      redirectUris               = @("$origin/*")
      webOrigins                 = @($origin)
      rootUrl                    = $origin
      enabled                    = $true
    } | ConvertTo-Json -Depth 7
    Invoke-RestMethod -Method Post -Uri "$KeycloakBase/admin/realms/$realm/clients" -Headers $headers -ContentType "application/json" -Body $body | Out-Null
    $cid = Get-ClientId $realm $clientId $headers
  } else {
    # Обновим URIs/Origins на всякий случай
    $client = Invoke-RestMethod -Method Get -Uri "$KeycloakBase/admin/realms/$realm/clients/$cid" -Headers $headers
    $client.redirectUris = @("$origin/*")
    $client.webOrigins   = @($origin)
    $client.rootUrl      = $origin
    Invoke-RestMethod -Method Put -Uri "$KeycloakBase/admin/realms/$realm/clients/$cid" -Headers $headers -ContentType "application/json" -Body ($client | ConvertTo-Json -Depth 7) | Out-Null
    Write-Host "Клиент '$clientId' обновлён"
  }
}

function Ensure-BackendClient([string]$realm, [string]$clientId, $headers) {
  $cid = Get-ClientId $realm $clientId $headers
  if (-not $cid) {
    Write-Host "Создаю клиент '$clientId' (bearer-only)..."
    $body = @{
      clientId               = $clientId
      bearerOnly             = $true
      standardFlowEnabled    = $false
      directAccessGrantsEnabled = $false
      enabled                = $true
    } | ConvertTo-Json -Depth 7
    Invoke-RestMethod -Method Post -Uri "$KeycloakBase/admin/realms/$realm/clients" -Headers $headers -ContentType "application/json" -Body $body | Out-Null
  } else {
    Write-Host "Клиент '$clientId' уже существует"
  }
}

function Ensure-User([string]$realm, [string]$email, [string]$password, [string]$roleName, $headers) {
  $userArr = Invoke-RestMethod -Method Get -Uri "$KeycloakBase/admin/realms/$realm/users?username=$([uri]::EscapeDataString($email))" -Headers $headers
  if (-not $userArr -or $userArr.Count -eq 0) {
    $uBody = @{
      username      = $email
      email         = $email
      enabled       = $true
      emailVerified = $true
    } | ConvertTo-Json
    Invoke-RestMethod -Method Post -Uri "$KeycloakBase/admin/realms/$realm/users" -Headers $headers -ContentType "application/json" -Body $uBody | Out-Null
    $userArr = Invoke-RestMethod -Method Get -Uri "$KeycloakBase/admin/realms/$realm/users?username=$([uri]::EscapeDataString($email))" -Headers $headers
  }
  $userId = $userArr[0].id

  # пароль
  $cred = @{ type="password"; value=$password; temporary=$false } | ConvertTo-Json
  Invoke-RestMethod -Method Put -Uri "$KeycloakBase/admin/realms/$realm/users/$userId/reset-password" -Headers $headers -ContentType "application/json" -Body $cred | Out-Null

  # назначение роли
  $role = Invoke-RestMethod -Method Get -Uri "$KeycloakBase/admin/realms/$realm/roles/$roleName" -Headers $headers
  $assign = @(@{ id=$role.id; name=$role.name }) | ConvertTo-Json
  Invoke-RestMethod -Method Post -Uri "$KeycloakBase/admin/realms/$realm/users/$userId/role-mappings/realm" -Headers $headers -ContentType "application/json" -Body $assign | Out-Null

  Write-Host "Пользователь $email готов (роль: $roleName)"
}

# === Выполнение ===
$token   = Get-AdminToken
$headers = @{ Authorization = "Bearer $token" }

Ensure-Realm $Realm $headers

# Роли
"admin","operator","client" | ForEach-Object { Ensure-RealmRole $Realm $_ $headers }

# Клиенты
Ensure-FrontendClient $Realm $FrontendClientId $FrontendOrigin $headers
Ensure-BackendClient  $Realm $BackendClientId  $headers

# Пользователи
Ensure-User $Realm "operator1@test.com" "password123" "operator" $headers
Ensure-User $Realm "client1@test.com"   "password123" "client"   $headers

Write-Host "===> Seed завершён успешно."
