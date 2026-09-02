.PHONY: help install mock test verify submit clean

help:
	@echo "install   install dependencies"
	@echo "mock      run the Pipedrive mock API on :4010"
	@echo "test      run the acceptance suite"
	@echo "verify    run the full verification pass"
	@echo "submit    build the submission archive"

install:
	npm install

mock:
	npm run mock

test:
	npm test

verify:
	npm run verify

submit:
	npm run submit

clean:
	rm -rf node_modules data/*.db submission-*.tgz
