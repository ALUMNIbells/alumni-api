# Election API

This module manages election lifecycle operations for the alumni platform.

## Overview

- Super-admin creates elections with title, description, academic session, and voting time frame.
- Super-admin adds positions and candidates to each election.
- Students can vote only while the election is actively open.
- Super-admin collates final results after the election closes and stores the result snapshot.
- Results remain private until the super-admin publishes them.

## Base URL

- Local: http://localhost:5000/api/v1
- Production: https://www.bellsuniversityalumni.com/api/v1

## Endpoints

### 1. Create an election

- Method: POST
- Route: /elections
- Access: Super-admin only
- Body:
  - title: string
  - description: string
  - session: string
  - startDate: ISO date string
  - endDate: ISO date string

### 2. List elections

- Method: GET
- Route: /elections
- Access: Public
- Response includes election metadata and candidate names without private result data unless the caller is admin or super-admin.

### 3. Get an election by id

- Method: GET
- Route: /elections/:electionId
- Access: Public

### 4. Add a position

- Method: POST
- Route: /elections/:electionId/positions
- Access: Super-admin only
- Body:
  - title: string
  - description: string

### 5. Add a candidate to a position

- Method: POST
- Route: /elections/:electionId/positions/:positionId/candidates
- Access: Super-admin only
- Body:
  - fullName: string
  - imgurl: string

### 6. Edit an election

- Method: PATCH
- Route: /elections/:electionId
- Access: Super-admin only
- Restriction: Not allowed after any vote has been cast.

### 7. Delete an election

- Method: DELETE
- Route: /elections/:electionId
- Access: Super-admin only
- Restriction: Allowed only when election has not started and no votes exist.

### 8. Edit a position

- Method: PATCH
- Route: /elections/:electionId/positions/:positionId
- Access: Super-admin only
- Body:
  - title: string (optional)
  - description: string (optional)
- Restriction: Not allowed after voting has started.

### 9. Delete a position

- Method: DELETE
- Route: /elections/:electionId/positions/:positionId
- Access: Super-admin only
- Restriction: Not allowed after voting has started.

### 10. Edit a candidate

- Method: PATCH
- Route: /elections/:electionId/positions/:positionId/candidates/:candidateId
- Access: Super-admin only
- Body:
  - fullName: string (optional)
  - imgurl: string (optional)
- Restriction: Not allowed after voting has started.

### 11. Delete a candidate

- Method: DELETE
- Route: /elections/:electionId/positions/:positionId/candidates/:candidateId
- Access: Super-admin only
- Restriction: Not allowed after voting has started.

### 12. Vote in an election (one-time bulk submission)

- Method: POST
- Route: /elections/:electionId/vote
- Access: Student only
- Body:
  - votes: array of vote entries
    - positionId: string
    - candidateId: string
- Restriction: Vote is accepted only within the startDate and endDate range.
- Student can submit only once per election.
- Payload must include exactly one vote for every position in the election.

### 13. Collate results

- Method: POST
- Route: /elections/:electionId/collate-results
- Access: Super-admin only
- Restriction: Can only run after endDate has passed.
- Stores the final result snapshot and winner for each position.

### 14. Publish result

- Method: PATCH
- Route: /elections/:electionId/publish-results
- Access: Super-admin only
- Makes the result visible to the broader audience.

### 15. View election results

- Method: GET
- Route: /elections/:electionId/results
- Access:
  - Super-admin can view while private and after publication
  - General public can only view after publication

## Example success response

```json
{
  "success": true,
  "message": "Election results published successfully",
  "data": [
    {
      "positionId": "64d9...",
      "title": "President",
      "totalVotes": 240,
      "winner": {
        "candidateId": "64d9...",
        "fullName": "Ada Smith",
        "imgurl": "https://...",
        "voteCount": 140
      },
      "candidates": [
        {
          "candidateId": "64d9...",
          "fullName": "Ada Smith",
          "imgurl": "https://...",
          "voteCount": 140
        }
      ]
    }
  ]
}
```
