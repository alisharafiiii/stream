#!/bin/bash
export $(cat .env.local | grep -v '^#' | xargs)
node scripts/check-pfps-simple.js
