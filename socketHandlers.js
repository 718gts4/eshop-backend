const VendorSupportQuery = require('./models/vendor-support-query');
const jwt = require('jsonwebtoken');
const sanitizeHtml = require('sanitize-html');
const { transformUserForClient } = require('./utils/helper');

let messageCounter = 0; // Add a counter for incoming messages

module.exports = function(io, app) {
  const connectedUsers = new Map();

  // Authentication middleware
  io.use((socket, next) => {
    const { token } = socket.handshake.auth;
    
    if (!token) {
      console.log('No token provided in socket handshake auth');
      return next(new Error('Authentication required'));
    }

    try {
      const decoded = jwt.verify(token, process.env.secret);
      
      // Additional validation
      if (!decoded.id) {
        console.error('Invalid token format: missing user ID');
        return next(new Error('Authentication failed'));
      }

      // Store user info
      socket.user = decoded;
      
      console.log('Socket authenticated for user:', decoded.id);
      next();
    } catch (err) {
      console.error('Socket authentication error:', err);
      return next(new Error('Authentication failed'));
    }
  });

  io.on('connection', (socket) => {
    console.log('\n=== NEW SOCKET CONNECTION ===');
    console.log('Socket ID:', socket.id);
    console.log('User ID:', socket.user.id);
    console.log('Initial rooms:', Array.from(socket.rooms));
    console.log('==========================\n');

    // Debug logging for all socket events
    socket.onAny((eventName, ...args) => {
      console.log('\n=== SOCKET EVENT ===');
      console.log('Event:', eventName);
      console.log('Arguments:', args);
      console.log('==================\n');
    });

    console.log('Registering typing handlers for socket:', socket.id);

    // Room management
    socket.on('client:joinRoom', handleJoinRoom(socket, connectedUsers, io));
    socket.on('client:leaveRoom', handleLeaveRoom(socket, io, connectedUsers));

    // Messaging
    socket.on('client:chatMessage', (data) => {
      console.log('Received chatMessage:', data);
      handleChatMessage(socket, io)(data);
    });

    // Typing indicators
    socket.on('client:typing', handleTyping(socket));
    socket.on('client:stopTyping', handleStopTyping(socket));

    // Built-in Socket.IO events
    socket.on('connect_error', (error) => {
      console.error('Connection error:', error);
    });

    // Disconnection
    socket.on('disconnect', handleDisconnect(socket, connectedUsers));
  });
};

// Room management handlers
function handleJoinRoom(socket, connectedUsers, io) {
  return async (data) => {
    console.log('server:joinRoom event received:', data);
    try {
      const { queryId } = data;
      const userId = socket.user.id;
      
      // Find query first
      let query = await VendorSupportQuery.findById(queryId);
      if (!query) {
          throw new Error('Query not found');
      }

      console.log('Before update - Current participants:', JSON.stringify(query.participants, null, 2));

      // Use the new addParticipant method
      await query.addParticipant(userId);
      
      // Update online status atomically
      query = await VendorSupportQuery.findOneAndUpdate(
          { 
              _id: queryId,
              'participants.user': userId 
          },
          { 
              $set: { 'participants.$.isOnline': true }
          },
          { new: true }
      ).populate({
          path: 'participants.user',
          select: 'name email image role username'
      });

      if (!query) {
        throw new Error('Failed to update query');
      }

      // Log state after update
      console.log('After update - Updated participants:', JSON.stringify(query.participants, null, 2));

      // Add debug logging for room join
      console.log('Before join - Socket rooms:', Array.from(socket.rooms));
      await socket.join(queryId);
      console.log('After join - Socket rooms:', Array.from(socket.rooms));
      console.log(`User ${userId} joined room ${queryId}`);

      // Update connected users map
      connectedUsers.set(userId, socket.id);

      // Get unique online users
      const onlineUsers = query.participants
        .filter(p => p.isOnline && p.user && p.user._id)
        .reduce((acc, curr) => {
          const userId = curr.user._id.toString();
          if (!acc.some(u => u._id.toString() === userId)) {
            acc.push(transformUserForClient(curr.user));
          }
          return acc;
        }, []);

      const joinedUser = transformUserForClient(query.participants.find(p => p.user._id.toString() === userId)?.user);
      
      // Emit events
      socket.to(queryId).emit('server:userJoined', { user: joinedUser, queryId });
      io.to(queryId).emit('server:onlineUsers', { queryId, onlineUsers });
    } catch (error) {
      console.error('Error in joinRoom:', error);
      socket.emit('server:error:joinRoom', { message: 'Error joining room' });
    }
  };
}

function handleLeaveRoom(socket, io, connectedUsers) {
  return async (data) => {
    try {
      const { queryId } = data;
      const userId = socket.user.id;
      socket.leave(queryId);
      console.log(`User ${userId} left room ${queryId}`);

      const updatedQuery = await VendorSupportQuery.findOneAndUpdate(
        { _id: queryId, 'participants.user': userId },
        { $set: { 'participants.$.isOnline': false } },
        { new: true }
      ).populate({
        path: 'participants.user',
        select: 'name email image role username'
      });

      if (!updatedQuery) {
        throw new Error('Failed to update query');
      }

      connectedUsers.delete(userId);

      const leavingUser = updatedQuery.participants.find(p => p.user._id.toString() === userId);
      const userInfo = leavingUser ? {
        _id: leavingUser.user._id,
        name: leavingUser.user.name,
        email: leavingUser.user.email,
        image: leavingUser.user.image,
        role: leavingUser.user.role,
        username: leavingUser.user.username
      } : null;

      socket.to(queryId).emit('server:userLeft', { user: userInfo, queryId });

      const onlineUsers = updatedQuery.participants
        .filter(p => p.isOnline)
        .map(p => ({
          _id: p.user._id,
          name: p.user.name,
          email: p.user.email,
          image: p.user.image,
          role: p.user.role,
          username: p.user.username
        }));
      
      io.to(queryId).emit('server:onlineUsers', { queryId, onlineUsers });
    } catch (error) {
      console.error('Error in leaveRoom:', error);
      socket.emit('server:error:leaveRoom', { message: 'Error leaving room' });
    }
  };
}

// Note: Marking messages as read should be handled via REST API, not Socket.IO

// Typing indicator handlers
function handleTyping(socket) {
  return (data) => {
    const { queryId } = data;
    const userId = socket.user.id;
    
    console.log('\n=== TYPING EVENT ===');
    console.log('Received typing event from user:', userId);
    console.log('For query:', queryId);
    console.log('Socket rooms:', Array.from(socket.rooms));
    
    // Check if socket is in the room
    if (!socket.rooms.has(queryId)) {
      console.log('Socket not in room, attempting to join...');
      socket.join(queryId);
    }
    
    socket.to(queryId).emit('server:userTyping', { userId, queryId });
    
    console.log('Emitted server:userTyping event');
    console.log('==================\n');
  };
}

function handleStopTyping(socket) {
  return (data) => {
    const { queryId } = data;
    const userId = socket.user.id;
    console.log('\n=== STOP TYPING EVENT ===');
    console.log('Received stop typing event from user:', userId);
    console.log('For query:', queryId);
    console.log('Socket rooms:', Array.from(socket.rooms));
    console.log('Broadcasting to room:', queryId);
    
    socket.to(queryId).emit('server:userStoppedTyping', { userId, queryId });
    console.log('Emitted server:userStoppedTyping event');
    console.log('==================\n');
  };
}

function handleChatMessage(socket, io) {
  return async (data) => {
    const { queryId, content } = data;
    const senderId = socket.user.id;
    
    try {
      const sanitizedContent = sanitizeHtml(content);
      const newMessage = { 
        sender: senderId, 
        content: sanitizedContent
      };

      // Fetch the query and save the message
      const query = await VendorSupportQuery.findById(queryId);
      if (!query) {
        throw new Error('Query not found');
      }
      console.log('new message saved:', newMessage)
      query.messages.push(newMessage);
      query.lastMessageAt = newMessage.timestamp;
      await query.save();

      // Emit the message to all clients in the room
      console.log('Emitting newMessage event:', { queryId, ...newMessage });
      io.to(queryId).emit('server:newMessage', { queryId, ...newMessage });

      console.log(`Message processed and emitted for query ${queryId}`);
    } catch (error) {
      console.error(`Error processing chat message:`, error);
      socket.emit('server:error:message', { message: 'Error processing message' });
    }
  };
}

// Disconnection handler
function handleDisconnect(socket, connectedUsers) {
  return () => {
    const userId = socket.user.id;
    connectedUsers.delete(userId);
    console.log(`Client disconnected: ${userId}`);
  };
}
