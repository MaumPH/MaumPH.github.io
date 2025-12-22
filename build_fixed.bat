@echo off
REM UTF-8 encoding
chcp 65001 > nul

echo.
echo ==========================================
echo    Program Reaction Generator - Build
echo ==========================================
echo.

REM Step 1: Check Python
echo Step 1: Checking Python installation...
python --version >nul 2>&1
if errorlevel 1 (
    echo.
    echo [ERROR] Python is NOT installed!
    echo.
    echo Please follow these steps:
    echo 1. Go to: https://www.python.org/downloads/
    echo 2. Download the latest version
    echo 3. During installation, CHECK "Add Python to PATH"
    echo 4. Restart this script
    echo.
    pause
    exit /b 1
)
echo [OK] Python is installed
python --version
echo.

REM Step 2: Install libraries
echo Step 2: Installing Python libraries...
python -m pip install --upgrade pip
python -m pip install -r requirements.txt
if errorlevel 1 (
    echo.
    echo [ERROR] Library installation failed
    echo.
    echo Try manually:
    echo   python -m pip install openpyxl requests pyinstaller
    echo.
    pause
    exit /b 1
)
echo [OK] Libraries installed
echo.

REM Step 3: Check data files
echo Step 3: Checking data files...
if not exist "program_data.json" (
    echo.
    echo [ERROR] program_data.json file not found
    echo Please run: python excel_to_json.py
    echo.
    pause
    exit /b 1
)
echo [OK] program_data.json exists

if not exist "emotion_guide.json" (
    echo.
    echo [ERROR] emotion_guide.json file not found
    echo Please ensure the file exists in the current directory
    echo.
    pause
    exit /b 1
)
echo [OK] emotion_guide.json exists
echo.

REM Step 4: Build executable
echo Step 4: Building executable...
echo This may take 2-5 minutes...
echo.
python -m PyInstaller --onefile --windowed --add-data "program_data.json;." --add-data "emotion_guide.json;." --name "ReactionGenerator_v5" "main v5.py"

echo.
if exist "dist\ReactionGenerator_v5.exe" (
    echo ==========================================
    echo [SUCCESS] Build completed!
    echo ==========================================
    echo.
    echo Location: dist\ReactionGenerator_v5.exe
    echo File size: ~250MB
    echo.
    echo You can now distribute ReactionGenerator_v5.exe
    echo No Python installation needed on target PC
    echo.
) else (
    echo [FAILED] Build process failed
    echo.
    echo Please check error messages above
    echo Common issues:
    echo - Antivirus blocking PyInstaller
    echo - Insufficient disk space
    echo - Missing dependencies
    echo.
)

pause
