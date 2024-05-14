
/*
Params in: items, criteria

Criteria should return TRUE or FALSE

SET item to false
WHILE current item is false
   GET current item from items
   CALL criteria using current item RETURNING item
ENDWHILE

RETURN item


 */