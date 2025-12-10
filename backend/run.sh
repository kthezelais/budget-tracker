#!/bin/bash

# Budget Tracker Backend initialization script

# Start the server
if [ "$DEV_MODE_ENABLED" == "1" ]; then
    echo "Activating virtual environment..."
    source venv/bin/activate
fi

python main.py
