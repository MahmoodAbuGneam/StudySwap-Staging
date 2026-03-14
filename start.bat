@echo off
wt new-tab --title "StudySwap Backend" cmd /k "cd /d %~dp0backend && venv\Scripts\activate && uvicorn app.main:app --reload" ; new-tab --title "StudySwap Frontend" cmd /k "cd /d %~dp0frontend && npm run dev"
