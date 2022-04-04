publish:
	@echo '--------------- Start publishing ------------------'
	@yarn add @youzan/npm-platform-publish -D
	@git checkout .
	@npx npp publish --taskId $(shell echo $$HARDWORKER_TASK_ID)
	@echo '--------------- Publish successfully --------------'
