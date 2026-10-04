# Деплой

Ubuntu, nginx, systemd. Приложение слушает `127.0.0.1:8080`, nginx отдаёт его на порту `8081`.

## Установка

Локально:

```bash
sbt assembly
scp target/out/jvm/scala-3.9.0/google-drive-server/google-drive-server.jar .env data/app.db \
  deploy/google-drive-server.service deploy/nginx.conf server:/tmp/
```

На сервере:

```bash
sudo apt install openjdk-21-jre-headless
sudo useradd --system --no-create-home --shell /usr/sbin/nologin drive-server

sudo mkdir -p /opt/google-drive-server/data
sudo mv /tmp/google-drive-server.jar /opt/google-drive-server/app.jar
sudo mv /tmp/.env /opt/google-drive-server/.env
sudo mv /tmp/app.db /opt/google-drive-server/data/app.db
sudo chmod 600 /opt/google-drive-server/.env
sudo chown -R drive-server:drive-server /opt/google-drive-server/data

sudo mv /tmp/google-drive-server.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable --now google-drive-server

sudo mv /tmp/nginx.conf /etc/nginx/sites-available/google-drive-server
sudo ln -s /etc/nginx/sites-available/google-drive-server /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
```

Если включён ufw: `sudo ufw allow 8081/tcp`.

## Обновление

```bash
sbt assembly
scp target/out/jvm/scala-3.9.0/google-drive-server/google-drive-server.jar server:/tmp/
ssh server 'sudo mv /tmp/google-drive-server.jar /opt/google-drive-server/app.jar && sudo systemctl restart google-drive-server'
```

## Логи

```bash
journalctl -u google-drive-server -f
```
