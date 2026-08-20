This folder holds the runtime tally file `store.json`.

`store.json` is gitignored. Locally, run `npm run seed` for demo data.
On Railway, attach a volume (mount `/data`). The app uses `RAILWAY_VOLUME_MOUNT_PATH` or `DATA_DIR` so deploys do not wipe progress.
