#!/bin/bash

# Budget Tracker Backend initialization script

# Setup SQLite database
if [ ! -f "database/budget.db" ]; then
    echo "Create SQLite database..."
    touch database/budget.db
fi

echo "Starting Budget Tracker Backend..."

# Check if virtual environment exists
if [[ ! -d "venv" && "$DEV_MODE_ENABLED" == "1" ]]; then
    echo "Creating virtual environment..."
    python3 -m venv venv
fi

if [ -d "venv" ]; then
    # Activate virtual environment
    echo "Activating virtual environment..."
    source venv/bin/activate
fi

# Install dependencies
echo "Installing dependencies..."
pip install -r requirements.txt
