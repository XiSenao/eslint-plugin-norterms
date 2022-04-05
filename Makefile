link:
	yarn unlink eslint-plugin-norterms
	yarn link
	cd tests/dev-pro/node_modules && yarn link eslint-plugin-norterms

lint:
	cd tests/dev-pro && yarn lint

lint-fix:
	cd tests/dev-pro && yarn lint:fix

pre:
	yarn
	cd tests/dev-pro && yarn

dev:
	cd tests/dev-pro && yarn start
