# Live Polling System (Final Single Deploy)

This version is **ready-to-deploy on Render**.  
It combines backend + frontend build in one project.

## Run locally
```bash
npm install
npm start
```
Opens on http://localhost:4000

## Deploy on Render
1. Push this folder to GitHub.
2. Go to https://render.com → New Web Service → Connect repo.
3. Environment: Node
4. Build command: `npm install`
5. Start command: `node index.js`
6. Choose **Free instance type** (750 hours/month).
7. Deploy → both backend & frontend live on a single URL.

## Notes
- The `public/` folder contains the compiled React build (with logo + favicon).
- To update frontend later:
  1. Rebuild React with `npm run build` locally.
  2. Replace `/public` with new build.
  3. Redeploy.
# live-pooling-system-main
