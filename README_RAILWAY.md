# Railway Deployment Guide

This project is configured for deployment on Railway.

## Deployment URLs

- **Production Domain:** `droomvriendjescomkinderboeken-production.up.railway.app`
- **Internal Domain:** `droomvriendjescomkinderboeken.railway.internal`

## Configuration Files

- `railway.json` - Main Railway configuration
- `Procfile` - Process file for Railway deployment
- `.railway/config.yml` - Environment-specific configuration

## Deployment

To deploy this project on Railway:

1. Push this branch to GitHub
2. Connect your Railway project to this repository
3. Railway will automatically detect the `railway.json` configuration
4. Your app will be deployed to the production domain

## Environment Variables

Configure the following in Railway:
- `NODE_ENV=production`
- Any application-specific variables needed

## Marketing Strategy

This deployment maintains the original marketing strategy while enabling scalable, production-grade hosting on Railway.
