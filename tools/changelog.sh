#!/bin/sh

LAST_TAG=$(git describe --tags --abbrev=0)
git log --pretty="%h - %s" "$LAST_TAG"..HEAD