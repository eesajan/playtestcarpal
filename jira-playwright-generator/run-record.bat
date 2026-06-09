@echo off
cd /d "%~dp0"
echo Starting Playwright recording helper...
echo.
echo This will:
echo  1. Log in to CarPal QA automatically
echo  2. Create a vehicle
echo  3. PAUSE - Playwright Inspector opens
echo  4. Click the Record button in the Inspector to capture more steps
echo.
set BASE_APP_URL=https://qa.carpal.com
npx playwright test generated-tests/record-more-flow.spec.ts --headed --debug
pause
