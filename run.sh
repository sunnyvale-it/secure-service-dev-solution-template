#!/bin/bash
# ==========================================
# Secure Service Developer Solution Template
# ==========================================
# 
# Instructions:
# 1. This script is the main entry point executed by the grader.
# 2. You can use this file to compile, setup, or directly run your solution.
# 3. The target web service URL is passed via the $API_URL environment variable.
# 
# Example (if using Python):
# python3 my_solution.py
#
# Example (if using Node.js):
# node index.js
#
# If you want, you can directly call the service URL in this script.
# Replace the line below with your actual implementation command/s:
export RESPONSE=$(curl -i -s -X GET "$API_URL")

# Please output the raw HTTP response from the target server
echo "RESPONSE: $RESPONSE"
