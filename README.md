# Handasaim Web App
This directory, `resources`, is the official repository for the Handasaim+ Web App.

### Instructions for installing on a plasma
You will need to trigger the following command once, every login.
```
chromium --incognito --password-store=basic --start-fullscreen https://hwbb.github.io/h/plasma.html
```
#### Adding the command to startup script
```
mkdir ~/.config/autostart
echo [Desktop\ Entry] > ~/.config/autostart/Handasaim.desktop
echo Type=Application >> ~/.config/autostart/Handasaim.desktop
echo Exec=chromium\ --incognito\ --password-store=basic\ --start-fullscreen\ https://hwbb.github.io/h/plasma.html >> ~/.config/autostart/Handasaim.desktop
echo Hidden=false >> ~/.config/autostart/Handasaim.desktop
echo NoDisplay=false >> ~/.config/autostart/Handasaim.desktop
echo X-GNOME-Autostart-enabled=true >> ~/.config/autostart/Handasaim.desktop
echo Name=Handasaim+ >> ~/.config/autostart/Handasaim.desktop
```
File contents:
```
[Desktop Entry]
Type=Application
Exec=chromium --incognito\ --password-store=basic\ --start-fullscreen https://hwbb.github.io/h/plasma.html
Hidden=false
NoDisplay=false
X-GNOME-Autostart-enabled=true
Name=Handasaim+
```
#### Uninstalling
```
rm ~/.config/autostart/Handasaim.desktop
```