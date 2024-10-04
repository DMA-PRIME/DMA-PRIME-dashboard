@REM Update Dashboard

@REM pull new code from git
cd C:\DMA-PRIME-dashboard\dvtDashboard
git checkout main
git pull

@REM build new wheel and move it for safe keeping
python -m build --wheel
move C:\DMA-PRIME-dashboard\dvtDashboard\dist\*.whl C:\DMA-PRIME\wheels /y

@REM activate the python virtual environment and update the web application
cd C:\DMA-PRIME
source venv\Scripts\activate
cd C:\DMA-PRIME\wheels
for /f %%i in ('dir /b/a-d/od/t:c') do set LAST=%%i
pip install %LAST% --force-reinstall

@REM restart the server so the updated website is served
shutdown /r /soft