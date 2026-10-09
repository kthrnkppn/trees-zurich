---
name: dev-server
description: >-
  Start, verify, and manage the local development server for the trees.watch project.
  Use whenever the user wants to run, restart, test, or preview the site locally.
---

# Local Development Server Runbook

## Overview
This project is a static web application (`index.html`, `style.css`, vanilla JS, and GeoJSON files). Node.js is not installed on this system; the server is run using Python's built-in HTTP server on port `4178`.

## Port & URL
- **Port:** `4178`
- **URL:** [http://localhost:4178](http://localhost:4178)

## Procedure

### Step 1: Check if the server is already running
Before starting a new server, test whether port `4178` is already in use or responding:
```bash
lsof -ti :4178
```
or test HTTP response:
```bash
curl -s -o /dev/null -w "%{http_code}" http://localhost:4178/
```

- **If port 4178 is already listening and responding:**
  Do not launch a duplicate server. Inform the user that the dev server is already running and provide the clickable link: [http://localhost:4178](http://localhost:4178).

### Step 2: Start the background server if not running
If port `4178` is available:
- Run `python3 -m http.server 4178` using `run_command` with:
  - `IsDaemon: true`
  - `Cwd: /Users/katharina/Desktop/trees.watch`
  - `WaitMsBeforeAsync: 1000`

### Step 3: Verify and send clickable link
Confirm that the server is up:
- Send the user the clickable link: [http://localhost:4178](http://localhost:4178)
