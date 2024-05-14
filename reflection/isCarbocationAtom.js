
/*

A carbocation atom is a carbon atom bears three bonds and a positive charge.

 */
/*
Params in: atom, molecule

CALL isCarbonAtom using atom RETURNING atomIsCarbon
CALL getTheAtomCharge using atom RETURNNG atomCharge
CALL getTheAtomBonds using atom RETURNING bonds
RETURN atomIsCarbon AND atomCharge is positive and bonds count is 3

*/

