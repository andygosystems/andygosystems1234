# Zero-Error cPanel Production Deployment (React + Node)

## Prerequisites
- Node.js v20.x via cPanel “Setup Node.js App”
- MySQL database with utf8mb4_unicode_ci
- Public uploads folder with 755

## Environment
Create `.env` in the Node app root:

```
PORT=3000
DB_HOST=localhost
DB_NAME=your_db
DB_USER=your_user
DB_PASS=your_pass
CORS_ORIGINS=https://yourdomain.com
FRONTEND_DIR=/home/USER/path/to/build
UPLOADS_DIR=/home/USER/public_html/uploads
```

## Install
In cPanel terminal:
```
npm install --production express compression helmet cors morgan mysql2
```

## Startup File
- Set Application startup file to `server/app.js`
- Start the Node.js app in cPanel

## Apache Routing (.htaccess)
Place this in `public_html/.htaccess` (template provided):
[deployment/public_html.htaccess](file:///c:/Users/andre/krugerr-brendt-updated/deployment/public_html.htaccess)

## Build Frontend
Upload built React files (dist or build) to the folder set by `FRONTEND_DIR` and ensure `index.html` exists there.

## Database Check
Node server uses utf8mb4 and verifies connectivity via `/api/health`.

## Health Endpoint
`GET /api/health` returns:
- db connectivity
- uploads write permission
- memory totals
- disk info

## Sync Status
`POST /api/sync-status` with `{ "urls": ["https://..."] }` checks reachability of external property links.

## Import Controller
`POST /api/import` with:
```
{
  "items": [
    {
      "title": "...",
      "description": "...",
      "price": 0,
      "currency": "KES",
      "location": "...",
      "type": "Sale",
      "status": "available",
      "bedrooms": 0,
      "bathrooms": 0,
      "sqm": 0,
      "lat": null,
      "lng": null,
      "property_type": "Land",
      "virtual_tour_url": null,
      "images": ["https://..."],
      "amenities": ["..."],
      "keywords": ["title deed","beacons","electricity available"]
    }
  ]
}
```
Batch inserts properties, images, amenities, and maps land fields automatically from keywords.

## Cron: Clean Temp Uploads
Create a cron job (once daily):
```
/usr/local/bin/node /home/USER/path/to/server/scripts/cleanup-temp.js
```
Set `TEMP_UPLOADS_DIR` if needed.

## Security & Performance
- CORS restricted via `CORS_ORIGINS`
- Gzip via Apache
- Global error logs at `logs/production.log`

## Deployment Checklist
1. Setup Node.js App: v20, startup file `server/app.js`
2. Terminal: `npm install --production`
3. MySQL Wizard: create DB/user, set utf8mb4_unicode_ci
4. Folder permissions: `public_html/uploads` is 755
5. Upload frontend build to `FRONTEND_DIR`
6. Put `.htaccess` into `public_html`
7. Test `/api/health` and `/api/sync-status`

