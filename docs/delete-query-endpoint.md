# Delete Query Endpoint Documentation

This document provides instructions for front-end developers on how to use the new delete query endpoint for vendor support queries.

## Endpoint Details

- **URL**: `/api/v1/vendor-support-query/:queryId`
- **Method**: DELETE
- **Authentication**: Required (JWT token)
- **Authorization**: SuperAdmin only

## Request

### Headers

- `Authorization`: Bearer {JWT_TOKEN}

### URL Parameters

- `queryId`: The ID of the vendor support query to be deleted

## Response

### Success Response

- **Code**: 200 OK
- **Content**:
  ```json
  {
    "message": "Support query deleted successfully"
  }
  ```

### Error Responses

1. **Not Found**
   - **Code**: 404 Not Found
   - **Content**:
     ```json
     {
       "message": "Support query not found"
     }
     ```

2. **Unauthorized**
   - **Code**: 403 Forbidden
   - **Content**:
     ```json
     {
       "message": "Only superAdmin can delete support queries"
     }
     ```

3. **Server Error**
   - **Code**: 500 Internal Server Error
   - **Content**:
     ```json
     {
       "message": "Error deleting support query",
       "error": "Error details"
     }
     ```

## Usage Example

Here's an example of how to use this endpoint with JavaScript fetch API:

```javascript
const deleteQuery = async (queryId) => {
  try {
    const response = await fetch(`/api/v1/vendor-support-query/${queryId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${yourJWTToken}`,
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to delete query');
    }

    const data = await response.json();
    console.log(data.message); // "Support query deleted successfully"
    // Handle successful deletion (e.g., update UI, show success message)
  } catch (error) {
    console.error('Error deleting query:', error);
    // Handle error (e.g., show error message to user)
  }
};
```

## Notes

- Ensure that only users with superAdmin role have access to this functionality in your front-end application.
- After successful deletion, make sure to update your UI accordingly (e.g., remove the deleted query from the list of queries).
- Handle errors gracefully and provide appropriate feedback to the user.
