@echo off
title Legend of the Chivalric Fall
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0Play-Game.ps1"
if errorlevel 1 pause
