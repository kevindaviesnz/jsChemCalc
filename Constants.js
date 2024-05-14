const Constants = () => {
    return {
        "units":1,
        "substrate_index":0,
        "solvent_index":1,
        "reagent_index":2,
        "atom_electrons_per_shell_count_index":10,
        "electron_index":11,
        "electron_pairs_index":11,
        "valence_index":8,
        "outer_shell_max_number_of_electrons_index":12,
        "atom_electronegativity_index":6,
        "atom_size_index":7,
        "atom_index":9,
        "atom_charge_index":4,
        "atom_id_index":5,
        "atom_atomic_symbol_index":0,
        "atom_neutral_number_of_bonds_index":3,
        "atom_valence_electrons_count_index":2,
        "molecule_molecular_formula_index":2,
        "molecule_cid_index":3,
        "molecule_iupacname_index":4,
        "molecule_charge_index":5,
        "molecule_heavy_atom_count_index":6,
        "molecule_tags_index":7,
        "molecule_canonical_smiles_index":8,
        "molecule_atoms_index":9,
        "container_substrate_index":0,
        "container_solvent_index": 1,
        "container_reagent_index":2,
        "container_molecules_index":3,
        "pathway_id_segment_length":5,
        "atom_ringbond_index": 13,
        "atom_ringbond_type_index": 14,
        "max_valence_electrons":{
            "H":2,
            "O":8,
            "N":8,
            "C":8,
            "K":1
        }
    }
}

/*
    const molecule  = [
        pKa(atoms),
        1,
        molecularFormula,
        CID,
        IUPACName,
        charge,
        heavyAtomCount,
        tags,
        [...atoms]
    ]
 */
module.exports = Constants