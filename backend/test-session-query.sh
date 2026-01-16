#!/bin/bash

# Test script for session query API
# This script tests the GET /api/session/:sessionId endpoint

echo "Testing Session Query API"
echo "========================="
echo ""

# Start the server in the background (if not already running)
# npm start &
# SERVER_PID=$!
# sleep 2

BASE_URL="http://localhost:3000"

echo "1. Creating a new session..."
CREATE_RESPONSE=$(curl -s -X POST "$BASE_URL/api/session/create")
echo "Response: $CREATE_RESPONSE"
echo ""

# Extract sessionId from response
SESSION_ID=$(echo $CREATE_RESPONSE | grep -o '"sessionId":"[^"]*"' | cut -d'"' -f4)
echo "Created session ID: $SESSION_ID"
echo ""

echo "2. Querying the session..."
QUERY_RESPONSE=$(curl -s "$BASE_URL/api/session/$SESSION_ID")
echo "Response: $QUERY_RESPONSE"
echo ""

echo "3. Querying a non-existent session..."
NON_EXISTENT_ID="00000000-0000-4000-8000-000000000000"
NOT_FOUND_RESPONSE=$(curl -s "$BASE_URL/api/session/$NON_EXISTENT_ID")
echo "Response: $NOT_FOUND_RESPONSE"
echo ""

echo "4. Testing with invalid session ID..."
INVALID_RESPONSE=$(curl -s "$BASE_URL/api/session/invalid-id")
echo "Response: $INVALID_RESPONSE"
echo ""

# Clean up
# kill $SERVER_PID 2>/dev/null

echo "Test completed!"
