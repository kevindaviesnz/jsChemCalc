/*

If the source atom and target atoms are bonded then we know that an electron pair was pushed to the
target atom from the source atom to form a bond. In this case we reverse by moving the electron pair back to the source
atom.

If the source atom and target atom are not bonded then we know that the source atom and target atom were bonded
but the electron pair making up the bond was pushed to the target atom. In this case we reverse by copying the electron pair
to the source atom.

 */

/*

Params in: source atom, target atom, electron pair

 */

/*

IF CALL getSourceAtomTargetAtomBond using source atom, target atom
    MOVE electron pair from target atom to source atom
ELSE
    COPY electron pair from target atom to source atom
ENDIF



 */