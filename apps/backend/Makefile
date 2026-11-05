build-Api:
	cp app.js index.js lambda.js store.js utils.js validation.js package.json package-lock.json "$(ARTIFACTS_DIR)/"
	cd "$(ARTIFACTS_DIR)" && npm ci --omit=dev --ignore-scripts
