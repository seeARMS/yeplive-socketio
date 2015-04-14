# YepLive Socket.IO service
### TESTING
`export TEST=true`

exposed `/test` route which has a simple websocket client

Input channel id (yep id) and auth token to connect

### APIs

`'client:join'`  to join a room

`'client:message'` to broadcast a message in the room

`'client:leave'` to disconnect from Socket.IO

`'server:messages'` to receive messages from server 