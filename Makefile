publish:
	@echo '--------------- Start publishing ------------------'
	@yarn add @youzan/npm-platform-publish -D
	@git checkout .
	@npx npp publish --taskId $(shell echo $$HARDWORKER_TASK_ID)
	@echo '--------------- Publish successfully --------------'

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
