# Student Messaging API

This document describes the student-to-student messaging feature implemented in the alumni API.

## Overview

- Messaging is only allowed between verified students who are already connected.
- Messages are persisted in MongoDB.
- Messages can optionally tag another message as a reply using `replyToMessageId`.
- Senders can edit their own messages for up to 10 minutes after creation.
- Senders can delete their own messages for up to 24 hours after creation.
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
  "body": "Hello, great to connect with you.",
  "replyToMessageId": "optionalMessageObjectId"
}
```

- Response:
  - `201 Created`
  - Persists the message and emits real-time socket events for sender and recipient.

### Edit Message

- Method: `PATCH`
- Path: `/api/v1/students/messages/message/:messageId`
- Body:

```json
{
  "body": "Updated message text"
}
```

- Rules:
  - Only the sender can edit a message.
  - Message must be edited within 10 minutes of `createdAt`.
- Response:
  - `200 OK`
  - Updates the message body, sets `editedAt`, and emits a real-time edit event.

### Delete Message

- Method: `DELETE`
- Path: `/api/v1/students/messages/message/:messageId`
- Rules:
  - Only the sender can delete a message.
  - Message must be deleted within 24 hours of `createdAt`.
- Response:
  - `200 OK`
  - Deletes the message and emits a real-time delete event.

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
  "body": "Hello from socket",
  "replyToMessageId": "optionalMessageObjectId"
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
    "replyTo": {
      "id": "optionalMessageObjectId",
      "sender": "senderId",
      "recipient": "recipientId",
      "body": "Original message body",
      "createdAt": "2026-08-03T11:59:00.000Z"
    },
    "readAt": null,
    "editedAt": null,
    "createdAt": "2026-08-03T12:00:00.000Z",
    "updatedAt": "2026-08-03T12:00:00.000Z",
    "direction": "sent",
    "isRead": false,
    "isEdited": false
  }
}
```

#### `message:edit`

Payload:

```json
{
  "messageId": "messageObjectId",
  "body": "Edited message text"
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
    "body": "Edited message text",
    "editedAt": "2026-08-03T12:08:00.000Z",
    "isEdited": true
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

#### `message:edited`

- Fired to both sides when a message is edited successfully.

#### `message:deleted`

- Fired to both sides when a message is deleted successfully.
- Payload shape:

```json
{
  "id": "messageObjectId",
  "sender": "senderId",
  "recipient": "recipientId",
  "deletedAt": "2026-08-11T10:00:00.000Z"
}
```

## Data Model

Each message record stores:

- `sender`
- `recipient`
- `body`
- `replyTo`
- `readAt`
- `editedAt`
- `createdAt`
- `updatedAt`

Unread messages are messages where `recipient` is the current student and `readAt` is `null`.