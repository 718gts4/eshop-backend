# New Endpoints for Vendor Support Queries

1. Create a new vendor support query:
   - Method: POST
   - Endpoint: `/api/v1/vendor-support-query`
   - Body: 
     ```
     {
       "userId": "user_id",
       "subject": "Query subject",
       "message": "Initial query message"
     }
     ```
   - Response: The created vendor support query object

2. Get all vendor support queries for a user:
   - Method: GET
   - Endpoint: `/api/v1/vendor-support-query/user/:userId`
   - Response: An array of vendor support query objects for the specified user

3. Get a specific vendor support query:
   - Method: GET
   - Endpoint: `/api/v1/vendor-support-query/:id`
   - Response: The vendor support query object with the specified ID

4. Update a vendor support query:
   - Method: PUT
   - Endpoint: `/api/v1/vendor-support-query/:id`
   - Body: 
     ```
     {
       "subject": "Updated subject",
       "status": "in_progress"
     }
     ```
   - Response: The updated vendor support query object

5. Delete a vendor support query:
   - Method: DELETE
   - Endpoint: `/api/v1/vendor-support-query/:id`
   - Response: A success message if the query was deleted successfully

6. Add a message to a vendor support query:
   - Method: POST
   - Endpoint: `/api/v1/vendor-support-query/:id/messages`
   - Body:
     ```
     {
       "senderId": "user_id",
       "content": "Message content"
     }
     ```
   - Response: The updated vendor support query object with the new message

7. Get all messages for a vendor support query:
   - Method: GET
   - Endpoint: `/api/v1/vendor-support-query/:id/messages`
   - Response: An array of message objects for the specified vendor support query

These new endpoints allow the front-end to create, read, update, and delete vendor support queries, as well as add and retrieve messages for each query. The front-end team should implement corresponding API calls and UI components to interact with these endpoints, enabling users to manage their support queries and communicate with vendors or support staff.

Remember to handle authentication and authorization appropriately when making these API calls from the front-end, as some of these endpoints may require specific user roles or permissions.
