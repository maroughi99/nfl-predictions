# Vercel Postgres Setup Instructions

## Steps to Enable Database on Vercel:

1. **Go to your Vercel project dashboard**
   - Visit https://vercel.com/dashboard
   - Select your `nfl-predictions` project

2. **Add Vercel Postgres**
   - Click on the "Storage" tab
   - Click "Create Database"
   - Select "Postgres"
   - Choose a database name (e.g., `nfl-predictions-db`)
   - Select a region (choose one close to your users)
   - Click "Create"

3. **Connect to your project**
   - Vercel will automatically add these environment variables:
     - `POSTGRES_URL`
     - `POSTGRES_PRISMA_URL`
     - `POSTGRES_URL_NON_POOLING`
     - `POSTGRES_USER`
     - `POSTGRES_HOST`
     - `POSTGRES_PASSWORD`
     - `POSTGRES_DATABASE`

4. **Redeploy**
   - After creating the database, trigger a new deployment
   - The app will automatically detect `POSTGRES_URL` and use PostgreSQL
   - Tables will be created automatically on first run

## How it works:

- **Local Development**: Uses SQLite (`predictions.db` file)
- **Vercel Production**: Uses PostgreSQL (when `POSTGRES_URL` env var exists)
- The database initialization happens automatically on server startup
- All 5 tables are created: predictions, actual_results, accuracy_summary, prop_predictions, prop_results

## Notes:

- Your existing local SQLite data won't be transferred automatically
- The Postgres database starts empty and will populate as predictions are made
- Historical data tracking will work the same way on Vercel as it does locally
