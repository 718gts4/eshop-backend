# Vendor Support Query Endpoints

1. Create a new vendor support query:
   - Method: POST
   - Endpoint: `${baseURL}vendor-support-query/`
   - Body: 
     ```
     {
       "queryType": "Product" | "Customer" | "Settlement" | "Order" | "Video",
       "initialMessage": "Initial query message"
     }
     ```
   - Response: The created vendor support query object

2. Get all vendor support queries for a user:
   - Method: GET
   - Endpoint: `${baseURL}vendor-support-query/user/:userId`
   - Response: An array of vendor support query objects for the specified user, sorted by `lastMessageAt` in descending order

3. Get a specific vendor support query:
   - Method: GET
   - Endpoint: `${baseURL}vendor-support-query/:queryId`
   - Response: The vendor support query object with the specified ID, including populated participant and message sender information

4. Add a message to a vendor support query:
   - Method: POST
   - Endpoint: `${baseURL}vendor-support-query/:queryId/message`
   - Body:
     ```
     {
       "content": "Message content"
     }
     ```
   - Response: The updated vendor support query object with the new message

5. Mark messages as read:
   - Method: PUT
   - Endpoint: `${baseURL}vendor-support-query/:queryId/read`
   - Response: The updated vendor support query object with messages marked as read for the authenticated user

6. Get all vendor support queries for the authenticated user:
   - Method: GET
   - Endpoint: `${baseURL}vendor-support-query/user`
   - Response: An array of vendor support query objects for the authenticated user, sorted by creation date in descending order

7. Get all vendor support queries (superAdmin only):
   - Method: GET
   - Endpoint: `${baseURL}vendor-support-query/all`
   - Response: An array of all vendor support query objects, sorted by creation date in descending order

Note: In the above endpoints, `baseURL` should be set to the appropriate base URL for your API. The front-end should implement these URLs in the following format:

```js
const URL_ENDPOINT = `${baseURL}vendor-support-query/`
```

These endpoints allow the front-end to create, read, and manage vendor support queries, as well as add messages and mark them as read. The superAdmin has additional access to view all queries across the system.
