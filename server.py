#!/usr/bin/env python3
import http.server
import socketserver
import os

# Set the port and host
PORT = 5000
HOST = "0.0.0.0"

# Change to the directory containing the static files
os.chdir(os.path.dirname(os.path.abspath(__file__)))

# Create a custom handler to add cache control headers
class CustomHTTPRequestHandler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        # Add cache control headers to prevent caching issues in Replit
        self.send_header('Cache-Control', 'no-cache, no-store, must-revalidate')
        self.send_header('Pragma', 'no-cache')
        self.send_header('Expires', '0')
        super().end_headers()

# Create the server
with socketserver.TCPServer((HOST, PORT), CustomHTTPRequestHandler) as httpd:
    print(f"Serving HTTP on {HOST} port {PORT} (http://{HOST}:{PORT}/)")
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\nServer stopped.")