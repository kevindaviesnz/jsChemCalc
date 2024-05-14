/*

@see https://www.masterorganicchemistry.com/2017/09/01/reductive-amination/
@see https://cdn.masterorganicchemistry.com/wp-content/uploads/2017/08/3-mech19.png?_ga=2.237710665.832783806.1638748877-827591198.1638748877
@see https://www.masterorganicchemistry.com/2010/05/21/lets-talk-about-the-12-elimination/
@see https://www.masterorganicchemistry.com/2010/05/19/proton-transfers-can-be-tricky/
@see https://www.masterorganicchemistry.com/2017/03/22/reactions-of-dienes-12-and-14-addition/
@see https://chem.libretexts.org/Courses/University_of_Illinois_Springfield/UIS%3A_CHE_269_(Morsch_and_Andrews)/Chapters/Chapter_16%3A_Conjugation%2C_Resonance%2C_and_Dienes/16.08_Electrophilic_Addition%3A_1%2C2-_Versus_1%2C4-Addition

1,2 - addition: HX adds across two adjacent carbons.

Note that this will need a lot of revision as how the Lewis base atom is chosen is not completely understoond

Order:

Aldehyde O=C(R)H Oxygen atom -> ketone O=C(R)R Oxygen atom

Params in: molecule, carbonyl carbon, carbonyl oxygen, electron pair donor
Return molecule

GET electron pair from electron pair donor atom
CALL pushElectronPair using carbonyl carbon, electron pair, electron pair donor RETURN molecule
GET electron pair from carbonyl carbon,
CALL pushElectronPair using carbonyl carbon, electron pair, carbonyl oxygen atom RETURN molecule

 */