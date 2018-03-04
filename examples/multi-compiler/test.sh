diff \
  ./happy/client.js \
  ./vanilla/client.js

diff \
  ./happy/server.js \
  ./vanilla/server.js

grep "success" ./happy/client.js
grep "success" ./vanilla/client.js
