/*

An SN1 reaction is when a leaving group leaves, creating a carbocation (C+). A nucleophile then attacks the carbocation
forming a bond.

Example
@see https://chem.libretexts.org/Courses/University_of_Illinois_Springfield/UIS%3A_CHE_267_-_Organic_Chemistry_I_(Morsch)/Chapters/Chapter_07%3A_Alkyl_Halides_and_Nucleophilic_Substitution/7.12%3A_The_SN1_Mechanism
substrate: 2-Bromo-2-methylpropane
reagent: sodium cyanide
solvent: diethyl ether

Requirements:
Nucleophile with a pair of electrons to donate.
Carbon attached to leaving group.
A good leaving group.
Carbon that is preferably a tertiary carbon.

Good substrates for the SN1 reaction are those that form a stable carbocation. In order these are:

Tertiary and benzylic (carbon bonded to benzene)
Secondary and alylic
Primary (worse)

SN1 reactions prefer protic solvents. Protic solvents are those that contain O-H or N-H bonds such as water and alcohols.

SN2 reactions prefer aprotic solvents. Aprotic solvents have no N-H or O-H bonds such as dimethyl sufoxide, CH2CL2, and ethers (R-O-R).


Reversal:

First look for a container product that is a leaving group such as a halide. Next look for a carbon that is not a tertiary carbon. Then
look for bond on that carbon that is bonded to a possible former nucleophile. Bond the leaving group to the carbon and break the
bond between the bond and the former nucleophile

The SN1 reaction is a substitution reaction in organic chemistry. "SN" stands for "nucleophilic substitution", and the "1" says that the rate-determining step is unimolecular.[1][2]
Thus, the rate equation is often shown as having first-order dependence on electrophile and zero-order dependence on nucleophile. This relationship holds for situations where the amount of
 nucleophile is much greater than that of the carbocation intermediate. Instead, the rate equation may be more accurately described using steady-state kinetics. The reaction involves a
 carbocation intermediate and is commonly seen in reactions of secondary or tertiary alkyl halides under strongly basic conditions or, under strongly acidic conditions, with secondary or t
 ertiary alcohols. With primary and secondary alkyl halides, the alternative SN2 reaction occurs. In inorganic chemistry, the SN1 reaction is often known as the dissociative mechanism.
 This dissociation pathway is well-described by the cis effect. A reaction mechanism was first proposed by Christopher Ingold et al. in 1940.[3] This reaction does not depend much on the strength
 of the nucleophile unlike the SN2 mechanism. This type of mechanism involves two steps. The first step is the reversible ionization of Alkyl halide in the presence of aqueous acetone or an
 aqueous ethyl alcohol. This step provides a carbocation as an intermediate.

Params in: container, leaving group as product, former SN1 carbon, former SN1 nucleophile
Params out: container
*/

/*
CALL pushElectronPairReverse using leaving group, former SN1 carbon
CALL pushElectronPairReverse using forer SN1 carbon, former SN1 nucleophile
 */