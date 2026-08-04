# Student Messaging API

This document describes the student-to-student messaging feature implemented in the alumni API.

## Overview

- Messaging is only allowed between verified students who are already connected.
- Messages are persisted in MongoDB.
- Read state is tracked with the `readAt` field on each message.
- Real-time delivery and read receipts are handled with Socket.IO.

## Authentication

- All REST endpoints below require `Authorization: Bearer <jwt>`.
- Socket connections also require a valid student JWT.

## REST Endpoints

### Get Conversations

- Method: `GET`
- Path: `/api/v1/students/messages/conversations`
- Query params:
  - `page` optional, default `1`
  - `limit` optional, default `10`, max `50`
  - `search` optional, filters by partner name, email, matric number, college, course, or occupation
- Response:
  - `200 OK`
  - Returns each conversation partner, the latest message, and unread count for the authenticated student.

### Get Conversation Messages

- Method: `GET`
- Path: `/api/v1/students/messages/:studentId`
- Query params:
  - `page` optional, default `1`
  - `limit` optional, default `10`, max `50`
- Response:
  - `200 OK`
  - Returns paginated messages with the connected student.

### Send Message

- Method: `POST`
- Path: `/api/v1/students/messages/:studentId`
- Body:

```json
{
  "body": "Hello, great to connect with you."
}
```

- Response:
  - `201 Created`
  - Persists the message and emits real-time socket events for sender and recipient.

### Mark Messages As Read

- Method: `PATCH`
- Path: `/api/v1/students/messages/:studentId/read`
- Response:
  - `200 OK`
  - Marks all unread incoming messages from that student as read and emits a read receipt.

## Socket.IO

### Connection

- Server URL: same API host on port `5000`
- Transport auth:

```js
const socket = io("http://localhost:5000", {
  auth: {
    token: "Bearer <jwt>",
  },
});
```

### Client -> Server Events

#### `message:send`

Payload:

```json
{
  "recipientId": "studentObjectId",
  "body": "Hello from socket"
}
```

Ack response:

```json
{
  "ok": true,
  "data": {
    "id": "messageObjectId",
    "sender": "senderId",
    "recipient": "recipientId",
    "body": "Hello from socket",
    "readAt": null,
    "createdAt": "2026-08-03T12:00:00.000Z",
    "updatedAt": "2026-08-03T12:00:00.000Z",
    "direction": "sent",
    "isRead": false
  }
}
```

#### `message:read`

Payload:

```json
{
  "partnerId": "studentObjectId"
}
```

Ack response:

```json
{
  "ok": true,
  "data": {
    "partnerId": "studentObjectId",
    "readAt": "2026-08-03T12:05:00.000Z"
  }
}
```

### Server -> Client Events

#### `message:new`

- Fired to the recipient when a new message arrives.

#### `message:sent`

- Fired to the sender after persistence succeeds.

#### `message:read`

- Fired to both sides when unread messages are marked as read.

## Data Model

Each message record stores:

- `sender`
- `recipient`
- `body`
- `readAt`
- `createdAt`
- `updatedAt`

Unread messages are messages where `recipient` is the current student and `readAt` is `null`.