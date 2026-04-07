@echo off
start cmd /k "cd /d E:\HireSense\frontend && pnpm run dev"
start cmd /k "cd /d E:\HireSense\backend && python main.py"
start cmd /k "cd /d E:\HireSense\frontend\supabase && supabase start"