@echo off
title Labyrinth: The Algorithmic Escape

echo Starting Labyrinth Backend...
start "Labyrinth Backend" cmd /k "cd backend && npm run dev"

timeout /t 2 >nul

echo Starting Labyrinth Frontend...
start "Labyrinth Frontend" cmd /k "cd frontend && npm run dev"

echo Boot sequence initiated. The browser should open shortly.
