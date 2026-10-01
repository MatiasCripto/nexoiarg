#!/usr/bin/env bash
set -Eeuo pipefail

# Run once as root on the NexoIArg VPS. Never touches other virtual hosts.
stage=/home/nexo-web
archive="$stage/nexoiarg-release-final.tar.gz"
agent="$stage/agente-servidor-release-2026-10-01.js"
events="$stage/eventos-servidor-release-2026-10-01.js"
nginx_stage="$stage/nginx-nexoiarg-release-2026-10-01.conf"
site=/var/www/nexoiarg
agent_live=/opt/nexoiarg/agente/servidor.js
events_live=/opt/nexo-eventos/servidor.js
nginx_live=/etc/nginx/sites-available/nexoiarg
backup="/var/backups/nexoiarg/$(date -u +%Y%m%dT%H%M%SZ)"
new_site="$(mktemp -d /var/www/.nexoiarg-release.XXXXXXXX)"
changed=0

rollback() {
  local code=$?
  trap - ERR
  if (( changed )); then
    echo "Error durante la publicación. Restaurando NexoIArg desde $backup" >&2
    rsync -a --delete "$backup/site/" "$site/" || true
    install -o www-data -g www-data -m 0644 "$backup/agente-servidor.js" "$agent_live" || true
    install -o root -g root -m 0644 "$backup/eventos-servidor.js" "$events_live" || true
    install -o root -g root -m 0644 "$backup/nginx.conf" "$nginx_live" || true
    nginx -t && systemctl reload nginx || true
    systemctl restart nexoiarg-agente nexo-eventos || true
  fi
  rm -rf -- "$new_site"
  exit "$code"
}
trap rollback ERR

[[ $EUID -eq 0 ]] || { echo 'Se requiere la sesión root.' >&2; exit 1; }
for file in "$archive" "$agent" "$events" "$nginx_stage"; do
  [[ -f $file && ! -L $file ]] || { echo "Falta un archivo preparado: $file" >&2; exit 1; }
done
[[ -d $site && -f $site/google10be9b7173a3ecd9.html ]] || {
  echo 'Falta el directorio de NexoIArg o la verificación de Google.' >&2; exit 1;
}
tar -xzf "$archive" -C "$new_site"
for file in index.html privacidad.html agentes-ia-whatsapp.html automatizaciones-para-negocios.html paginas-web-para-comercios.html punto-de-venta-windows.html robots.txt sitemap.xml; do
  [[ -s $new_site/$file ]] || { echo "Falta $file en la versión nueva" >&2; exit 1; }
done
node --check "$agent"
node --check "$events"
install -o www-data -g www-data -m 0644 "$site/google10be9b7173a3ecd9.html" "$new_site/google10be9b7173a3ecd9.html"
chown -R www-data:www-data "$new_site"

mkdir -p "$backup/site"
rsync -a "$site/" "$backup/site/"
cp -p "$agent_live" "$backup/agente-servidor.js"
cp -p "$events_live" "$backup/eventos-servidor.js"
cp -p "$nginx_live" "$backup/nginx.conf"
echo "Respaldo: $backup"

changed=1
rsync -a "$new_site/" "$site/"
if [[ -f $site/index-backup-2026-08-08.html ]]; then
  mv "$site/index-backup-2026-08-08.html" "$backup/index-backup-2026-08-08.html"
fi
install -o www-data -g www-data -m 0644 "$agent" "$agent_live"
install -o root -g root -m 0644 "$events" "$events_live"
install -o root -g root -m 0644 "$nginx_stage" "$nginx_live"
nginx -t
systemctl restart nexoiarg-agente nexo-eventos
systemctl reload nginx
systemctl is-active --quiet nexoiarg-agente nexo-eventos nginx
curl --fail --silent --show-error --max-time 15 --resolve nexoiarg.com:443:127.0.0.1 https://nexoiarg.com/ >/dev/null
curl --fail --silent --show-error --max-time 15 --resolve nexoiarg.com:443:127.0.0.1 https://nexoiarg.com/agentes-ia-whatsapp.html >/dev/null
echo 'NexoIArg publicado. Servicios y dos páginas comprobados.'
rm -rf -- "$new_site"
