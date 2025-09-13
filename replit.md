# Arshia Adamian Portfolio Website

## Overview
A personal portfolio website showcasing Arshia Adamian's skills, projects, education, and work experience. This is a static HTML website with CSS styling and Bootstrap framework, designed to present a professional online presence.

## Project Architecture
- **Type**: Static HTML/CSS website
- **Server**: Python HTTP server (server.py)
- **Framework**: Bootstrap 4.4.1 + Custom CSS
- **Port**: 5000 (configured for Replit environment)
- **Deployment**: Autoscale (static website)

## Recent Changes (September 13, 2025)
- Imported project from GitHub
- Set up Python HTTP server to serve static files
- Configured server.py to run on 0.0.0.0:5000 with cache control headers
- Created workflow "Portfolio Server" for development
- Configured autoscale deployment for production

## File Structure
```
/
├── index.html              # Main portfolio page
├── server.py              # Python HTTP server for Replit
├── style/
│   ├── index.css          # Main stylesheet
│   ├── BCITConnect.css    # Project-specific styles
│   └── jac.css           # Project-specific styles
├── images/               # All portfolio images and logos
├── projects/            # Individual project detail pages
│   ├── BCITConnect.html
│   ├── jac.html
│   └── trackLift.html
└── documents/           # Resume PDF
    └── resume.pdf
```

## Features
- Responsive design with Bootstrap
- Portfolio sections: Projects, Skills, Experience, Education
- Resume preview and download
- External links to live projects and social profiles
- Professional styling with gradient backgrounds

## Development
- Server runs on port 5000 with workflow "Portfolio Server"
- Cache control headers prevent caching issues in development
- All static assets are served from the root directory

## User Preferences
- Clean, professional design
- Bootstrap framework for responsiveness
- Static hosting approach preferred
- No backend requirements

## Project Status
✅ Fully functional and ready for use
✅ Deployment configured for production
✅ All assets loading correctly