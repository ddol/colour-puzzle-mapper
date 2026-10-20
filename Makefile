.PHONY: build dev test palette-default
NODE ?= node

build:
	$(NODE) scripts/build.js

dev:
	$(NODE) scripts/dev.js --host $(or $(HOST),127.0.0.1) --port $(or $(PORT),3000)

test:
	$(NODE) --test 'test/**/*.test.js'

palette-default:
	$(NODE) scripts/palette-default.js "$(PALETTE)"
