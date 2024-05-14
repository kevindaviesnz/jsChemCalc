/*

@see https://www.masterorganicchemistry.com/2017/03/22/reactions-of-dienes-12-and-14-addition/

1,2 - addition: HX adds across two adjacent carbons.

Note that this will need a lot of revision as how the Lewis base atom is chosen is not completely understoond

Order:

Aldehyde O=C(R)H carbon (=) atom -> ketone O=C(R)R carbon (=) atom

CALL getAldehydeFunctionalGroup using container RETURN aldehyde
if aldehyde found
   FIND carbon atom on double bond on aldehyde RETURN lewis base atom
ELSE CALL getKetoneFunctionalGroup using container RETURN lewis base atom
   FIND carbon atom on double bond on ketone RETURN lewis base atom
END IF

RETURN lewis base atom


 */