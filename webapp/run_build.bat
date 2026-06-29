@echo off
cd "d:\BD\BD Test Program\upfeedv3\webapp"
npx next build > build_log.txt 2>&1
echo DONE >> build_log.txt