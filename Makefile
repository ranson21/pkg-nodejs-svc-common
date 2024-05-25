cjs_bundle:
	@command npx rollup src/index.js --file cjs/index.cjs --format cjs
	@command npx rollup src/middleware.js --file cjs/middleware.cjs --format cjs
	@command npx rollup src/controller.js --file cjs/controller.cjs --format cjs