@echo off
cd /d C:\Users\skhan\Desktop\Shop_Site\shop-site
del /f /q backend_log.txt backend_log2.txt sql_stats.txt git_run.log 2>nul
git rm --cached backend_log.txt backend_log2.txt sql_stats.txt 2>nul
git config user.name "shaonict35"
git config user.email "shaonict35@gmail.com"
git add .
git commit --author="shaonict35 <shaonict35@gmail.com>" -m "Fix shop page bounce, sync homepage deals and brand offers with cPanel DB and admin panel" > git_run2.log 2>&1
git push -u origin main >> git_run2.log 2>&1
