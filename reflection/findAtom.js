
/*
Params in: atomCriteria, molecule

SET atom to false
WHILE atom is false
   GET atom from molecule
   CALL atomCriteria using atom, molecule RETURNING atom
ENDWHILE

RETURN atom


 */