#!/usr/bin/env python3
import asyncio
import websockets

users = set()
messages = []

async def addUser(websocket):
    users.add(websocket)
    await broadcast("Somebody has joined the chat.")

async def removeUser(websocket):
    users.remove(websocket)
    await broadcast("Somebody has left the chat.")

async def broadcast(message):
    print(message)
    messages.append(message)  # Store the message on the server
    for user in users:
        await user.send(message)

async def sendStoredMessages(websocket):
    for message in messages:
        await websocket.send(message)

async def test(websocket, path):
    await addUser(websocket)
    await sendStoredMessages(websocket)  # Send stored messages to the new user

    while True:
        try:
            message = await websocket.recv()
            await broadcast(message)
        except websockets.exceptions.ConnectionClosed:
            await removeUser(websocket)
            break

startServer = websockets.serve(
    test, "0.0.0.0", 8763
)

asyncio.get_event_loop().run_until_complete(startServer)
asyncio.get_event_loop().run_forever()
