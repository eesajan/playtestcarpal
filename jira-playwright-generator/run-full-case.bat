@echo off
cd /d "%~dp0"
echo Running full case + job flow test...
set BASE_APP_URL=https://qa.carpal.com
npx playwright test generated-tests/recorded-full-case-with-job.spec.ts --headed
pause
