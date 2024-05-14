/*

An SN2 reaction is when a nucleophile attacks a carbon that is bonded to a leaving group. The nucleophile attacks
the carbon because the carbon is partial positive charge due to the leaving group. When the nucleophile attacks the carbon
it causes the bond between the leaving group and the carbon to break.

Requirements:
Nucleophile with a pair of electrons to donate.
Carbon attached to leaving group.
A good leaving group.
Carbon that is NOT a tertiary carbon ie is bonded to at least one hydrogen atom.

Good leaving groups are typically weak bases, and weak bases are the conjugate bases of strong aicds. Halides are the most
common leaving groups in SN2 reactions.

Hydroxide ion (OH-), alkoxides (RO-) and amide ion (NH2-) are bad leaving groups.

SN1 reactions prefer protic solvents. Protic solvents are those that contain O-H or N-H bonds such as water and alcohols.

SN2 reactions prefer aprotic solvents. Aprotic solvents have no N-H or O-H bonds such as dimethyl sufoxide, CH2CL2, and ethers (R-O-R).

Reversal:

First look for a container product that is a leaving group such as a halide. Next look for a carbon that is not a tertiary carbon. Then
look for bond on that carbon that is bonded to a possible former nucleophile. Bond the leaving group to the carbon and break the
bond between the bond and the former nucleophile


The SN2 reaction is a type of reaction mechanism that is common in organic chemistry. In this mechanism, one bond is broken and one bond is formed synchronously, i.e.,
 in one step. SN2 is a kind of nucleophilic substitution reaction mechanism. Since two reacting species are involved in the slow (rate-determining) step, this leads to the
 term substitution nucleophilic (bi-molecular) or SN2, the other major kind is SN1.[1] Many other more specialized mechanisms describe substitution reactions.
The reaction type is so common that it has other names, e.g. "bimolecular nucleophilic substitution", or, among inorganic chemists, "associative substitution" or
"interchange mechanism".

Params in: container, leaving group as product, former SN2 carbon, former SN2 nucleophile
Params out: container

*/
/*
CALL pushElectronPairReverse using leaving group, former SN1 carbon
CALL pushElectronPairReverse using forer SN1 carbon, former SN1 nucleophile
 */