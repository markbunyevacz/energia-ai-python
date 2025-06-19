@echo off
echo 🚀 Energia AI Python Environment Setup
echo ==================================================

if exist .venv\Scripts\python.exe (
    echo ✅ Virtual environment found
    
    echo.
    echo 📦 Installing dspy...
    .venv\Scripts\python.exe -m pip install --upgrade pip
    .venv\Scripts\python.exe -m pip install dspy
    
    echo.
    echo 🧪 Testing NJT crawler...
    .venv\Scripts\python.exe -c "from app.crawlers.njt_crawler import NJTCrawler; print('✅ NJT Crawler ready!')"
    
    echo.
    echo 📊 Environment info:
    .venv\Scripts\python.exe -c "import sys; print('Python:', sys.version); print('Location:', sys.executable)"
    
    echo.
    echo 🎯 Environment ready! Use these commands:
    echo   .venv\Scripts\python.exe your_script.py
    echo   .venv\Scripts\pip.exe install package_name
    
) else (
    echo ❌ Virtual environment not found
    echo Creating new virtual environment...
    python -m venv .venv
    echo ✅ Virtual environment created
)

pause 