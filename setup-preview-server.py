#!/usr/bin/env python3
import os
import sys
import re
import shutil
import subprocess

def main():
    if os.geteuid() != 0:
        print("❌ Bitte führe das Skript mit sudo / als root aus: sudo python3 setup-preview-server.py")
        sys.exit(1)

    # 1. Apache-Konfigurationsdatei suchen
    search_dirs = [
        "/etc/apache2/sites-available",
        "/etc/apache2/sites-enabled",
        "/etc/apache2/conf-available",
        "/etc/apache2/conf-enabled",
        "/etc/apache2"
    ]

    target_file = None
    target_content = ""

    for d in search_dirs:
        if not os.path.isdir(d):
            continue
        for fname in os.listdir(d):
            if fname.endswith(".conf"):
                fpath = os.path.join(d, fname)
                try:
                    with open(fpath, "r", encoding="utf-8", errors="ignore") as f:
                        c = f.read()
                        if "alissas-blog" in c:
                            target_file = fpath
                            target_content = c
                            break
                except Exception:
                    pass
        if target_file:
            break

    if not target_file:
        print("❌ Keine Apache-Konfigurationsdatei mit 'alissas-blog' gefunden.")
        print("Bitte prüfe manuell mit: grep -rn 'alissas-blog' /etc/apache2/")
        sys.exit(1)

    print(f"🔍 Konfigurationsdatei gefunden: {target_file}")

    if "allow_crawler" in target_content:
        print("ℹ️ allow_crawler ist bereits in der Konfiguration vorhanden.")
        print("Prüfe Apache-Syntax...")
        subprocess.run(["apache2ctl", "configtest"])
        subprocess.run(["systemctl", "reload", "apache2"])
        print("✅ Apache neu geladen.")
        return

    # Backup erstellen
    backup_file = f"{target_file}.bak_preview"
    shutil.copy2(target_file, backup_file)
    print(f"💾 Backup erstellt: {backup_file}")

    crawler_def = (
        "\n    # Erlaube Social-Media-Bots (WhatsApp, iMessage, Facebook etc.) für Vorschaubilder\n"
        '    SetEnvIfNoCase User-Agent "(facebookexternalhit|WhatsApp|Applebot|Twitterbot|TelegramBot|LinkedInBot|Slackbot|Discordbot|SkypeUriPreview)" allow_crawler=1\n'
    )

    require_block = (
        "    <RequireAny>\n"
        "        Require valid-user\n"
        "        Require env allow_crawler\n"
        "    </RequireAny>"
    )

    img_block = (
        "\n<Location /alissas-blog/img>\n"
        "    Require all granted\n"
        "</Location>\n"
    )

    new_content = target_content

    # Ersetze Require valid-user innerhalb von alissas-blog
    if "<RequireAny>" not in new_content:
        # Require valid-user ersetzen
        new_content = re.sub(
            r"(\bRequire\s+valid-user\b)",
            crawler_def + "\n" + require_block,
            new_content,
            count=1
        )
    else:
        # Falls RequireAny schon existiert, füge allow_crawler hinzu
        if "Require env allow_crawler" not in new_content:
            new_content = re.sub(
                r"(<RequireAny>[\s\S]*?)(\s*</RequireAny>)",
                r"\1\n        Require env allow_crawler\2",
                new_content,
                count=1
            )
            new_content = crawler_def + "\n" + new_content

    # Falls noch kein separater img-Block existiert
    if "/alissas-blog/img" not in new_content:
        # Nach </Location> oder am Ende des VirtualHosts einfügen
        loc_end = re.search(r"</Location>", new_content)
        if loc_end:
            idx = loc_end.end()
            new_content = new_content[:idx] + "\n" + img_block + new_content[idx:]
        else:
            new_content += "\n" + img_block

    # Datei schreiben
    with open(target_file, "w", encoding="utf-8") as f:
        f.write(new_content)

    print("📝 Änderungen in Apache-Konfiguration geschrieben.")
    print("🧪 Teste Apache-Konfiguration (apache2ctl configtest)...")

    test_res = subprocess.run(["apache2ctl", "configtest"], capture_output=True, text=True)
    if test_res.returncode != 0 or "Syntax OK" not in test_res.stderr:
        print("❌ Syntax-Fehler in Apache-Konfiguration:")
        print(test_res.stderr)
        print("Wiederherstellen des Backups...")
        shutil.copy2(backup_file, target_file)
        sys.exit(1)

    print("✅ Syntax OK. Lade Apache neu (systemctl reload apache2)...")
    reload_res = subprocess.run(["systemctl", "reload", "apache2"], capture_output=True, text=True)
    if reload_res.returncode == 0:
        print("🎉 ERFOLG! WhatsApp & Social-Media-Crawler können Vorschaubilder und Titel nun abrufen.")
    else:
        print("⚠️ Konnte Apache nicht neu laden:")
        print(reload_res.stderr)

if __name__ == "__main__":
    main()
