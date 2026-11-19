@echo off
title GlowGoodly - Complete Database Cleanup
color 0b
echo ==============================================================
echo       GLOWGOODLY - COMPLETE DUMMY DATA CLEANUP SCRIPT
echo ==============================================================
echo.
echo Deleting all dummy products, test orders, and fake test data...
echo.

cd /d "%~dp0\backend"
call npx tsx src/clean-dummy-products.ts

echo.
echo ==============================================================
echo Cleanup completed successfully! Store is now ready for real products.
echo ==============================================================
pause

