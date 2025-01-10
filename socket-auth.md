# Socket Authentication Implementation Plan

## Overview
Implement secure WebSocket authentication using the existing JWT token from the backend that's stored in Next-Auth session.

## Current Setup
- Backend uses JWT with `process.env.secret` for API authentication
- Frontend uses Next-Auth with the backend JWT token stored in session
- WebSocket connection needs secure authentication

## Implementation Steps

### 1. Frontend Changes

#### A. Create Socket Connection Utility
- Location: `lib/socket.js`
- Create socket connection with auth token from Next-Auth session
- Handle connection errors
- Add reconnection logic

#### B. Create WebSocket Hook
- Location: `hooks/useWebSocket.js`
- Manage socket lifecycle
- Handle session state
- Provide socket instance to components

### 2. Backend Changes

#### A. Socket Authentication Middleware
- Location: `socketHandlers.js`
- Add JWT verification middleware
- Store user info in socket instance
- Handle authentication errors

#### B. Socket Event Handlers
- Implement authenticated event handlers
- Add proper error handling
- Log important events

### 3. Testing Plan
1. Test socket connection with valid token
2. Test socket connection with invalid token
3. Test socket connection with expired token
4. Test reconnection behavior
5. Test event handling for authenticated users

### 4. Security Considerations
- Token verification on every connection
- Proper error handling
- Secure token transmission
- Connection timeout handling
- Rate limiting if needed

## Code Examples

### Frontend Socket Creation

```javascript
// lib/socket.js
export const createSocket = (session) => {
  if (!session?.token) {
    throw new Error('No authentication token available');
  }

  const socket = io(process.env.NEXT_PUBLIC_SOCKET_URL, {
    auth: {
      token: session.token  // This is your backend JWT token
    }
  });
  
  return socket;
};

```

### Backend Authentication
```javascript
// socketHandlers.js
io.use((socket, next) => {
  const { token } = socket.handshake.auth;
  
  if (!token) {
    return next(new Error('Authentication required'));
  }

  try {
    const decoded = jwt.verify(token, process.env.secret);
    socket.user = decoded;
    next();
  } catch (err) {
    next(new Error('Authentication failed'));
  }
});
```

## Implementation Order
1. Revert any existing authentication changes
2. Implement frontend socket utility
3. Add socket authentication middleware
4. Create WebSocket hook
5. Test authentication flow
6. Add error handling and logging
7. Test edge cases and security

## Questions to Address Before Implementation
1. Should we implement rate limiting?
2. Do we need to handle token refresh?
3. Should we add connection timeout?
4. Do we need to track connected users?
