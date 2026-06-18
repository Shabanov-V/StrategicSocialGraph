#!/bin/sh
nginx

node dist/index.js &
NODE_PID=$!

trap "nginx -s quit; kill $NODE_PID 2>/dev/null; wait $NODE_PID" TERM INT

wait $NODE_PID
