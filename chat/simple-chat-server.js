const express = require('express')
const http = require('http')
const { Server } = require('socket.io')
const cors = require('cors')

const app = express()
const server = http.createServer(app)
const io = new Server(server, {
  cors: {
    origin: 'http://localhost:3000',
    methods: ['GET', 'POST'],
  },
})

app.use(cors())
app.use(express.json())

const rooms = new Map()

function handleJoinRoom(socket) {
  return ({ roomId, userId }) => {
    roomId = roomId || 'default'
    userId = userId || socket.id

    console.log(
      `User ${userId} (Socket ID: ${socket.id}) joining room ${roomId}`,
    )
    socket.join(roomId)
    if (!rooms.has(roomId)) {
      console.log(`Creating new room ${roomId}`)
      rooms.set(roomId, { messages: [], users: new Set() })
    }
    rooms.get(roomId).users.add(userId)

    // Send existing messages to the newly connected client
    const messages = rooms.get(roomId).messages
    console.log(
      `Sending chat history to user ${userId}. Message count: ${messages.length}`,
    )
    socket.emit('server: chat history', messages)

    // Notify others in the room
    socket.to(roomId).emit('server: user joined', { userId })

    // Log current room state
    console.log(`Room ${roomId} state:`, {
      users: Array.from(rooms.get(roomId).users),
      messageCount: rooms.get(roomId).messages.length,
    })
  }
}

function handleLeaveRoom(socket) {
  return ({ roomId, userId }) => {
    roomId = roomId || 'default'
    userId = userId || socket.id

    console.log(
      `User ${userId} (Socket ID: ${socket.id}) leaving room ${roomId}`,
    )
    socket.leave(roomId)
    const room = rooms.get(roomId)
    if (room) {
      room.users.delete(userId)
      if (room.users.size === 0) {
        console.log(`Deleting empty room ${roomId}`)
        rooms.delete(roomId)
      } else {
        console.log(`Room ${roomId} state after user left:`, {
          users: Array.from(room.users),
          messageCount: room.messages.length,
        })
      }
    }
    // Notify others in the room
    socket.to(roomId).emit('server: user left', userId)
  }
}

function handleChatMessage(socket, io) {
  return ({ roomId, msg, userId }) => {
    console.log(
      `Received message for room ${roomId} from user ${userId}: "${msg}"`,
    )
    const room = rooms.get(roomId)
    if (room) {
      const newMessage = {
        sender: userId,
        content: msg,
        timestamp: new Date().toISOString(),
      }
      room.messages.push(newMessage)
      console.log(`Broadcasting message to room ${roomId}`)
      // Broadcast the message to all clients in the room
      io.to(roomId).emit('server: chat message', newMessage)
    } else {
      console.error(`Room ${roomId} not found`)
      // Optionally, you can emit an error back to the client
      socket.emit('server: error', { message: 'Room not found' })
    }
  }
}

function handleDisconnect(socket) {
  return (reason) => {
    console.log('User disconnected', {
      id: socket.id,
      reason: reason,
      time: new Date().toISOString(),
    })
    // Find and remove the user from all rooms they were in
    rooms.forEach((room, roomId) => {
      if (room.users.has(socket.id)) {
        console.log(
          `Removing disconnected user ${socket.id} from room ${roomId}`,
        )
        room.users.delete(socket.id)
        if (room.users.size === 0) {
          console.log(`Deleting empty room ${roomId}`)
          rooms.delete(roomId)
        } else {
          // Notify others in the room
          socket.to(roomId).emit('server: user left', socket.id)
        }
      }
    })
  }
}

io.on('connection', (socket) => {
  console.log('A user connected', {
    id: socket.id,
    address: socket.handshake.address,
    time: new Date().toISOString(),
    query: socket.handshake.query,
    transport: socket.conn.transport.name,
  })

  socket.on('client: join room', handleJoinRoom(socket))
  socket.on('client: chat message', handleChatMessage(socket, io))
  socket.on('client: leave room', handleLeaveRoom(socket))
  socket.on('disconnect', handleDisconnect(socket))
})

const PORT = 3002  // Force it to use 3002 for debugging
const serverInstance = server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('SIGINT signal received. Shutting down gracefully.')
  serverInstance.close(() => {
    console.log('Server closed.')
    process.exit(0)
  })
})

process.on('SIGTERM', () => {
  console.log('SIGTERM signal received. Shutting down gracefully.')
  serverInstance.close(() => {
    console.log('Server closed.')
    process.exit(0)
  })
})
