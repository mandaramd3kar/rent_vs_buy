#!/usr/bin/env python3
"""Simple HTTP server to serve the RentVsBuy frontend."""

import http.server
import socketserver
import os

PORT = 8080
os.chdir('frontend')

Handler = http.server.SimpleHTTPRequestHandler

with socketserver.TCPServer(("", PORT), Handler) as httpd:
    print(f"Frontend server running at http://localhost:{PORT}")
    print(f"Open your browser and navigate to http://localhost:{PORT}")
    print("Press Ctrl+C to stop.")
    httpd.serve_forever()
