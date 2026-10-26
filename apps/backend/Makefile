build-Api:
	cp app.js index.js lambda.js payments.js store.js validation.js package.json package-lock.json "$(ARTIFACTS_DIR)/"
	cd "$(ARTIFACTS_DIR)" && npm ci --omit=dev --ignore-scripts
