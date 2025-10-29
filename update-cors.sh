#!/bin/bash
# Update CORS using gcloud with proper escaping
gcloud run services update ems-api \
  --region us-central1 \
  --update-env-vars "CORS_ORIGINS=http://localhost:5173,http://127.0.0.1:5173,https://ems-web-415991795553.us-central1.run.app"

