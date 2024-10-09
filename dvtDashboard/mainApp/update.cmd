@REM Update Dashboard

@REM pull new code from git
cd C:\DMA-PRIME-dashboard\dvtDashboard
git checkout main
start "PullMain" /d "C:\DMA-PRIME-dashboard" git pull
timeout 15
taskkill /f /fi "WindowTitle eq PullMain"
taskkill /f /fi "ImageName eq git.exe"

@REM build new wheel and move it for safe keeping
python -m build --wheel
move /Y C:\DMA-PRIME-dashboard\dvtDashboard\dist\*.whl C:\DMA-PRIME\wheels 

@REM activate the python virtual environment and update the web application
cd C:\DMA-PRIME
call .venv\Scripts\activate
cd C:\DMA-PRIME\wheels
for /f %%i in ('dir /b/a-d/od/t:c') do set LAST=%%i
pip install %LAST% --force-reinstall