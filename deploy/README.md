# Деплой

Ubuntu, nginx, systemd. Код клонируется в `/opt/google-drive-server` и собирается на сервере.
Бэкенд слушает `127.0.0.1:8080`. nginx (сборка nginx.org с модулем `nginx-acme`) по домену из
`PUBLIC_HOST` отдаёт собранный фронтенд из `frontend/dist`, а `/api` и `/files` проксирует в бэкенд.
Сертификат Let's Encrypt nginx получает и продлевает сам, HTTP перенаправляется на HTTPS.

## Установка

nginx из репозитория nginx.org с модулем ACME:

```bash
sudo apt install curl gnupg2 ca-certificates lsb-release ubuntu-keyring
curl -fsSL https://nginx.org/keys/nginx_signing.key | gpg --dearmor | sudo tee /usr/share/keyrings/nginx-archive-keyring.gpg > /dev/null
echo "deb [signed-by=/usr/share/keyrings/nginx-archive-keyring.gpg] https://nginx.org/packages/ubuntu $(lsb_release -cs) nginx" | sudo tee /etc/apt/sources.list.d/nginx.list
printf 'Package: *\nPin: origin nginx.org\nPin: release o=nginx\nPin-Priority: 900\n' | sudo tee /etc/apt/preferences.d/99nginx
sudo apt update && sudo apt install nginx nginx-module-acme
sudo sed -i '1i load_module modules/ngx_http_acme_module.so;' /etc/nginx/nginx.conf
sudo install -d -o nginx -m 700 /var/cache/nginx/acme-letsencrypt
```

JDK, sbt и Node.js:

```bash
sudo apt install openjdk-21-jdk-headless apt-transport-https curl gnupg
echo "deb https://repo.scala-sbt.org/scalasbt/debian all main" | sudo tee /etc/apt/sources.list.d/sbt.list
curl -sL "https://keyserver.ubuntu.com/pks/lookup?op=get&search=0x2EE0EA64E40A89B84B2DF73499E82A75642AC823" | sudo -H gpg --no-default-keyring --keyring gnupg-ring:/etc/apt/trusted.gpg.d/scalasbt-release.gpg --import
sudo chmod 644 /etc/apt/trusted.gpg.d/scalasbt-release.gpg
sudo apt update && sudo apt install sbt
curl -fsSL https://deb.nodesource.com/setup_24.x | sudo -E bash -
sudo apt install nodejs
```

Код, секреты и данные:

```bash
sudo useradd --system --no-create-home --shell /usr/sbin/nologin drive-server
sudo mkdir /opt/google-drive-server && sudo chown "$USER:" /opt/google-drive-server
git clone https://github.com/HamzaAgaev/google-drive-server.git /opt/google-drive-server
cd /opt/google-drive-server

sudo install -m 600 /tmp/.env .env
sudo mkdir data && sudo install -m 644 /tmp/app.db data/app.db
sudo chown -R drive-server:drive-server data
```

`.env` и `data/app.db` (с refresh token) копируются с локальной машины в `/tmp` через `scp`.

Сервисы:

```bash
sbt -batch "assembly; shutdown" && cp target/google-drive-server.jar app.jar
(cd frontend && npm ci && npm run build)

sudo cp deploy/google-drive-server.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable --now google-drive-server

set -a; source .env; set +a
envsubst '$PUBLIC_HOST' < deploy/nginx.conf | sudo tee /etc/nginx/conf.d/google-drive-server.conf > /dev/null
sudo nginx -t && sudo systemctl reload nginx
```

DNS: A-запись `PUBLIC_HOST` на IP сервера. На роутере пробросить TCP-порты 80 и 443 на сервер;
если включён ufw: `sudo ufw allow 80/tcp && sudo ufw allow 443/tcp`.

## Обновление

На сервере:

```bash
/opt/google-drive-server/deploy/update.sh
```

Или с локальной машины (SSH-хост из `DEPLOY_HOST`):

```bash
deploy/deploy.sh
```

## Логи

```bash
journalctl -u google-drive-server -f
```
