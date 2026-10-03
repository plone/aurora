# Project settings
include ../../variables.mk

CURRENT_DIR:=$(shell dirname $(realpath $(lastword $(MAKEFILE_LIST))))

.PHONY: all
all: help

.PHONY: help
help: ## This help message
	@echo -e "$$(grep -hE '^\S+:.*##' $(MAKEFILE_LIST) | sed -e 's/:.*##\s*/:/' -e 's/^\(.\+\):\(.*\)/$(CYAN)\1$(RESET):\2/' | column -c2 -t -s :)"

.PHONY: install
install: ## Install dependencies
	pnpm install

.PHONY: build
build: ## Build the package
	pnpm run build

.PHONY: storybook-start
storybook-start: ## Start Storybook
	pnpm run storybook

.PHONY: storybook-build
storybook-build: ## Build Storybook
	pnpm run build-storybook
