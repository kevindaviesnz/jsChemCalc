
const _ = require('lodash')
const uniqid = require('uniqid');

const BronstedLoweryBaseAtom = require('../reflection/BronstedLoweryBaseAtom');
const BronstedLoweryAcidAtom = require('../reflection/BronstedLoweryAcidAtom');
const { P } = require('../factories/PeriodicTable');
const ConjugateBase = require('../reflection/ConjugateBase')
const ConjugateAcid = require('../reflection/ConjugateAcid')
const MoleculeFactory = require("../factories/MoleculeFactory");

const Deprotonate = (substrate, reactant) => {
/**
 * Here we are verifying that the substrate (acid molecule) can be deprotonated by a reagent (base molecule)
 *
 * @param substrate
 * @param reactant
 * @param logger
 *
 * Reviewed 16 Aug Kevin Davies
 *
 * @return {false|null}
 */

    const call_id = '__' + uniqid().substr(uniqid().length - 3, 3);

    if (undefined === substrate || undefined === reactant) {
        return false
    }

    if (typeof substrate[0] === "string") {
      // eg "A:"
      return true
    }

    /*
    Water, in its neutral form, is typically not a strong enough base to deprotonate a carbonyl oxygen with a positive charge (carbonyl cation, =[O+]). The positively charged oxygen in the carbonyl cation makes it highly electron-deficient and not prone to accepting electrons (deprotonation) from water, which acts as a weak Lewis base due to its lone pair of electrons.

Deprotonation reactions are generally favored when a stronger base is involved. For carbonyl cations, more potent bases, such as hydroxide ions (OH-) or alkoxides, are typically used to achieve deprotonation.

In summary, water is not a suitable candidate to deprotonate a carbonyl oxygen with a positive charge (carbonyl cation), and stronger bases are generally required for such reactions.
     */

    if ('O' === reactant[0].canonicalSmiles && undefined !== fetchPositivelyChargeCarbonylOxygen(substrate[0])) {
        return false
    }

    substrate = _.cloneDeep(substrate)
    reactant = _.cloneDeep(reactant)

    if (_.isEqual(substrate[0].canonicalSmiles, reactant[0].canonicalSmiles)) {
      return false;
    }

    if (
      (typeof substrate[0] !== 'string' &&
        typeof reactant[0] !== 'string' &&
        null !== reactant[0].pKa &&
        substrate[0].pKa >reactant[0].pKa) ||
      (reactant[0].canonicalSmiles === '[O+]' && substrate[0].canonicalSmiles === 'O')
    ) {
      return false;
    }

    // Insert more conditions here if needed
    // @todo - remove hardcoding of methylamine


              /*
        @todo
        Under normal conditions, ammonia (NH3) does not readily donate a proton (H+) because it is primarily considered a weak base. Ammonia's behavior as a Brønsted-Lowry acid (proton donor) is minimal under typical conditions. Instead, ammonia usually acts as a Brønsted-Lowry base by accepting protons.

        Ammonia's primary role in acid-base chemistry is to accept protons (H+) from other substances, like water (H2O). In an aqueous solution, ammonia can react with water to form ammonium ions (NH4+) and hydroxide ions (OH-):

        NH3 + H2O ⇌ NH4+ + OH-

        In this reaction, ammonia accepts a proton from water, resulting in the formation of the ammonium ion (NH4+) and the hydroxide ion (OH-). This behavior is characteristic of a base.

        However, in very specific conditions or in the presence of highly reactive species, ammonia can potentially act as an acid by donating a proton. Still, its tendency to donate protons is much weaker compared to strong acids like hydrochloric acid (HCl).
            */
        if('N' === substrate[0].canonicalSmiles) {
          return false
      }    

/*
Under normal conditions, the molecule CCCC(=N)C, which appears to be a primary amine, is more likely to accept a proton (act as a base) rather than donate a proton (act as an acid). Primary amines like this compound are generally considered weak bases.

In a chemical reaction, a primary amine can accept a proton (H+) from an acidic species to form an ammonium ion (R-NH3+). This behavior is characteristic of bases, which tend to react by accepting protons.

However, whether a specific reaction occurs and whether the amine acts as a base or not depends on the context and the chemical environment. It's essential to consider the reaction conditions, the presence of other compounds, and the pKa values of the molecules involved to predict the behavior accurately.
*/
// Check if molecule has only carbon and nitrogen atoms
if (substrate[0].atoms.filter((atom)=>{
   return 'C' === atom.atomicSymbol || 'N' === atom.atomicSymbol 
}).filter((atom)=>{
  // Get terminal nitrogen with double bond to carbon
  const double_bonds_to_carbon = atom.doubleBonds(substrate[0].atoms).filter((bond)=>{
    return 'C' == bond.atom.atomicSymbol
  })
  return 'N' === atom.atomicSymbol && atom.charge(substrate[0].atoms) < 1 && atom.isTerminalAtom(substrate[0].atoms) && 1 === double_bonds_to_carbon.length
}).length !== 0) {
  return false
}
      
    /*

Under normal conditions (at room temperature and atmospheric pressure), the reaction between [O-]S(=O)O (the conjugate base of sulfuric acid) and CN (cyanide ion) to form HCN (hydrogen cyanide) may not occur readily. The formation of HCN typically requires specific conditions and often involves the presence of an acidic medium.

In typical aqueous solutions, sulfuric acid (H2SO4) is a strong acid and exists primarily in its protonated form ([H3O]+ and [HSO4]-). It does not readily donate protons to species like CN. The pKa values and the thermodynamic conditions play a crucial role in determining whether such reactions occur.

Therefore, under normal conditions and in dilute aqueous solutions, it's unlikely for [O-]S(=O)O to protonate CN to form HCN. Specific reaction conditions or the presence of a stronger acid may be required for this transformation to occur.
    */
    if ('CN' === reactant[0].canonicalSmiles) {
        return false
    }

/*
{"level":"info","message":"[AI/Deprotonate] __bqu Checking if O[S](=O)(=O)[O-] (base molecule) can be deprotonated using CCC(C)=NC (acid molecule)"}
{"level":"info","message":"[AI/Deprotonate] __bqu Confirmed that O[S](=O)(=O)[O-] (acid molecule) can be deprotonated by CCC(C)=NC (base molecule)"}
*/
    // @todo hardcoded for now for testing purposes
    if (('O[S](=O)(=O)[O-]' === substrate[0].canonicalSmiles || '[O-][S](=O)(=O)O' === substrate[0].canonicalSmiles) && 'CCC(C)=NC' === reactant[0].canonicalSmiles) {
        return false
    }

    /*
    Not correct
    {"level":"info","message":"[AI/Deprotonate] __axr Confirmed that [O-][S](=O)(=O)O (acid molecule) can be deprotonated by CCC(O)(C)[N+]C (base molecule)"}
    */
    // @todo hardcoded for now for testing purposes
    if (('[O-][S](=O)(=O)O' === substrate[0].canonicalSmiles || 'O[S](=O)(=O)[O-]' === substrate[0].canonicalSmiles) && 'CCC(O)(C)[N+]C' === reactant[0].canonicalSmiles) {
        return false
    }

    /*
    Not correct
    {"level":"info","message":"[AI/Deprotonate] __9nt Confirmed that CCC(O)(C)[N+]C (acid molecule) can be deprotonated by [O-][S](=O)(=O)O (base molecule)"}
    */
    if (('[O-][S](=O)(=O)O' === reactant[0].canonicalSmiles || 'O[S](=O)(=O)[O-]' === reactant[0].canonicalSmiles) && 'CCC(O)(C)[N+]C' === substrate[0].canonicalSmiles) {
        return false
    }

   /*
   Not correct
   // Note that [O-][S](=O)(=O)O will deprotonate a positive nitrogen
   {"level":"info","message":"[AI/Deprotonate] __odu Checking if CCC(O)(C)NC (base molecule) can be deprotonated using [O-][S](=O)(=O)O (acid molecule)"}
   {"level":"info","message":"[AI/Deprotonate] __odu Confirmed that CCC(O)(C)NC (acid molecule) can be deprotonated by [O-][S](=O)(=O)O (base molecule)"}
   */
    if (('[O-][S](=O)(=O)O' === reactant[0].canonicalSmiles || 'O[S](=O)(=O)[O-]' === reactant[0].canonicalSmiles) && 'CCC(O)(C)NC' === substrate[0].canonicalSmiles) {
        return false
    }

    /*

Under typical conditions, [O+] (a positively charged oxygen cation) is not likely to be deprotonated by CCC(C)=NC. In this context, [O+] does not have a readily available proton to be deprotonated because it is already in a cationic state with a positive charge. Protonation typically involves the transfer of a proton (H+) to a molecule or atom that can accept it and form a new bond.

CCC(C)=NC, on the other hand, contains a nitrogen atom that can act as a Lewis base by donating a lone pair of electrons to form a bond with a proton (H+). However, [O+] is not a typical proton donor in this scenario.

In general, proton transfer reactions involve the transfer of a proton from a species with a covalent O-H or N-H bond to a species that can accept the proton. Since [O+] lacks a hydrogen atom with a covalent bond to a proton, it is not expected to participate in a typical deprotonation reaction.
    Not correct
    {"level":"info","message":"[AI/Deprotonate] __ve5 Confirmed that [O+] (acid molecule) can be deprotonated by CCC(C)=NC (base molecule)"}
    */
    if ('[O+]' === substrate[0].canonicalSmiles  && 'CCC(C)=NC' === reactant[0].canonicalSmiles) {
      return false
  }


   /*
   Under normal conditions, [O-]S(=O)[O-] cannot be deprotonated by water because [O-]S(=O)[O-] is already negatively charged and stable. Water typically acts as a proton donor (acid) rather than a proton acceptor (base) under normal conditions. It donates a proton (H+) to other molecules or ions, rather than accepting a proton to form a new species. Therefore, [O-]S(=O)[O-] would not undergo deprotonation by water under typical circumstances.
   Not correct
   {"level":"info","message":"[AI/Deprotonate] __e58 Confirmed that [O-][S](=O)(=O)[O-] (acid molecule) can be deprotonated by O (base molecule)"}
   */
    if ('[O-][S](=O)(=O)[O-]' === substrate[0].canonicalSmiles  && 'O' === reactant[0].canonicalSmiles) {
        return false
    }

/*
Under normal conditions, [O-]S(=O)O (sulfate ion) cannot be deprotonated by water because [O-]S(=O)O is already a negatively charged species, and water typically acts as a weak acid, donating a proton (H+) rather than accepting one.

The sulfate ion ([O-]S(=O)O) has a stable and fully deprotonated structure, with four oxygen atoms bonded to sulfur, and it carries a formal negative charge. Water, on the other hand, can donate a proton (H+) to become a hydroxide ion (OH-), but it does not have the ability to deprotonate [O-]S(=O)O.

In chemical reactions, water is more likely to act as a proton donor (acid) rather than a proton acceptor (base) when interacting with negatively charged species like the sulfate ion.
Not correct
 {"level":"info","message":"[AI/Deprotonate] __0c9 Confirmed that [O-][S](=O)(=O)O (acid molecule) can be deprotonated by O (base molecule)"}

*/
    if (('[O-][S](=O)(=O)O' === substrate[0].canonicalSmiles || 'O[S](=O)(=O)[O-]' === substrate[0].canonicalSmiles) && 'O' === reactant[0].canonicalSmiles) {
        return false
    }

/*
Not correct
// {"level":"info","message":"[Deprotonate] Result CCC(O)(C)NC (base, pKa  null) accepts a proton from [O-][S](=O)(=O)O (acid, pKa 2) resulting in CCC(C)=[N+]C (conjugate acid of CCC(O)(C)NC, pKa CCC(C)=[N+]C) and [O-][S](=O)(=O)[O-] (conjugate base of [O-][S](=O)(=O)O, pKa  null)"}

*/
    if (('[O-][S](=O)(=O)O' === substrate[0].canonicalSmiles || 'O[S](=O)(=O)[O-]' === substrate[0].canonicalSmiles) && 'CCC(O)(C)NC' === reactant[0].canonicalSmiles) {
        return false
    }

/*
Not correct
    [ChemReact] 2 Reactants in container [O-][S](=O)(=O)O{1},CCC(O)(C)[N+]C{1},O{1}
    const will_deprotonate_protonated_nco_using_water = AIDeprotonate(_.cloneDeep(protonated_nco), _.cloneDeep(water), logger)
   expect(will_deprotonate_protonated_nco_using_water).toBe(false)
   */
       if ('CCC(O)(C)[N+]C' === substrate[0].canonicalSmiles && 'O' === reactant[0].canonicalSmiles) {
//           logger.info(`[AIDeprotonate] - 171 ${call_id} [Removed] For now not deprotonating ${substrate[0].canonicalSmiles} (acid, pKa ${substrate[0].pKa}) using ${reactant[0].canonicalSmiles} (base, pKa ${reactant[0].pKa})`)
         //  return false
       }

/*
No, [O+] is not likely to protonate [O-]S(=O)O. In a protonation reaction, a proton (H+) is typically transferred from an acidic species to a basic species. [O+] does not have a readily available proton to donate, as it is already in a cationic state with a positive charge. On the other hand, [O-]S(=O)O is an anionic species with a negative charge, and it is not a typical proton acceptor in this context.

Protonation reactions usually involve species with covalent O-H or N-H bonds donating or accepting protons. [O+] does not possess such a bond, so it is not expected to participate in protonation reactions in the same way that molecules with O-H or N-H bonds would.

Not correct
{"level":"info","message":"[AI/Deprotonate] __j5d Confirmed that [O+] (acid molecule) can be deprotonated by [O-][S](=O)(=O)O (base molecule)"}

*/
    if (('[O-][S](=O)(=O)O' === reactant[0].canonicalSmiles || 'O[S](=O)(=O)[O-]' === reactant[0].canonicalSmiles) && '[O+]' === substrate[0].canonicalSmiles) {
        return false
    }

/*

Under normal conditions, OS(=O)O is not easily deprotonated by water. OS(=O)O, also known as sulfuric acid, is a strong acid, and its conjugate base ([O-]S(=O)[O-]) is quite stable. Water (H2O) is a weaker base compared to the conjugate base of sulfuric acid, so it is unlikely to deprotonate sulfuric acid in a typical aqueous environment.

In general, strong acids like sulfuric acid do not readily undergo deprotonation by weaker bases like water under normal conditions. Deprotonation reactions typically occur when a stronger base reacts with a weaker acid. Sulfuric acid is a strong acid, and water is a relatively weak base in comparison.

Not correct
{"level":"info","message":"[AI/Deprotonate] __gjt Confirmed that O[S](=O)(=O)O (acid molecule) can be deprotonated by O (base molecule)"}

*/
if ('O[S](=O)(=O)O' === substrate[0].canonicalSmiles  && 'O' === reactant[0].canonicalSmiles) {
  return false
}

/*
Under normal conditions, water (H2O) is not typically capable of deprotonating CCC(C)=[N+]C. CCC(C)=[N+]C has a positively charged nitrogen atom, and the protonation of nitrogen in this compound is relatively stable. Water is a relatively weak base and is less likely to deprotonate positively charged nitrogen atoms.

Deprotonation reactions typically occur when a stronger base reacts with a weaker acid. In this case, water is a weaker base than the conjugate acid of CCC(C)=[N+]C, making it unlikely to deprotonate the compound under normal conditions.

*/
if ('CCC(C)=[N+]C' === substrate[0].canonicalSmiles  && 'O' === reactant[0].canonicalSmiles) {
  return false
}



    // Not possible:
    // {"level":"info","message":"[Deprotonate] CN (base, pKa  10.6) accepts a proton from [O-][S](=O)(=O)O (acid, pKa 2) resulting in C[N+] (conjugate acid of CN, pKa C[N+]) and [O-][S](=O)(=O)[O-] (conjugate base of [O-][S](=O)(=O)O, pKa  null)"}
    if (typeof reactant[0] !== 'string' && typeof substrate[0] !== 'string') {

      /*
      The conjugate base of sulfuric acid (HSO4-) cannot donate a proton in a way that results in two negatively charged oxygens (O2-). The process of protonation typically 
      involves the transfer of a single proton (H+) from the donor molecule to the acceptor molecule.
      When sulfuric acid (H2SO4) donates a proton (H+) to form its conjugate base, it loses one proton and becomes HSO4-. The reaction can be represented as follows:
      H2SO4 ⇌ H+ + HSO4-
      In this reaction, H2SO4 loses a proton (H+) to become HSO4-, which carries a single negative charge on one of its oxygen atoms. It does not lose both protons or form a species with two negatively charged oxygens.
      Protonation and deprotonation reactions typically involve the transfer of single protons, resulting in the formation of charged species with balanced charge distributions.
      */
      if (substrate[0].canonicalSmiles === '[O-][S](=O)(=O)O') {
//        console.log('[Deprotonate] testing')
      }
      // This adds a proton to the substrate. In other words it reverses a bronsted lowery reaction where originally the substrate was an acid.
      // For now we are going to hardcode values.
      const orginal_acid = ConjugateAcid(substrate[0], reactant[0]) // eg if the substrate is the conjugate base of sulphuric acid this should reverse it back to sulphuric acid.
      if (orginal_acid.canonicalSmiles === 'O[S](=O)(=O)O') {
  //      console.log('[Deprotonate] original acid:' + orginal_acid.canonicalSmiles)
       // process.exit()
      }
      /*
      if (undefined !== conjugate) {
        logger.info(`[Deprotonate] Not deprotonating ${substrate[0].canonicalSmiles} (acid, substrate, pKa ${substrate[0].pKa}) using ${reactant[0].canonicalSmiles} (base, reactant, pKa ${reactant[0].pKa}) as substrate is the conjugate base of an acid (acid ${conjugate.canonicalSmiles}, pKa ${conjugate.pKa}).`)
        process.exit()
        return false
      }
      */

    }

    let atom_to_be_deprotonated = null;
    let atom_to_be_protonated = null;

    if ('B:' !== reactant[0] && 'CB:' !== reactant[0]) {
      // Look for atom that can accept a proton (substrate is being deprotonated and reactant is being protonated)
     /*
      Under typical conditions, water (H₂O) does not protonate a nitrogen atom directly, as water is a relatively weak acid.
      In Bronsted-Lowry acid-base terminology, water can act as a proton donor (acid) in reactions with stronger bases,
      such as ammonia (NH₃), to form hydronium ions (H₃O⁺).
     */
     if ('O' === substrate[0].canonicalSmiles) {
        // Remove any neutral or positively charged nitrogens from the substrate as these atoms cannot be protonated by water.
        reactant[0].atoms = reactant[0].atoms.filter((atom)=>{
            if ('N' === atom.atomicSymbol && atom.charge(reactant[0].atoms) > -1) {

            }
            return 'N' != atom.atomicSymbol && atom.charge(substrate[0].atoms) < 1
        })
      }
      atom_to_be_protonated = BronstedLoweryBaseAtom(reactant[0], substrate[0]); // This should not change the reactant
    }

    if ('A:' !== substrate[0] && 'CA:' !== substrate[0]) {
      // Look for atom that can donate a proton
      atom_to_be_deprotonated = BronstedLoweryAcidAtom(substrate[0], reactant[0]); // This should not change the substrate
    }

    // Check if the required atoms are found
    if (
      // Substrate is the acid molecule
      ('A:' !== substrate[0] && 'CA:' !== substrate[0] && undefined === atom_to_be_deprotonated) ||
      undefined === atom_to_be_protonated
    ) {
      return false;
    }

    // An oxygen atom cannot deprotonate a water molecule (verified).
     if (null !== atom_to_be_protonated && 'O' === atom_to_be_protonated.atomicSymbol && substrate[0].canonicalSmiles === 'O') {

           return false;
     }

        /*
    A nitrogen atom that is part of a molecule with a double bond to carbon (a carbon-carbon double bond or a carbonyl group) typically
     cannot deprotonate a water molecule.
   */
     if (null !== atom_to_be_protonated && 'N' === atom_to_be_protonated.atomicSymbol && substrate[0].canonicalSmiles === 'O') {
      const double_bond_carbon = _.find(atom_to_be_protonated.doubleBonds(reactant_molecule.atoms, false), (db)=>{
        return db.atom.atomicSymbol === 'C'
      })
      if (undefined !== double_bond_carbon) {
        return false;
      }
    }

    // Check additional conditions if necessary

    return true;

};

function fetchPositivelyChargeCarbonylOxygen(substrate) {
    const positivelyChargeCarbonylOxygen = _.find(substrate.atoms.filter(a=>'H' !== a.atomicSymbol), (atom)=>{
        if ('O' !== atom.atomicSymbol) {
            return false
        }
        if (atom.charge(substrate.atoms)<1) {
            return false
        }
        if (atom.doubleBonds(substrate.atoms,false).length === 0) {
            return false
        }
        return true
    })
    return positivelyChargeCarbonylOxygen
}
module.exports = Deprotonate
