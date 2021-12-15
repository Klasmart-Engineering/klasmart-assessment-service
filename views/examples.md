
# Examples

Basic query:


```gql
query {
  Room(room_id: "619b32cd1dcd01c5dc3a8779") {
    scoresByUser {
      user {
        user_id
        given_name
        family_name
      }
      scores {
        content {
          content_id
          name
          type
          name
          h5p_id
          subcontent_id
          parent_id
        }
      }
    }
  }
}
```
