# HandasaimWeb
The official Handasaim(+) Schedule app.
### Configuring on server
Directory tree:
```
Root Directory/
    public/
        home - Symlink to sources/app
        .htaccess - To redirect to home/
    sources/
        app/ - WebApp Directory
            files/
                schedule.json - Schedule JSON - For HandasaimScheduler
        scheduler/ - Scheduler directory
            execute.php
            configuration.json
            scheduler.jar
        backuper/ - Backuper directory
            execute.php
            configuration.json
```

#### Files:

##### public/.htaccess
```apacheconfig
Redirect /index.html /home/
```

##### public/app
Run `ln -s $PWD/sources/app public/app` from `Root Directory`

##### sources/app
This directory (The WebApp)

##### sources/scheduler/execute.php
```php
<?php

const SUPPRESS = " > /dev/null 2>&1";
const DESTINATION_FILE = __DIR__ . DIRECTORY_SEPARATOR . ".." . DIRECTORY_SEPARATOR . "app" . DIRECTORY_SEPARATOR . "files" . DIRECTORY_SEPARATOR . "schedule.json";
const CONFIGURATION_FILE = __DIR__ . DIRECTORY_SEPARATOR . "configuration.json";
const SCHEDULER_FILE = __DIR__ . DIRECTORY_SEPARATOR . "scheduler.jar";

echo "Loading configuration...\n";
$configuration = json_decode(file_get_contents(CONFIGURATION_FILE));
echo "Lookup page: " . $configuration->lookup . "\n";
echo "Executing scheduler with destination file " . DESTINATION_FILE . "\n";
shell_exec("java -jar ".SCHEDULER_FILE." ".$configuration->lookup." ".DESTINATION_FILE);
echo "Done\n";
```

##### sources/scheduler/configuration.json
```json
{
  "lookup":"http://handasaim.co.il/2018/08/31/%D7%9E%D7%A2%D7%A8%D7%9B%D7%AA-%D7%95%D7%A9%D7%99%D7%A0%D7%95%D7%99%D7%99%D7%9D-2/"
}
```

##### sources/scheduler/scheduler.jar
Grab latest from [Here](https://github.com/NadavTasher/HandasaimScheduler/releases/latest)

##### sources/backuper/execute.php

```php
<?php

const SUPPRESS = " > /dev/null 2>&1";
const SOURCE_DIRECTORY = __DIR__ . DIRECTORY_SEPARATOR . ".." . DIRECTORY_SEPARATOR . "app";
const DESTINATION_DIRECTORY = __DIR__ . DIRECTORY_SEPARATOR . "LastResort";
const CONFIGURATION_FILE = __DIR__ . DIRECTORY_SEPARATOR . "configuration.json";

echo "Loading configuration...\n";
$configuration = json_decode(file_get_contents(CONFIGURATION_FILE));
echo "Repository remote: " . $configuration->remote . "\n";
echo "Removing destination\n";
shell_exec("rm -rf " . DESTINATION_DIRECTORY);
echo "Cloning remote\n";
shell_exec("git clone -q " . $configuration->remote . " " . DESTINATION_DIRECTORY);
echo "Copying files\n";
shell_exec("cp -r " . SOURCE_DIRECTORY . " " . DESTINATION_DIRECTORY);
echo "Committing and pushing\n";
shell_exec("cd " . DESTINATION_DIRECTORY . " && git config credential.helper store && git add --all -f && git commit -a -m 'Automated' && git push -q --all");
echo "Done\n";
```

##### sources/backuper/configuration.json

```json
{
  "remote": "https://github.com/HWBB/LastResort.git"
}
```

#### Installation
Add this to your crontab:
```
*/5 * * * * php Root Directory/sources/scheduler/execute.php
*/10 * * * * php Root Directory/sources/backuper/execute.php
```

Execute `php Root Directory/sources/backup/execute.php` and enter your credentials

### Instructions for installing on a plasma
You will need to trigger the following command once, every login.
```
chromium --incognito --password-store=basic --start-fullscreen https://handasaim.app
```
#### Adding the command to startup script
```
mkdir ~/.config/autostart
echo [Desktop\ Entry] > ~/.config/autostart/Handasaim.desktop
echo Type=Application >> ~/.config/autostart/Handasaim.desktop
echo Exec=chromium\ --incognito\ --password-store=basic\ --start-fullscreen\ https://handasaim.app >> ~/.config/autostart/Handasaim.desktop
echo Hidden=false >> ~/.config/autostart/Handasaim.desktop
echo NoDisplay=false >> ~/.config/autostart/Handasaim.desktop
echo X-GNOME-Autostart-enabled=true >> ~/.config/autostart/Handasaim.desktop
echo Name=Handasaim+ >> ~/.config/autostart/Handasaim.desktop
```
File contents:
```
[Desktop Entry]
Type=Application
Exec=chromium --incognito\ --password-store=basic\ --start-fullscreen https://handasaim.app
Hidden=false
NoDisplay=false
X-GNOME-Autostart-enabled=true
Name=Handasaim+
```
#### Uninstalling
```
rm ~/.config/autostart/Handasaim.desktop
```