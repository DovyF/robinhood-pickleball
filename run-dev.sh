#!/bin/zsh
export PATH="$HOME/.local/node/bin:$PATH"
export NODE_EXTRA_CA_CERTS="$HOME/.local/proxy-ca.pem"
unset HTTP_PROXY HTTPS_PROXY http_proxy https_proxy
cd /Users/dovyfeder/Desktop/robinhood-pickleball
exec npm run dev
