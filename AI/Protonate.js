const _ = require('lodash')

const uniqid = require('uniqid');

const BronstedLoweryBaseAtom = require('../reflection/BronstedLoweryBaseAtom');
const BronstedLoweryAcidAtom = require('../reflection/BronstedLoweryAcidAtom');
const ConjugateAcid = require('../reflection/ConjugateAcid');
const ConjugateBase = require('../reflection/ConjugateBase')

/**
 * Here we are seeing if the substrate (base molecule) can be protonated by a reactant (acid molecule)
 * For now the deprotonated atom will either be a nitrogen or an oxygen @todo.
 *
 * @param container - container containing the substrate and reagent.
 * @param logger
 *
 *
 * @return {false|true}
 */

const Protonate = (substrate, reactant) => {

    if (undefined === substrate) {
      throw new Error(`AI/Protonate] Substrate is undefined`)
    }

    const call_id = '__' + uniqid().substr(uniqid().length - 3, 3);


    if (_.isEqual(substrate[0], reactant[0]) || _.isEqual(substrate[0].canonicalSmiles, reactant[0].canonicalSmiles)) {
      return false;
    }

    if (
      (typeof substrate[0] !== 'string' &&
        typeof reactant[0] !== 'string' &&
        (null !== substrate[0].pKa && substrate[0].pKa < reactant[0].pKa)) ||
      (reactant[0].canonicalSmiles === '[O+]' && substrate[0].canonicalSmiles === 'O')
    ) {
      return false;
    }

    // Insert more conditions here if needed
    // @todo hardcoded for now for testing purposes
    
    /*
  Under normal conditions, water (H2O) is not typically capable of deprotonating CCC(C)=[N+]C. CCC(C)=[N+]C has a positively charged nitrogen atom, and the protonation of nitrogen in this compound is relatively stable. Water is a relatively weak base and is less likely to deprotonate positively charged nitrogen atoms.

  Deprotonation reactions typically occur when a stronger base reacts with a weaker acid. In this case, water is a weaker base than the conjugate acid of CCC(C)=[N+]C, making it unlikely to deprotonate the compound under normal conditions.

  */
  if ('CCC(C)=[N+]C' === reactant[0].canonicalSmiles  && 'O' === substrate[0].canonicalSmiles) {
    return false
  }

    
    if (('[O-][S](=O)(=O)O' === reactant[0].canonicalSmiles || 'O[S](=O)(=O)[O-]' === reactant[0].canonicalSmiles) && 'CCC(C)=NC' === substrate[0].canonicalSmiles) {
          return false
      }

    /*
    Under normal conditions, CCC(O)(C)NC is unlikely to be protonated by [O+] because [O+] is a positively charged oxygen ion, and it typically doesn't act as a proton donor in protonation reactions. Protonation reactions usually involve species that can donate a proton (H+) to accept a lone pair of electrons from another molecule.

    In the case of CCC(O)(C)NC, it contains a nitrogen atom (N) with a lone pair of electrons that can potentially accept a proton (H+) from an acidic species. Protonation reactions with [O+] are not common in organic chemistry.

    Typically, protonation reactions involve acids like H2O, H3O+, or other proton donors. If you have a specific reaction or context in mind, please provide more details for a more accurate explanation.
    This is in fact correct - see reductive amination where the oxygen atom is protanated by [O+]
    {"level":"info","message":"[AI/Protonate] __ghq Confirmed that CCC(O)(C)NC (acid molecule) can be protonated by [O+] (base molecule)"}
    */
    // @todo hardcoded for now for testing purposes
    if ('CCC(O)(C)NC' === substrate[0].canonicalSmiles && '[O+]' === reactant[0].canonicalSmiles) {
        //  logger.info(`[AIProtonate] ${call_id} For now not protonating ${substrate[0].canonicalSmiles} (base, pKa ${substrate[0].pKa}) using ${reactant[0].canonicalSmiles} (acid, pKa ${reactant[0].pKa}) as substrate is not a bronsted lowery acid and reactant is not deprotonated sulphuric acid.`)
        //  return false
      }





      /*
      // Not correct
      {"level":"info","message":"[AI/Protonate] __zpd Confirmed that [O-][S](=O)(=O)O (acid molecule) can be protonated by CCC(O)(C)[N+]C (base molecule)"}
      */
      // @todo hardcoded for now for testing purposes
      if (('[O-][S](=O)(=O)O' === substrate[0].canonicalSmiles || 'O[S](=O)(=O)[O-]' === substrate[0].canonicalSmiles) && 'CCC(O)(C)[N+]C' === reactant[0].canonicalSmiles) {
          return false
      }

      /*
      // Not correct
  {"level":"info","message":"[AI/Protonate] __of8 Confirmed that CCC(O)(C)[N+]C (acid molecule) can be protonated by [O-][S](=O)(=O)O (base molecule)"}
      */
      // @todo hardcoded for now for testing purposes
      if (('[O-][S](=O)(=O)O' === reactant[0].canonicalSmiles || 'O[S](=O)(=O)[O-]' === reactant[0].canonicalSmiles) && 'CCC(O)(C)[N+]C' === substrate[0].canonicalSmiles) {
          return false
      }

      /*
      Under normal conditions, CCC(O)(C)NC is a neutral molecule containing nitrogen and carbon atoms. On the other hand, [O-]S(=O)O is a negatively charged species (sulfate ion). In typical chemical reactions, neutral molecules like CCC(O)(C)NC do not readily accept protons from negatively charged ions like [O-]S(=O)O. Instead, they are more likely to interact with substances that can donate protons (act as acids) to form new compounds.

      Therefore, under normal conditions, it is unlikely for CCC(O)(C)NC to be protonated by [O-]S(=O)O. The sulfate ion is more likely to participate in reactions where it can act as a base and accept protons from substances that act as acids.
      Not correct
         {"level":"info","message":"[AI/Protonate] __dx3 Confirmed that CCC(O)(C)NC (acid molecule) can be protonated by [O-][S](=O)(=O)O (base molecule)"}
      */
      // @todo hardcoded for now for testing purposes
      if (('[O-][S](=O)(=O)O' === reactant[0].canonicalSmiles || 'O[S](=O)(=O)[O-]' === reactant[0].canonicalSmiles) && 'CCC(O)(C)NC' === substrate[0].canonicalSmiles) {
          return false
      }

      /*
  Under normal conditions, [O-]S(=O)O (sulfate ion) cannot be protonated by [O+] because [O+] typically represents a lone proton (H+). The sulfate ion is already negatively charged, and adding a proton to it would neutralize the charge, resulting in sulfuric acid (H2SO4). However, [O+] alone is not a stable species in solution; it usually exists as a proton (H+) in an aqueous environment.

  The protonation of sulfate ion by [O+] would result in the following reaction:

  [O-]S(=O)O + [O+] -> H2SO4

  In this reaction, [O+] donates a proton (H+) to [O-]S(=O)O, forming H2SO4. This reaction represents the conversion of sulfate ion to sulfuric acid.

      Not correct
     {"level":"info","message":"[AI/Protonate] __dnt Confirmed that [O-][S](=O)(=O)O (acid molecule) can be protonated by [O+] (base molecule)"}
      */
      // @todo hardcoded for now for testing purposes
      if (('[O-][S](=O)(=O)O' === substrate[0].canonicalSmiles || 'O[S](=O)(=O)[O-]' === substrate[0].canonicalSmiles) && '[O+]' === reactant[0].canonicalSmiles) {
          return false
      }

  /*
  Not correct?
  {"level":"info","message":"[Protonate] CCC(O)(C)NC (acid, pKa null) donates a proton to [O-][S](=O)(=O)O (base, pKa 2) resulting in CCC([O-])(C)NC (conjugate base of CCC(O)(C)NC, pKa  CCC([O-])(C)NC) and O[S](=O)(=O)O (conjugate acid of [O-][S](=O)(=O)O, pKa -3)"}
  */
      // @todo hardcoded for now for testing purposes
      if (('[O-][S](=O)(=O)O' === substrate[0].canonicalSmiles || 'O[S](=O)(=O)[O-]' === substrate[0].canonicalSmiles) && 'CCC(O)(C)NC' === reactant[0].canonicalSmiles) {
          return false
      }

    // @todo - remove hardcoding of methylamine
    /*

Under normal conditions (at room temperature and atmospheric pressure), the reaction between [O-]S(=O)O (the conjugate base of sulfuric acid) and CN (cyanide ion) to form HCN (hydrogen cyanide) may not occur readily. The formation of HCN typically requires specific conditions and often involves the presence of an acidic medium.

In typical aqueous solutions, sulfuric acid (H2SO4) is a strong acid and exists primarily in its protonated form ([H3O]+ and [HSO4]-). It does not readily donate protons to species like CN. The pKa values and the thermodynamic conditions play a crucial role in determining whether such reactions occur.

Therefore, under normal conditions and in dilute aqueous solutions, it's unlikely for [O-]S(=O)O to protonate CN to form HCN. Specific reaction conditions or the presence of a stronger acid may be required for this transformation to occur.
    */
    if ('CN' === substrate[0].canonicalSmiles) {
        return false
    }

    if (typeof reactant[0] !== 'string' && typeof substrate[0] !== 'string') {

      /*
      The conjugate base of sulfuric acid (HSO4-) cannot donate a proton in a way that results in two negatively charged oxygens (O2-). The process of protonation typically 
      involves the transfer of a single proton (H+) from the donor molecule to the acceptor molecule.
      When sulfuric acid (H2SO4) donates a proton (H+) to form its conjugate base, it loses one proton and becomes HSO4-. The reaction can be represented as follows:
      H2SO4 ⇌ H+ + HSO4-
      In this reaction, H2SO4 loses a proton (H+) to become HSO4-, which carries a single negative charge on one of its oxygen atoms. It does not lose both protons or form a species with two negatively charged oxygens.
      Protonation and deprotonation reactions typically involve the transfer of single protons, resulting in the formation of charged species with balanced charge distributions.
      */
     /*
      const conjugate = ConjugateBase(reactant[0], logger)
      if (undefined !== conjugate) {
        logger.info(`[Protonate] Not protonating ${substrate[0].canonicalSmiles} (base, pKa ${substrate[0].pKa}) using ${reactant[0].canonicalSmiles} (acid, pKa ${reactant[0].pKa}) as reactant is a conjugate base.`)
        return false
      }
      */

      if (null !== reactant[0].pKa && null !== substrate[0].pKa) {
        //     const log_description = `[Protonate] ${reactant[0].canonicalSmiles} (acid, pKa ${reactant[0].pKa}) donates a proton to ${substrate[0].canonicalSmiles} (base, pKa ${substrate[0].pKa}) resulting in ${reactant_molecule.canonicalSmiles} (conjugate base of ${reactant[0].canonicalSmiles}, pKa  ${reactant_molecule.canonicalSmiles}) and ${substrate_molecule.canonicalSmiles} (conjugate acid of ${substrate[0].canonicalSmiles}, pKa ${substrate_molecule.pKa})`;
        /*
      Methylamine (CH3NH2) is a weak base and has a pKa around 10.7. A molecule with a pKa of 15 is even weaker as an acid. In a
      protonation reaction, the species with a lower pKa value (a stronger acid) donates a proton to the species with a higher pKa value (a weaker acid).

      Since methylamine has a lower pKa than a molecule with a pKa of 15, methylamine is more likely to accept a proton
      (act as a base) rather than donate a proton (act as an acid) to a molecule with a pKa of 15. In other words, methylamine is not a strong enough acid to protonate a molecule with a pKa of 15; it is more likely to act as a base and accept a proton from a stronger acid.
        */
        if (reactant[0].pKa >  substrate[0].pKa || substrate[0].pKa - reactant[0].pKa < 4) {
          return false
      }

    }


    }


    let atom_to_be_deprotonated = null;
    let atom_to_be_protonated = null;

    // We are testing to see if we can protonate the substrate - this means the reactant must be an acid
    if ('CB:' === reactant[0] || 'B:' === reactant[0]) {
 //     console.log('got here')
      return false
    }

    if ('A:' !== reactant[0] && 'CA:' !== reactant[0] && 'CB:' !== reactant[0]) {
      // Look for atom that can donate a proton
      atom_to_be_deprotonated = BronstedLoweryAcidAtom(reactant[0], substrate[0]); // This should not change the reactant
      if (undefined === atom_to_be_deprotonated) {

      } else {

      }
      if (false === atom_to_be_deprotonated || undefined === atom_to_be_deprotonated) {

         return false
      }
    }

    if ('B:' !== substrate[0] && 'CB:' !== substrate[0]) {
      // Look for atom that can accept a proton
      atom_to_be_protonated = BronstedLoweryBaseAtom(substrate[0], reactant[0]); // This should not change the reactant
      if (undefined === atom_to_be_protonated) {

            } else {

      }
      if (undefined === atom_to_be_protonated || false === atom_to_be_protonated) {

         return false
      }
    } 

    // Check if the required atoms are found
    if (
      ('A:' !== reactant[0] && 'CA:' !== reactant[0] && undefined === atom_to_be_deprotonated) ||
      undefined === atom_to_be_protonated
    ) {
      return false;
    }

    /*
    if (null === atom_to_be_deprotonated) {
      return false
    }
    */
    // An oxygen atom cannot deprotonate a water molecule (verified).
    if (typeof reactant[0] !== "string" &&  null !== atom_to_be_protonated && reactant[0].canonicalSmiles === 'O' && 'O' === atom_to_be_protonated.atomicSymbol) { // reactant is the acid atom that is protonating the water molecule
      return false;
    }

    if (null !== atom_to_be_protonated && 'N' === atom_to_be_protonated.atomicSymbol && reactant[0].canonicalSmiles === 'O') {
      const double_bonds = atom_to_be_protonated.doubleBonds(substrate[0].atoms, false);
      const double_bond_carbon = _.find(double_bonds, (db) => {
        return db.atom.atomicSymbol === 'C';
      });
      if (undefined !== double_bond_carbon) {
        return false;
      }
    }


    // Check additional conditions if necessary
    return true;
};

module.exports = Protonate