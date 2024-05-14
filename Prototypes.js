const Constants = require("./Constants")
const Typecheck = require("./Typecheck")
const FunctionalGroups = require("./reflection/FunctionalGroups")
const _ = require('lodash');
const Set = require('./Set')
const should = require('should')
const PeriodicTable = require('./factories/PeriodicTable')
const FormatAs = require('./factories/FormatAs')
const AtomFactory = require('./factories/AtomFactory');
const { B, C, P, H } = require("./factories/PeriodicTable");
const { child } = require("winston");
const ExtractOHLeavingGroups = require("./actions/ExtractOHLeavingGroups");
const MoleculeFactory = require("./factories/MoleculeFactory")

const RemoveAtom = require("./actions/RemoveAtom");
const FindCarbocation = require("./actions/FindCarbocation");
const AddAtom = require('./actions/AddAtom')
const ExtractLeavingGroups = require('./actions/ExtractLeavingGroups')

const uniqid = require('uniqid');
const { identity } = require("lodash");
const ENV = require("./env");


const Prototypes = () => {


    
    Object.defineProperty(Array.prototype, 'isMoreAcidicThan', {
        value: function(logger, atom_molecule, target_molecule, target_atom) {

            Typecheck(
                {name: "logger", value: logger, type: "object"},
                {name: "atom_molecule", value: atom_molecule, type: "object"},
                {name: "target_molecule", value: target_molecule, type: "object"},
                {name: "target_atom", value: target_atom, type: "array"},
                
            )

            if (target_atom.atomicSymbol === 'C') {
                logger.log(
                    'info', 
                    'isMoreAcidicThan() atom '
                    + this.atomicSymbol + ' ' + this.atomId + ' '
                    +  this.charge( atom_molecule.atoms, logger) + ' '
                    + ' IS MORE acidic than target atom AS target atom is CARBON '
                    + target_atom.atomicSymbol + ' ' + target_atom.atomId + ' '
                    + target_atom.charge( target_molecule.atoms, logger)
                ) 
                return true
            }

            if (target_atom.atomicSymbol === this.atomicSymbol && target_atom.charge(target_molecule.atoms, logger) === this.charge(atom_molecule.atoms, logger)) {
                return target_molecule.pKa > atom_molecule.pKa
            } else if (atom_molecule.atoms.length < target_molecule.atoms.length 
                || this.charge( atom_molecule.atoms, logger) === 1 
                || this.electronegativity() > target_atom.electronegativity()
            ) {
                logger.log(
                    'info', 
                    'isMoreAcidicThan() atom '
                    + this.atomicSymbol + ' ' + this.atomId + ' '
                    +  this.charge( atom_molecule.atoms, logger) + ' '
                    + ' IS MORE acidic than target atom '
                    + target_atom.atomicSymbol + ' ' + target_atom.atomId + ' '
                    + target_atom.charge( target_molecule.atoms, logger)
                ) 
                return true
            } else {
                logger.log(
                    'info', 
                    'isMoreAcidicThan() atom '
                    + this.atomicSymbol + ' ' + this.atomId + ' '
                    +  this.charge( atom_molecule.atoms, logger) + ' '
                    + ' is NOT more acidic than target atom '
                    + target_atom.atomicSymbol + ' ' + target_atom.atomId + ' '
                    + target_atom.charge( target_molecule.atoms, logger)
                )         

                return false                
            }

        }
    }),

    Object.defineProperty(Array.prototype, 'isLessAcidicThan', {
        value: function(logger, atom_molecule, target_molecule, target_atom) {

            Typecheck(
                {name: "logger", value: logger, type: "object"},
                {name: "atom_molecule", value: atom_molecule, type: "object"},
                {name: "target_molecule", value: target_molecule, type: "object"},
                {name: "target_atom", value: target_atom, type: "array"},
                
            )

            if (target_atom.atomicSymbol === 'C') {
                logger.log(
                    'debug', 
                    'isLessAcidicThan() atom '
                    + this.atomicSymbol + ' ' + this.atomId + ' '
                    +  this.charge(atom_molecule.atoms) + ' '
                    + ' IS NOT LESS acidic than target atom AS target atom is CARBON '
                    + target_atom.atomicSymbol + ' ' + target_atom.atomId + ' '
                    + target_atom.charge( target_molecule.atoms, logger)
                ) 
                return false
            }

            if (atom_molecule.atoms.length < target_molecule.atoms.length 
                || this.charge( atom_molecule.atoms, logger) === -1 
                || this.electronegativity() < target_atom.electronegativity()
            ) {
                logger.log(
                    'debug', 
                    'isLessAcidicThan() atom '
                    + this.atomicSymbol + ' ' + this.atomId + ' '
                    +  this.charge( atom_molecule.atoms, logger) + ' '
                    + ' IS LESS acidic than target atom '
                    + target_atom.atomicSymbol + ' ' + target_atom.atomId + ' '
                    + target_atom.charge( target_molecule.atoms, logger)
                ) 
                return true
            } else {
                logger.log(
                    'debug', 
                    'isLessAcidicThan() atom '
                    + this.atomicSymbol + ' ' + this.atomId + ' '
                    +  this.charge(atom_molecule.atoms) + ' '
                    + ' IS NOT LESS acidic than target atom '
                    + target_atom.atomicSymbol + ' ' + target_atom.atomId + ' '
                    + target_atom.charge( target_molecule.atoms, logger)
                )  
            }
        }
    }),

    Object.defineProperty(Array.prototype, 'checkBonds_2', {
        value: function(mechanism, logger) {
           
            try {


                Typecheck(
                    {name: "mechanism", value: mechanism, type: "string"},
                    {name: "logger", value: logger, type: "object"},
                )


                const atoms = this

                if (atoms.length === 0) {
                    throw new Error('There should be at least one atom ' + mechanism)
                }

                if (_.cloneDeep(atoms).filter((a)=>{
                    return 'H' !== a.atomicSymbol
                }).length > 1) {
                    // Check atoms for broken bonds
                    // For each atom check if the atom has at least one bond
                    for(i in atoms) {
                        const atom_bonds = atoms[i].bonds(atoms, false)
                        const atom_bonds_length = atoms[i].singleBonds(atoms).length + (atoms[i].doubleBonds(atoms).length *2)+ (atoms[i].tripleBonds(atoms).length*3)
                        // Atom with no bond found
                        if (atom_bonds.length===0) {
                            atoms.map((a)=>{
                                if ('H' !==a.atomicSymbol) {
                                    console.log(a)
                                }
                            })
                           // console.log('Atom with no bonds:')
                            //console.log(atoms[i])
                            //throw new Error('Found atom with no bonds ' + mechanism)
                            return false
                        } else {
                            
                            // If atom is a carbon check that it has at least three bonds and not more than four bonds
                            const hydrogens = atoms[i].hydrogens(atoms)
                            const b = (atom_bonds_length + hydrogens.length)
                            if ('C' === atoms[i].atomicSymbol && (b < 3) ||  b > 4) {
                                throw new Error('Found carbon with less than three bonds or more than four bonds.')
                            }
                            // If atom is carbon check that it doesn't have any lone pairs
                            if ('C'=== atoms[i].atomicSymbol) {
                                const lone_pairs = atoms[i].electronPairs.filter((p)=>{
                                    return undefined === p[1]
                                })
                                if (lone_pairs.length > 0) {
                                    //throw new Error('Found carbon with lone pairs')
                                    return false
                                }
                            }
                            // If atom is a carbocation, check that is not bonded to an atom with a positive charge
                            // Note: Hydrogens have been filtered out.                            
                            
                                if (atoms[i].isCarbocation(atoms,logger)) {
                                    const atom_with_positive_charge = _.find(atom_bonds, (bond)=>{
                                        return bond.atom.charge( atoms, logger) === 1
                                    })
                                    if (undefined !== atom_with_positive_charge) {
                                        //console.log('atom')
                                        //console.log(atoms[i])
                                        //console.log(atom_with_positive_charge)
                                        //throw new Error('Carbocation found that is bonded to an atom with a positive charge ' + mechanism)
                                        return false
                                    }
                                }
                            
                        }
                    }
                }


            } catch(e) {
                logger.log('error', ('[Prototypes:checkBonds] ' + e.stack).bgRed)
                console.log(e.stack)
                process.exit()
            }

        }

    }),

    Object.defineProperty(Array.prototype, 'calculatedNumberOfHydrogens', {
        value: function(mechanism) {

            const atoms = this
            
            const number_of_hydrogens_there_should_be = _.cloneDeep(atoms).reduce((carry, a)=>{
                if ('H'!==a.atomicSymbol) {
                    // Get the number of electrons for the current atom that are hydrogen bonds
                    // by checking if the first character of the identifier is H.
                    const hyrogen_electrons = a.electronPairs.filter((ep)=>{
                        if(1 === ep.length) {
                            return false
                        }
                        const e_parts = ep[1].split('.')
                        return 'H' === e_parts[0]
                    })
                    return carry + hyrogen_electrons.length
                }
                return carry
            },0)

          //  console.log(mechanism + ' number of hydrogens there should be ' + number_of_hydrogens_there_should_be)
            return number_of_hydrogens_there_should_be

        }

    }),

    Object.defineProperty(Array.prototype, 'actualNumberOfHydrogens', {
        value: function(mechanism) {

            const atoms = this

            const actual_number_of_hydrogens = atoms.filter((a)=>{
                return 'H' == a.atomicSymbol
            }).length

        //    console.log(mechanism + ' actual number of hydrogens ' + actual_number_of_hydrogens)

            return actual_number_of_hydrogens

        }

    }),

    Object.defineProperty(Array.prototype, 'checkHydrogens', {
        value: function(mechanism, logger) {

            try {

                throw new Error('Method obsolete')
                Typecheck(
                    {name: "mechanism", value: mechanism, type: "string"},
                    {name: "logger", value: logger, type: "object"},
                )

                console.log('checkHydrogens mechanism '+mechanism)

                const atoms = this

                const actual_number_of_hydrogens = atoms.filter((a)=>{
                    return 'H' == a.atomicSymbol
                }).length
    
            //    console.log(atoms)
            //    console.log(atoms.length)
            const number_of_hydrogens_there_should_be = _.cloneDeep(atoms).reduce((carry, a)=>{
                if ('H'!==a.atomicSymbol) {
                    // Get the number of electrons for the current atom that are hydrogen bonds
                    // by checking if the first character of the identifier is H.
                    const hyrogen_electrons = a.electronPairs.filter((e)=>{
                        return 'H' === e[0].charAt(0) || (undefined !== e[1] && 'H' === e[1].charAt(0) )
                    })
                    return carry + hyrogen_electrons.length
                }
                return carry
            },0)

                console.log(number_of_hydrogens_there_should_be + ' but got ' + actual_number_of_hydrogens)
               // console.log(atoms.length)
               // console.log(atoms)
                if (actual_number_of_hydrogens !== number_of_hydrogens_there_should_be) {
                    console.log('===========================================================')
                    atoms.map((a)=>{
                        console.log(a)
                        return a
                    })
                    console.log('checkHydrogens')
                    console.log('Mechanism:'+mechanism)
                    console.log('REturning false. Incorrect number of hydrogens. Should be ' + number_of_hydrogens_there_should_be + ' but got ' + actual_number_of_hydrogens)
                    //process.exit()
                   // return false
                    throw new Error('Incorrect number of hydrogens. Should be ' + number_of_hydrogens_there_should_be + ' but got ' + actual_number_of_hydrogens)
                }
                return true
    
            } catch(e) {
                logger.log('error', ('[Prototypes:checkHyrogens] ' + e.stack).bgRed)
                console.log(e.stack)
                process.exit()
            }

        }
    }),

    Object.defineProperty(Array.prototype, 'isMoreBaseThan', {
        value: function(logger, atom_molecule, target_molecule, target_atom) {

            Typecheck(
                {name: "logger", value: logger, type: "object"},
                {name: "atom_molecule", value: atom_molecule, type: "object"},
                {name: "target_molecule", value: target_molecule, type: "object"},
                {name: "target_atom", value: target_atom, type: "array"},
                
            )

            logger.log('debug', 'isMoreBaseThan()')

            return this.isLessAcidicThan(logger, atom_molecule, target_molecule, target_atom)
        }
    }),

    Object.defineProperty(Array.prototype, 'isLessBaseThan', {
        value: function(logger, atom_molecule, target_molecule, target_atom) {


            Typecheck(
                {name: "logger", value: logger, type: "object"},
                {name: "atom_molecule", value: atom_molecule, type: "object"},
                {name: "target_molecule", value: target_molecule, type: "array"},
                {name: "target_atom", value: target_atom, type: "array"},
                
            )

            logger.log('info', 'isLessBaseThan()')

            return this.isMoreAcidicThan(logger, atom_molecule, target_molecule, target_atom)
        }
    }),

    Object.defineProperty(Array.prototype, 'atomsNoHydrogens', {
        value: function() {

            const atoms = this

            return atoms.filter((atom)=>{
                return atom.atomicSymbol !== 'H'
            })
        }

    }),

    Object.defineProperty(Array.prototype, 'hasHalide', {
        value: function() {

            const molecule = this
            return undefined !== _.find(molecule.atoms, (atom)=>{
                return atom.isHalide()
            })
        }

    }),

        Object.defineProperty(Array.prototype, 'hasOxygen', {
            value: function() {

                const molecule = this
                return undefined !== _.find(molecule.atoms, (atom)=>{
                    return atom.atomicSymbol === 'O'
                })
            }

        }),

        Object.defineProperty(Array.prototype, 'hasAtomWithPositiveCharge', {
            value: function(logger) {

                const molecule = this
                return undefined !== _.find(molecule.atoms, (atom)=>{
                    return atom.charge( molecule.atoms, logger) === 1
                })
            }

        }),

        /**
     * Checks if an positive charged atom is bonded to another positively charged atom
     */
    Object.defineProperty(Array.prototype, 'illegalPositiveDoubleBond', {
        value: function(molecule, logger) {

            try {

                Typecheck(
                    {name: "molecule", value: molecule, type: "object"},
                    {name: "logger", value: logger, type: "object"},
                )

                const atom = this

                if (typeof molecule[0] !== number) {
                    throw new Error('First item in molecule should be a number.')
                }

                if (atom.charge(atoms) === 1) {
                    return _.findIndex(atom.bonds(atoms), (bond)=>{
                        return bond.atom.charge( molecule.atoms, logger) === 1
                    })!== -1
                }
    
                return false

            } catch(e) {

            }


        }

    }),



        Object.defineProperty(Array.prototype, 'electronPairs', {
        value: function() {

            const atom = this

            return atom[Constants().electron_index].filter((pair)=>{
                return pair.length > 1
            })
        }

    }),


        Object.defineProperty(Array.prototype, 'replaceAtomByAtomId', {
        value: function(replacement_atom) {

            Typecheck(
                {name: "replacement atom", value: replacement_atom, type: "array"},
            )

            const atoms = this
            return atoms.map((atom)=>{
                if (atom.atomId === replacement_atom.atomId) {
                    atom = replacement_atom
                }
                return atom
            })
        }
    }),

        Object.defineProperty(Array.prototype, 'carbocationStability', {
        value: function(molecule) {

            Typecheck(
                {name: "atoms", value: molecule.atoms, type: "array"},
            )

            const carbocation = this

            try {
                if (carbocation.atomicSymbol !== 'C' || carbocation.isCarbocation(molecule.atoms, logger) === false) {
                    throw new Error('Carbocation is not a carbocation')
                }
            } catch(e) {
                console.log(carbocation)
                console.log(e)
            }

            let carbocation_stability = 0
            // 4 -> 3 -> 2 -> 1
            carbocation_stability += carbocation.bonds().length + 1 + (molecule.isBenzylic() || molecule.isAlylic()?1:0)

            return carbocation_stability

        }
    }),

        Object.defineProperty(Array.prototype, 'isBenzylic', {
            value: function(molecule) {

                Typecheck(
                    {name: "atoms", value: molecule.atoms, type: "array"},
                )

                // @todo
                return false



            }
        }),

        Object.defineProperty(Array.prototype, 'isAlylic', {
            value: function(molecule) {

                Typecheck(
                    {name: "atoms", value: molecule.atoms, type: "array"},
                )

                // @todo
                return false



            }
        }),

        Object.defineProperty(Array.prototype, 'nucleophilicity', {
        value: function() {



            const nucleophile_atom = this

            try {
                if (nucleophile_atom.freeElectrons() < 2) {
                    throw new Error('Nucleophile must have at least one pair of free electrons.')
                }
            } catch(e) {
                console.log(nucleophile_atom)
                console.log(e)
            }

            // @todo
            let nucleophile_atom_strength = 0

            return nucleophile_atom_strength

        }
    }),







        Object.defineProperty(Array.prototype, 'removeBondFromCarbon', {
            value: function(molecule, logger) {

                Typecheck(
                    {name: "molecule", value: molecule, type: "object"},
                    {name: "logger", value: logger, type: "object"}
                )

                try {
                    if (this.atomicSymbol !== 'C') {
                        throw new Error('Atom should be a carbon atom.')
                    }
                } catch(e) {
                    console.log(e)
                    process.exit()
                }

                const atoms = molecule.atoms
                const atom = this

                // Get bonds and sort by type, then O -> N -> C
                
                const bonds = _.sortBy(atom.bonds(atoms), ((bond)=>{
                    return bond.bond_type
                })).reverse().sort((b1,b2)=>{
                    if (b1.atom.atomicSymbol === 'O') {
                        return 1
                    }
                    if (b1.atom.atomicSymbol === 'N') {
                        return 1
                    }
                    if (b1.atom.atomicSymbol !== 'C') {
                        return 1
                    }
                })
             
               // 'this' is the atom that will keep the electrons.
               // Break bond by "collapsing" electron pair onto "atom"
                // After breaking the bond the "this" should have an additional charge and
                //  "atom" should have one less charge.
                molecule.atoms = bonds[0].atom.breakBond(atom, molecule, logger)
                _.remove(atom.electronPairs, (ep)=>{
                    return ep.length === 1
                })



                try {
                    if (false ===atom.isCarbocation(molecule.atoms, logger)) {
                        throw new Error('Prototypes.remoFromCarbon() Failed to create a carbocation')
                    }
                } catch(e) {
                    logger.log('error', e.stack)
                    console.log(e.stack)
                    process.exit()
                }

            }
        }),

        Object.defineProperty(Array.prototype, 'bondCountAsSingleBonds', {
            value: function(atoms, no_hydrogens, logger) {

                Typecheck(
                    {name: "atoms", value: atoms, type: "array"},
                    {name: "logger", value: logger, type: "object"},
                )

                const atom = this

                return bond_count = (atom.tripleBonds(atoms,no_hydrogens).length*3) + (atom.doubleBonds(atoms,no_hydrogens).length*2) + (atom.singleBonds(atoms,no_hydrogens).length)

            }
        }),

        Object.defineProperty(Array.prototype, 'isCarbocation', {
            value: function(atoms, logger) {

                try {

                    Typecheck(
                        {name: "atoms", value: atoms, type: "array"},
                        {name: "logger", value: logger, type: "object"}
                    )
    
                    const atom = this
    
                    // @todo bondCountAsSingleBonds() does not count hydrogens
                    const bond_count = atom.bondCountAsSingleBonds(atoms, true, logger) + atom.hydrogens(atoms).length
    
                   // console.log('isCarbocation()')
                   // console.log('bond count')
                    // console.log(bond_count)
    
                    return atom.atomicSymbol === 'C' && bond_count === 3 && atom.charge(atoms, logger) === 1
    

                } catch(e) {
                    logger.log('error', 'Prototypes.isCarbocation() ' + e)
                }


            }
        }),


        Object.defineProperty(Array.prototype, 'atomShift', {
            value: function(molecule, source_atom, carbocation, atoms, allow_hydrogens, logger) {

                try {

                    // 'this' is the atom to be shifted
                    // Source atom is the atom that 'this' is bonded to.
                    // Target atom is where we will be shifting the atom to.
                    Typecheck(
                        {name: "molecule", value: molecule, type: "object"},
                        {name: "source_atom", value: source_atom, type: "array"},
                        {name: "carbocation", value: carbocation, type: "array"},
                        {name: "allow_hydrogens", value: allow_hydrogens, type: "bool"},
                        {name: "logger", value: logger, type: "object"}
                    )

                    const atom_to_be_moved = this

                    atom_to_be_moved.atomicSymbol.should.be.a.String()
                    source_atom.atomicSymbol.should.be.equal('C')
                    carbocation.atomicSymbol.should.be.a.String()

                    atom_to_be_moved.atomicSymbol.should.be.a.String()

                    // Check atom to be shifted is bonded to the source atom
                    atom_to_be_moved.isSingleBondedTo(source_atom).should.be.True()
                    // Check source atom is bonded to the carbocation
                    source_atom.isSingleBondedTo(carbocation).should.be.True()

                    // Shift 'this' from source atom to target atom
                    // If are we moving an hydrogen check it has an electron pair
                    if (atom_to_be_moved.atomicSymbol === 'H') {
                        atom_to_be_moved[Constants().electron_index].length.should.be.equal(1)
                        atom_to_be_moved[Constants().electron_index][0].length.should.be.equal(2)
                    }

                    // target_atom, molecule,logger
                    //console.log('source atom')
                    //console.log(source_atom)
                    //console.log('atom to be moved')
                    //console.log(atom_to_be_moved)
                    // Remove shared pair from source atom to turn it into a carbocation
                    const source_atom_shared_electron_pairs = source_atom.sharedElectronPairs(atom_to_be_moved)
                    // console.log(source_atom_shared_electron_pairs)
                    source_atom.electronPairs = _.remove(source_atom.electronPairs , (p)=>{
                        return !_.isEqual(p, source_atom_shared_electron_pairs[0])
                    })
                    // Turn the atom to be moved matching electron pair into single electrons
                    atom_to_be_moved.electronPairs = _.remove( atom_to_be_moved.electronPairs, (p)=>{
                        return !_.isEqual(p, source_atom_shared_electron_pairs[0].reverse())
                    })
                    atom_to_be_moved.electronPairs.push([source_atom_shared_electron_pairs[0][0]])
                    atom_to_be_moved.electronPairs.push([source_atom_shared_electron_pairs[0][1]])

                    //  molecule.atoms = source_atom.breakSingleBond(atom_to_be_moved, molecule, logger)
                    // console.log('source atom')
                    //console.log(source_atom)
                    //console.log('atom to be moved')
                    //console.log(atom_to_be_moved)
                    //
                    // console.log(source_atom.isCarbocation(atoms, logger))

                    //  throw new Error('tsts')




                    atom_to_be_moved.isSingleBondedTo(source_atom).should.be.False()
                    source_atom.isSingleBondedTo(atom_to_be_moved).should.be.False()

                    atom_to_be_moved.sharedElectronPairs(source_atom).length.should.be.equal(0)
                    source_atom.sharedElectronPairs(atom_to_be_moved).length.should.be.equal(0)

                    if (atom_to_be_moved.atomicSymbol === 'H') {
                        atom_to_be_moved[Constants().electron_index].length.should.be.equal(2)
                    }

                    atoms.getAtomByAtomId(source_atom.atomId)[Constants().electron_index] = source_atom[Constants().electron_index]
                    atoms.getAtomByAtomId(atom_to_be_moved.atomId)[Constants().electron_index] = atom_to_be_moved[Constants().electron_index]

                    //  console.log('atom to be moved shared electrons')
                    //  console.log(atom_to_be_moved.sharedElectronPairs(source_atom))
                    // console.log('source atom shared electrons')

                    // molecule = carbocation.bondAtomToAtom(atom_to_be_moved, allow_hydrogens, atoms, logger)
                    molecule.atoms = atom_to_be_moved.bondAtomToAtom(carbocation, allow_hydrogens, atoms, logger)
                    return molecule

                } catch(e) {
                    console.log(e.stack)
                    logger.log('error', 'Prototypes.atomShift() '+e)
                    process.exit()
                }

            }
        }),
        Object.defineProperty(Array.prototype, 'isBondedTo', {
            value: function(child_atom, atoms) {
                Typecheck(
                    {name: "child_atom", value: child_atom, type: "array"},
                    {name: "source atom", value: this.atomicSymbol, type: "string"}
                )
                return this.isSingleBondedTo(child_atom, atoms) ||
                this.isDoubleBondedTo(child_atom) ||
                this.isTripleBondedTo(child_atom) ||
                this.isIonicBondedTo(child_atom) ||
                child_atom.isIonicBondedTo(this)
            }
        }),


        Object.defineProperty(Array.prototype, 'singleBonds', {
            value: function(atoms) {
                // 'this' is an atom
                return this.bonds(atoms).filter((bond)=>{
                    return bond.bond_type === ''
                }, [])
            }
        }),
        Object.defineProperty(Array.prototype, 'doubleBonds', {
            value: function(atoms) {
                // 'this' is an atom
                const atom = this
                const bonds = atom.bonds(atoms)
                return bonds.filter((bond)=>{
                    return bond.bond_type === '='
                }, [])
            }
        }),
        Object.defineProperty(Array.prototype, 'tripleBonds', {
            value: function(atoms) {
                // 'this' is an atom
                return this.bonds(atoms).filter((bond)=>{
                    return bond.bond_type === '#'
                }, [])
            }
        }),
        Object.defineProperty(Array.prototype, 'ionicBonds', {
            value: function(atoms) {
                // 'this' is an atom
                const ionic_bonds = []
                const ionic_electrons = this.electrons().filter((electron)=>{
                    return electron.split('.')[0] === 'ionic'
                })
                if (ionic_electrons.length > 0) {
                    // const child_atom = atoms.getAtomByAtomId(ionic_electrons[0].split('.')[2])
                    /*
                    const atom =_.find(this, (_atom)=>{
                    return _atom[Constants().atom_id_index] === atom_id
                })*/
                    const atom_id = ionic_electrons[0].split('.')[2]
                    const child_atom = _.find(atoms, (_atom)=>{
                        return _atom.atomId === atom_id
                    })
                    if (null !== child_atom) {
                        ionic_bonds.push({
                            'parent': this,
                            'atom':  child_atom,
                            'atom_index': -1,
                            'bond_type': "ionic",
                        })
    
                    }
                }
                
                const ionic_bonds_to_parent = this.bonds(atoms).filter((bond)=>{
                    return bond.bond_type === 'ionic'
                }, [])

              //  console.log(this)
              //  console.log('ionicBonds() to parent:')
              //  console.log(ionic_bonds_to_parent)

                return ([...ionic_bonds, ...ionic_bonds_to_parent])
            }
        }),

    Object.defineProperty(Array.prototype, 'removeProton_remove', {
        value: function (molecule, logger, return_molecule) {

            try {

                Typecheck(
                    {name: "molecule", value: molecule, type: "object"},
                    {name: "logger", value: logger, type: "object"},
                )

                const atom = this

                if (atom.atomicSymbol === 'C') {
                    //console.log(atom.removeProtonOnCarbon(molecule, logger))
                    return atom.removeProtonOnCarbon(molecule, logger, return_molecule)
                } else {

                    const atoms = molecule.atoms
                    let proton = atom.hydrogens(atoms)[0]
                    if (undefined !== proton) {
                        
                      //  atom.checkElectrons(molecule, logger)

                        proton.atomicSymbol.should.be.equal('H')
                        const shared_electron_pairs = atom.sharedElectronPairs(proton)

                        // Remove the electron pair from the atom
                        atom[Constants().electron_index] = _.filter(atom[Constants().electron_index], (electron_pair)=>{
                            const electron_pair_reversed = _.cloneDeep(electron_pair)
                            electron_pair_reversed.reverse()
                            return _.isEqual(shared_electron_pairs[0],electron_pair) === false
                                && _.isEqual(shared_electron_pairs[0], electron_pair_reversed) === false
                        })

                        // "Re-add' the electrons
                        atom[Constants().electron_index].push(
                            [atom.atomicSymbol + '.' + atom.atomId + '.100']
                        )
                        atom[Constants().electron_index].push(
                            [atom.atomicSymbol + '.' + proton.atomId + '.200']
                        )

                        const i = _.findIndex(atoms, (a) => {
                            return a.atomId == atom.atomId
                        })
                        atoms[i][Constants().electron_index].map((ep) => {
                            if (_.isEqual(ep, shared_electron_pairs[0])) {
                                ep.pop()
                            }
                            return ep
                        })
                        if (return_molecule === false) {
                            molecule.atoms = RemoveAtom(molecule, proton, logger, false)
                        } else {
                            molecule = RemoveAtom(molecule, proton, logger)
                        }
                        proton[Constants().electron_index] = []
                    } else if (undefined !== logger) {

                        return false
                    }
                }

             //   atom.checkElectrons(molecule, logger)

                return return_molecule === false? molecule.atoms:molecule

            } catch(e) {
                console.log(e.stack)
                logger.log('error', 'Prototypes.removeProton() ' + e.stack)
                process.exit()
            }

        }

    })
    Object.defineProperty(Array.prototype, 'removeProtonOnCarbon', {
        value: function (molecule, logger, return_molecule) {
            const atom = this
            try {
                Typecheck(
                    {name: "molecule", value: molecule, type: "object"}
                )
                if (undefined === atom) {
                    throw new Error('Atom is undefined')
                }
                const atoms = molecule.atoms
                let proton = atom.hydrogens(atoms)[0]
                if (undefined !== proton) {
                    proton.atomicSymbol.should.be.equal('H')
                    molecule.atoms = proton.breakSingleBond(atom, molecule, logger)
                    molecule.atoms = RemoveAtom(molecule,proton,logger, false)
                    // Remove single electrons from carbon atom
                    _.remove(atom.electronPairs, (electron_pair)=>{
                        if (electron_pair[1] !== undefined) {
                            return false
                        }
                        return true
                    })                                        
                } else if(undefined !== logger){
                    return false
                }

                return return_molecule === false?molecule.atoms:MoleculeFactory(
                    molecule.atoms,
                    molecule.conjugateBase,
                    molecule.conjugateAcid,
                    logger
                )
                
            } catch(e) {
                console.log(e)
                process.exit()
            }
        }

    })
    Object.defineProperty(Array.prototype, 'addProton', {
        value: function (molecule, logger) {

            try {
                const atom = this
                Typecheck(
                    {name: "molecule", value: molecule, type: "object"},
                    {name: "logger", value: logger, type: "object"}
                )
                const proton = AtomFactory('H', 1, 0, uniqid().substr(uniqid().length-3,3), uniqid().substr(uniqid().length-3,3),logger)
                proton[Constants().electron_index] = []
                molecule.atoms = atom.bondAtomToAtom(proton, true, molecule.atoms,logger)
                molecule.atoms = AddAtom(molecule, proton, logger)

                return MoleculeFactory (
                    molecule.atoms,
                    false,
                    false,
                    logger
                )
    
            } catch(e) {

                console.log(e.stack)
                logger.log('error', 'Prototypes.addProton() '+e)
                process.exit()

            }
        }
    })
    Object.defineProperty(Array.prototype, 'isMolecule', {
        value: function (logger) {
            try {

                Typecheck(
                    {name: "logger", value: logger, type: "object"}
                )

                if (this[0] === null) {
                    return true
                }
                if (this.length === 0) {
                    throw new Error('Molecule is an empty array.')
                }
                if (typeof this[0] !== 'number' ) {
                    throw new Error('First item in molecule should be a number')
                }
                if (typeof this[0][0] === 'String') {
                    throw new Error('First item in molecule is an atom')
                }
                const atoms = this.atoms
                if (undefined === atoms || false === atoms || atoms.length === 0 )  {
                    throw new Error('No atoms found')
                }
                return true
            } catch(e) {
                console.log(e.stack)
                logger.log('error', 'Prototypes.isMolecule() '+e)
                process.exit()
            }

        }
    })
    Object.defineProperty(Array.prototype, 'extractHydrogens', {
        value: function (child_atom, leaving_group) {
            // 'this' is array of atoms
            try {
                return this.map((maybe_hydrogen_atom)=>{
                    if (maybe_hydrogen_atom.atomicSymbol==='H' && maybe_hydrogen_atom.isSingleBondedTo(child_atom)) {
                        leaving_group.push(maybe_hydrogen_atom)
                        maybe_hydrogen_atom = null
                    }
                    return maybe_hydrogen_atom
                }).filter((atom)=>{
                    return atom !==null
                })
            } catch(e) {
                console.log('Prototype.extractHydrogens() ' + e) 
                console.log(e.stack)
                process.exit()
            }
        }
    })


        Object.defineProperty(Array.prototype, 'getAtomByAtomId', {
            value: function(atom_id) {
                Typecheck(
                    {name:"atom_id", value:atom_id, type:"string"},
                )
                // 'this' is an array of atoms
                const atom =_.find(this, (_atom)=>{
                    return _atom[Constants().atom_id_index] === atom_id
                })

                if (undefined === atom) {
                    console.log('Atoms')
                    console.log(this)
                    console.log('Atom id')
                    console.log(atom_id)
                    throw new Error('Unable to find atom')
                }
                return atom
            }
        }),
        Object.defineProperty(Array.prototype, 'isAlkane', {
            value: function () {
                // "this" is molecule
                return this.atoms.filter((atom)=>{
                    return atom[Constants().atom_atomic_symbol_index !== 'H']
                }).filter((_atom)=>{
                    return atom[Constants().atom_atomic_symbol_index !== 'C'] || atom.doubleBonds().length > 0 || atom.tripleBonds().length > 0
                }).length === 0
            }
        })
        Object.defineProperty(Array.prototype, 'isAlkene', {
            value: function () {
                // "this" is molecule
                return this.atoms.filter((atom)=>{
                    return atom[Constants().atom_atomic_symbol_index !== 'H']
                }).filter((_atom)=>{
                    return atom[Constants().atom_atomic_symbol_index !== 'C'] || atom.singleBonds().length > 0 || atom.tripleBonds().length > 0
                }).length === 0
            }
        })        
    Object.defineProperty(Array.prototype, 'isMetal', {
        value: function () {

            // "this" is an atom
            Typecheck(
                {name: "atom", value: this, type: "array"},
            )

            const atom = PeriodicTable[this.atomicSymbol]
            return atom.subcategory === 'alkali metal'
        }
    })
    Object.defineProperty(Array.prototype, 'moleculeCarbons', {
        value: function () {

            // "this" is a molecule
            Typecheck(
                {name: "molecule", value: this, type: "array"},
            )

            const atoms = this.atoms


            // Check for non carbons
            return atoms.carbons()
        }
    })
    Object.defineProperty(Array.prototype, 'isProtic', {
        value: function () {

            // "this" is a solvent
            Typecheck(
                {name: "solvent", value: this, type: "array"},
            )

            const atoms = this.atoms.filter((atom)=>{
                return atom.atomicSymbol !== 'H' && (atom.atomicSymbol==='O' || atom.atomicSymbol==='N')
            })

            // SN1 reactions use protic solvents. Protic solvents are those that contain O-H or N-H bonds such as water and alcohols.

            return atoms.length > 0

        }

    })
    Object.defineProperty(Array.prototype, 'isAProtic', {
        value: function () {

            return this.isProtic() === false

        }

    })
    Object.defineProperty(Array.prototype, 'carbons', {
        value: function (atoms) {

            if (typeof this[0] === 'string') {
                Typecheck(
                    {name: "atoms", value: atoms, type: "array"},
                )
                return this.bonds(atoms).filter((bond)=>{
                    return bond.atom.atomicSymbol === 'C'
                }).map((bond)=>{
                  return bond.atom
                })
            } else {
                // Check for carbons
                return this.filter((atom) => {
                    return atom[Constants().atomicSymbol] === "C"
                })
            }

        }
    })
    Object.defineProperty(Array.prototype, 'moleculeNonCarbons', {
        value: function () {

            // "this" is a molecule
            Typecheck(
                {name: "molecule", value: this, type: "array"},
            )

            const atoms = molecule.atoms


            // Check for non carbons
            return non_carbons_ = atoms.nonCarbons()
        }
    })
    Object.defineProperty(Array.prototype, 'nonCarbons', {
        value: function () {

            // "this" is an array of atoms
            Typecheck(
                {name: "atoms", value: this, type: "array"},
            )

            // Check for non carbons
            return this.filter((atom) => {
                return atom.atomicSymbol !== "C" && atom.atomicSymbol !== "H"
            })

        }
    })


    Object.defineProperty(Array.prototype, 'carbonBonds', {
        value: function (atoms) {

            // "this" is an atom
            const atom = this

            Typecheck(
                {name: "atoms", value: atoms, type: "array"}
            )

            try {
                if (atoms === undefined || atoms === null) {
                    throw new Error("Atoms are  undefined or null")
                }
            } catch(e) {
                console.log(e)
                process.exit()
            }

            try {
                if (typeof this[0] !== 'string') {
                    throw new Error('Atomic symbol should be a string')
                }
            } catch(e) {
                console.log('Atom:')
                console.log(atom)
                console.log(e)
                process.exit()
            }

            const bonds = atom.bonds(atoms, true)

            return bonds.filter((bond) => {
                return 'C' === bond.atom.atomicSymbol
            })
        }
    })
    Object.defineProperty(Array.prototype, 'bondCount', {
        value: function () {
            /*
            An atom has an array of electron "pairs." Each electron pair has either one or two electrons.
            If there are two electrons then this indicates a bond. If there only one electron then
            the electron "pair" has not formed a bond. To form a bond we take the electron from an electron
            pair that has one electron and add it to the electron pair from the other atom where that atom's electron pair
            has just one electron. We then do the same in reverse so that the atoms are sharing two electrons, one from
            each atom.
             */
            // "this" is an atom
            this[0].should.be.a.String()
            /*
            console.log(this[0])
            console.log("Electron pairs:")
            console.log(this.electronPairs)
            console.log(this.electronPairs.filter((electron_pair) => {
                return electron_pair.length === 2 || electron_pair.length === 3 // take into account polar bonds
            }).length)
           // progress.error()
             */
            return this.electronPairs.filter((electron_pair) => {
                return electron_pair.length === 2 || electron_pair.length === 3 // take into account polar bonds
            }).length
        }
    })
    Object.defineProperty(Array.prototype, 'bondCountNoHydrogens', {
        value: function (atoms) {
            Typecheck(
                {name: "atoms", value: atoms, type: "array"},
            )
            this[0].should.be.a.String()
            return this.bonds(atoms).filter((bond)=>{
                return bond.atom.atomicSymbol !== 'H'
            }).length
        }
    })
    Object.defineProperty(Array.prototype, 'terminalAtoms', {
        value: function () {
            // 'this' is an array of atoms
            // We also need to include atoms that mark start of a ring
            return this.filter((atom)=>{
                if (atom.bondCountNoHydrogens(this) < 2) {
                    return true
                }
            })
        }
    })
    Object.defineProperty(Array.prototype, 'isTerminalAtom', {
        value: function (atoms) {
            // 'this' is an atom
            Typecheck(
                {name: "atom", value: this, type: "array"},
            )
            try{
                if (this.bondCountNoHydrogens(atoms) > 1) {
                    throw new Error('Atom is not a terminal atom')
                }
            } catch(e) {
                /*
                console.log(e)
                console.log('Debug:')
                console.log('Atom')
                console.log(this)
                console.log(this.bondCountNoHydrogens(atoms))
                console.log(this.bonds(atoms).length)
                */
            }
            return this.bondCountNoHydrogens(atoms) === 1 || this.bonds(atoms).length === 0
        }
    })
    Object.defineProperty(Array.prototype, 'freeElectrons', {
        value: function () {

            if (undefined === this.electronPairs) {
                console.log(this)
                throw new Error('Failed to initialize electrons')
            }

           // this.atomicSymbol.should.be.a.String()
           // this.electronPairs.should.be.an.Array()
            // @see https://www.reference.com/science/many-bonds-can-chlorine-form-fe330350b9c8d6d


            let free_electrons = this.electronPairs.filter((electron_pair) => {
                return electron_pair.length === 1
            })

            // @todo Mercury
            if ('Hg' === this.atomicSymbol && free_electrons.length === 0) {
                // Add two more electron to mercury (these are electrons from it's 5th shell)
                const atom_id= this.atomId
                const e1 = 'Hg.'+atom_id+'.'+111
                const e2 = 'Hg.'+atom_id+'.'+ 222
                this.electronPairs.push([e1])
                this.electronPairs.push([e2])
                free_electrons.push([e1])
                free_electrons.push([e2])
            } else {

                if(this.atomicSymbol ==='Cl') {
                    if (this.bondCount === 1) {
                        free_electrons = []
                    } else {
                        free_electrons = [[free_electrons[0][0]], [free_electrons[1][0]]]
                    }
                }
            }

            return free_electrons

        }
    })
    Object.defineProperty(Array.prototype, 'freeSlots', {
        value: function () {
            Typecheck(
                {name: "atom", value: this, type: "array"},
            )
            const electron_count = this.electronCount()
            const outer_shell_max_number_of_electrons = this[Constants().outer_shell_max_number_of_electrons_index] // 8 for C, N, etc
            const free_slots_count = (outer_shell_max_number_of_electrons - electron_count) / 2
            return free_slots_count
        }
    })
    Object.defineProperty(Array.prototype, 'makeCovalentBond', {
        value: function (molecule, sibling_atom, logger) {

            try {

                // item.makeCovalentBond(null, previous_atom, logger)
                /*
                Here we form a covalent bond using one electron from each atom
                */
                Typecheck(
                    {name: "molecule", value: molecule, type: "object"},
                    {name: "sibling_atom", value: sibling_atom, type: "array"},
                    {name: "logger", value: logger, type: "object"}
                )

                // Note: molecule can be null
                if (null === sibling_atom) {
                    throw new Error('Sibling atom should not be null')
                }
                
                let base_atom = this

                const base_atom_free_electrons = base_atom.freeElectrons()
                const sibling_atom_free_electrons = sibling_atom.freeElectrons()
                const base_atom_free_slots = base_atom.freeSlots()
                const sibling_atom_free_slots = sibling_atom.freeSlots()

                // Check if we can form a covalent bond using an electron from each atom.
                // If we can't then form covalent bond by pushing an electron pair from
                // one atom to the other atom.


                if (sibling_atom_free_electrons.length === 0) {

                    throw new Error("Unable to make covalent bond as sibling atom " + sibling_atom.atomicSymbol + " does not enough free electrons to push. Are we attempting to add a fifth bond to a carbon?")

                    if (sibling_atom_free_slots.length === 0 || base_atom_free_electrons.length < 2) {
                        throw new Error("Unable to make covalent bond as base atom does not enough free electrons to push.")
                    }
                    // Here we push an electron pair from the base atom ("this"/atom_1) to the target atom (sibling_atom).
                    //molecule = base_atom.bondAtomToAtom(molecule, sibling_atom, false, molecule.atoms, logger)
                    //base_atom.isBondedTo(sibling_atom).should.be.true("Failed to bond base atom to target atom (makeCovalentBond()->bondAtomToAtom())")
                } else if(base_atom_free_electrons.length === 0) {
                    if (base_atom_free_slots.length === 0 || sibling_atom_free_electrons.length < 2) {
                        throw new Error("Unable to make covalent bond as base atom does not enough free electrons to push.")
                    }
                    // Here we push an electron pair from the base atom (sibling_atom) to the target atom ("this"/atom_1).
                    //molecule = sibling_atom.bondAtomToAtom(molecule, this, false, logger)
                    //sibling_atom.isBondedTo(this).should.be.true("Failed to bond sibling atom to base atom (makeCovalentBond()->bondAtomToAtom())")
                } 

                //sibling_atom_free_electrons = sibling_atom.freeElectrons()


                // We can form a covalent bond.
                    const base_atom_free_electron = base_atom.freeElectrons()[0][0]

                    const sibling_atom_free_electron = sibling_atom.freeElectrons()[0][0]

                    base_atom.electronPairs.map((base_atom_electron_pair) => {
                        if (base_atom_electron_pair.length === 1 && base_atom_electron_pair[0] === base_atom_free_electron) {
                            base_atom_electron_pair.push(sibling_atom_free_electron)
                        }
                    })

                    sibling_atom.electronPairs.map((electron_pair) => {
                        if (electron_pair.length === 1 && electron_pair[0] === sibling_atom_free_electron) {
                            electron_pair.push(base_atom_free_electron)
                        }
                    })

                    if (base_atom.isSingleBondedTo(sibling_atom) === false && base_atom.isDoubleBondedTo(sibling_atom) === false && base_atom.isTripleBondedTo(sibling_atom) === false) {
                        throw new Error("Failed to bond base atom to sibling atom (makeCovalentBond())")
                }

                //const is_single_bonded = sibling_atom.isSingleBondedTo(base_atom)
                //const is_double_bonded = sibling_atom.isDoubleBondedTo(base_atom)
                if (sibling_atom.isSingleBondedTo(base_atom) === false && sibling_atom.isDoubleBondedTo(base_atom) === false && sibling_atom.isTripleBondedTo(base_atom) === false) {
                    throw new Error("Failed to bond sibling atom to base atom (makeCovalentBond())")
                }


            } catch(e) {
                console.log(e.stack)
                logger.log('error', 'Prototypes.makeCovalentBond() '+e)
                process.exit()
            }




        }

    })
    Object.defineProperty(Array.prototype, 'makeDisassociativeBond', {
        value: function (atom_2) {
            Typecheck(
                {name: "atom 1", value: this, type: "array"},
                {name: "atom 2", value: atom_2, type: "array"}
            )

            this.isSingleBondedTo(atom_2).should.be.false()
            // Do nothing for now
        }
    })
    Object.defineProperty(Array.prototype, 'checkElectronPair', {
        value: function () {
            if (this.length > 1) {
                const first_electron_pair_arr = _.cloneDeep(this[0]).split('.')
                const second_electron_pair_arr = _.cloneDeep(this[1]).split('.')
                try {
                    if (first_electron_pair_arr[1] == second_electron_pair_arr[1]) {
                        throw new Error('Electron pair values use the same atom id')
                    }
                } catch (e) {
                    console.log('Atom pair error')
                    console.log('Atom pair:')
                    console.log(this)
                    console.log(e)
                    return false
                }
            }
        }
    })
    Object.defineProperty(Array.prototype, 'checkAtom', {
        value: function () {

            try {
                if (typeof this.atomicSymbol !== 'string') {
                    throw new Error('Atom atomic symbol should be a string')
                }
            } catch(e) {
                console.log(e)
                console.log(this)
                process.exit()
            }

            // Check electron pair doesn't use the same id
            this[Constants().electron_index].map((electron_pair)=>{
                electron_pair.checkElectronPair()
            })
        }
    })
    Object.defineProperty(Array.prototype, 'makeIonicBond', {
        value: function (target_atom) {

            // 'this' (base atom) gives up an electron to the target atom
            // 'target atom takes an electron from 'this' (base atom)
            Typecheck(
                {name: "target_atom", value: target_atom, type: "array"},
            )

            try {
                if (typeof this.atomicSymbol !== 'string') {
                    throw new Error('Atom atomic symbol should be a string')
                }
                if (typeof target_atom.atomicSymbol !== 'string') {
                    throw new Error('Target atom atomic symbol should be a string')
                }
                if (this.electronegativity() > target_atom.electronegativity()) {
                    throw new Error('Base atom should be less electronegative than target atom')
                }
                if (target_atom.electronegativity() - this.electronegativity() < 1.8) {
                    throw new Error('Difference in electronegativity between base and target atoms should be greater than 1.7')
                }
            } catch(e) {
                console.log(e)
                console.log('base atom')
                console.log(this)
                console.log(this.electronegativity())
                console.log('target atom')
                console.log(target_atom)
                console.log(target_atom.electronegativity())
                process.exit()
            }

            // Move an electron from 'this' to the target atom.
            const free_electron = this.freeElectrons().pop() // Note - return electron pairs
            //console.log(free_electron)
            _.remove(this.electronPairs, (electron_pair)=>{
                return _.isEqual(free_electron, electron_pair)
            })
            // Add electron to target atom but mark that is from the base atom and there is an ionic bond between base and target atoms
            target_atom[Constants().electron_index].push(['ionic.' + this.atomicSymbol + '.' + this.atomId])
            
            /*
            console.log('makeIonicBond() (fin)')
            console.log(this)
            console.log(target_atom)
            process.exit()
            */


        }
    })
    Object.defineProperty(Array.prototype, 'makeDativeBondx', {
        value: function (target_atom, allow_hydrogen_as_target_atom, atoms, logger) {

            try {
                
                // A dative bond is formed when both electrons making up the shared electron pair come from just one of the atoms.

                Typecheck(
                    {name: "target_atom", value: target_atom, type: "array"},
                    {name: "allow_hydrogen_as_target_atom", value: allow_hydrogen_as_target_atom, type: "bool"},
                    {name: "atoms", value: atoms, type: "array"},
                    {name: "logger", value: logger, type: "object"},
                )

                    /*Here we push an electron pair from the base atom to the target atom.*/
                    const base_atom = this
                    if (base_atom.atomId === target_atom.atomId) {
                        throw new Error('Base and target atoms are the same.')
                    }
                    if (base_atom.electrons().length === 0) {
                        throw new Error("Base atom has no electrons")
                    }
                    if (null === target_atom) {
                        throw new Error("Target atom is null")
                    }
                    if ((undefined === allow_hydrogen_as_target_atom || false === allow_hydrogen_as_target_atom) && base_atom.atomicSymbol === 'H') {
                        throw new Error('Hydrogens not allowed by default when calling makeDativeBond(). To allow hydrogen bonding add true as the third parameter.')
                    }
                    // Base atom atoms should have at least 2 free electrons as otherwise we cannot push and electron pair from the base atom to the target atom.
                    if (base_atom.freeElectrons().length === 0) {
                        console.log('Base atom:')
                        console.log(base_atom)
                        throw new Error("Base atom should have 2 or more electrons as otherwise there is no electron pair to push to target atom.")
                    }
                    // Target atom ("this") should be able to accept an electron pair
                    if (target_atom.freeSlots().length === 0) {
                        throw new Error("Target atom already has no free slots")
                    }
                    if (undefined === base_atom.electronPairs) {
                        throw new Error('Failed to initialize electrons')
                    }

                    if (_.cloneDeep(base_atom).freeElectrons().length < 2) {
                        throw new Error('makeDativeBond() Base atom does not hav eenough free electrons')
                    }
                    // Get free electrons from the base atom
                    const first_free_electron = _.cloneDeep(base_atom).freeElectrons()[0][0]
                    const second_free_electron = _.cloneDeep(base_atom).freeElectrons()[1][0]
                    if (first_free_electron === second_free_electron) {
                        throw new Error('First and second free electrons are the same')
                    }
                    const base_atom_free_electron_pair = [
                        base_atom.freeElectrons()[0][0],
                        base_atom.freeElectrons()[1][0]
                    ]
                    const uniq_id = uniqid().substr(uniqid().length-3,3)
                    const electron_pair_to_add = [
                        target_atom.atomicSymbol  +'.' + target_atom.atomId + '.' + base_atom.atomId + '.db' + uniq_id,
                        base_atom.atomicSymbol  + '.' + base_atom.atomId + '.' + target_atom.atomId + '.db' + uniq_id
                    ]
                    if (false === electron_pair_to_add.checkElectronPair()) {
                        throw new Error('Error checking electron pair')
                    }
                    // Add electron pair to target atom
                    target_atom.electronPairs.push(electron_pair_to_add)
                    // remove free electrons we used above from base atom and add base atom electron pair
                    _.remove(base_atom.electronPairs, (electron_pair)=>{
                        return electron_pair[0] === base_atom_free_electron_pair[0] || electron_pair[0] === base_atom_free_electron_pair[1]
                    })
                    base_atom.electronPairs.push(_.cloneDeep(electron_pair_to_add).reverse())

                    const new_atoms = atoms.map((atom)=>{
                        if (atom.atomId === base_atom.atomId){
                            atom = base_atom
                        }
                        if (atom.atomId === target_atom.atomId){
                            atom = target_atom
                        }
                        return atom
                     })
                    return new_atoms
    
            } catch(e) {

                logger.log('error', 'Prototypes.makeDativeBond() '+e)
                console.log(e.stack)
                process.exit()

            }

            

        }

    })
    Object.defineProperty(Array.prototype, 'bondAtomToAtom', {
        value: function (target_atom, allow_hydrogen_as_target_atom, atoms, logger) {

            try {
                

                Typecheck(
                    {name: "target_atom", value: target_atom, type: "array"},
                    {name: "allow_hydrogen_as_target_atom", value: allow_hydrogen_as_target_atom, type: "bool"},
                    {name: "atoms", value: atoms, type: "array"},
                    {name: "logger", value: logger, type: "object"},
                )

                    /*
                    Here we push an electron pair from the base atom to the target atom.
                    */

                    const base_atom = this


                    if (base_atom.atomId === target_atom.atomId) {
                        throw new Error('Base and target atoms are the same.')
                    }
                    if (base_atom.electrons().length === 0) {
                        throw new Error("Base atom has no electrons")
                    }

                    if (null === target_atom) {
                        throw new Error("Target atom is null")
                    }

                    if ((undefined === allow_hydrogen_as_target_atom || false === allow_hydrogen_as_target_atom) && base_atom.atomicSymbol === 'H') {
                        throw new Error('Hydrogens not allowed by default when calling bondAtomToAtom(). To allow hydrogen bonding add true as the third parameter.')
                    }

                    if (this.electronegativity() - base_atom.electronegativity() > 1.9) {
                        // 'base atom' is less electronegative
                        base_atom.makeIonicBond(this)
                        return
                    }

                    if (base_atom.electronegativity() - this.electronegativity() > 1.9) {
                        // 'this' is less electronegative
                        this.makeIonicBond(base_atom)
                        return
                    }

                    const new_atoms =  this.makeDativeBond(target_atom, allow_hydrogen_as_target_atom, atoms, logger)


                    return new_atoms
    
            } catch(e) {

                logger.log('error', 'Prototypes.bondAtomToAtom() '+e)
                console.log(e.stack)
                process.exit()

            }

            

        }

    })
    Object.defineProperty(Array.prototype, 'electronCount', {
        value: function () {
            // "this" is an atom
            this[0].should.be.a.String()
            return this.electronPairs.reduce((carry, electron_pair, index) => {
                carry = carry + electron_pair.length
                return carry
            }, 0)
        }
    })
    Object.defineProperty(Array.prototype, 'hasProton', {
        value: function (molecule) {
            // "this" is an atom
            return _.find(this.bonds(molecule.atoms, true), (b)=>{
                return 'H' === b.atom.atomicSymbol
            }) !== undefined
        }
    })
    Object.defineProperty(Array.prototype, 'atomicSymbol', {
        value: function () {
            const atomic_symbol = this.atomicSymbol
            Typecheck(
                {name: "atomic symbol", value: atomic_symbol, type: "string"},
                {name: "molecule", value: this, type: "array"},
            )
            return atomic_symbol
        }
    })

    Object.defineProperty(Array.prototype, 'addAtomToMolecule', {
        value: function (atom) {
            Typecheck(
                {name: "atom", value: atom, type: "array"},
                {name: "molecule", value: this, type: "array"},
            )
            if (atom === undefined || atom === null) {
                throw new Error("Atom is undefined or null")
            }

            this.atoms.should.not.be.a.String()
            this.atoms.push(atom)
        }
    })

    Object.defineProperty(Array.prototype, 'addHalide', {
        value: function (molecule_target_atom, halide_atom, logger) {

            try {
                Typecheck(
                    {name: "halide_atom", value: halide_atom, type: "array"},
                    {name: "molecule target atom", value: molecule_target_atom, type: "array"},
                    {name: "logger", value: logger, type: "object"},
                )
    
                const molecule = this
    
                //molecule = molecule_target_atom.bondAtomToAtom(halide_atom, false, logger)
                molecule.atoms = halide_atom.bondAtomToAtom(molecule_target_atom, false, logger)
                molecule.atoms.push(halide_atom)
    
                return true
    
            } catch(e) {
                console.log(e.stack)
                logger.log('error', 'Protypes.addHalide() '+e)
            }
        }
    })


    Object.defineProperty(Array.prototype, 'addLeavingGroup', {
        value: function (molecule_target_atom, leaving_group_molecule, logger) {

            try {

                Typecheck(
                    {name: "leaving group molecule", value: leaving_group_molecule, type: "array"},
                    {name: "molecule target atom", value: molecule_target_atom, type: "array"},
                    {name: "logger", value: logger, type: "object"},
                )
    
                const molecule = this
    
                // Get the leaving group atom to bond to
                const symbols = ['O']
    
                // Find leaving group atom
                const leaving_group_atom = _.find(leaving_group_molecule.atoms, (atom)=>{
                    return symbols.indexOf(atom.atomicSymbol) !== -1
                })
    
                if (undefined === leaving_group_atom || false === leaving_group_atom) {
                    logger.log('verbose','addLeavingGroup - could not find leaving group atom')
                    return false
                }
    
              //  molecule = molecule_target_atom.bondAtomToAtom(leaving_group_atom, false, logger)
              molecule.atoms = leaving_group_atom.bondAtomToAtom(molecule_target_atom, false, logger)
    
                const molecule_atoms = molecule.atom
                leaving_group_molecule.atoms.map((atom)=>{
                    molecule_atoms.push(atom)
                })

            
    
            } catch(e) {
                console.log(e.stack)
                logger.log('error', 'Prototypes.addLeavingGroup() '+e)
            }


        }
    })



    Object.defineProperty(Array.prototype, 'nonBondedElectrons', {
        value: function () {
            Typecheck(
                {name: "atom", value: this, type: "array"},
            )

            return this.electronPairs.filter((electron_pair)=>{
                if (undefined === electron_pair) {
                    console.log('Atom')
                    console.log(this.electronPairs)
                    throw new Error('Electron pair is undefined')
                }
                return electron_pair.length === 1
            }).map((electron_pair)=>{
                return electron_pair[0]
            })
        }

    })


    Object.defineProperty(Array.prototype, 'removeHydrogens', {
        value: function () {
            // 'this' is an array of atoms
            Typecheck(
                {name: "atoms", value: this, type: "array"},
            )
            this[0].atomicSymbol.should.be.a.String()
            return this.filter((atom=>{
                return atom.atomicSymbol !== 'H'
            }))
        }
    })
    Object.defineProperty(Array.prototype, 'removeWater', {
        value: function () {
            // 'this' is an array of atoms
            Typecheck(
                {name: "atoms", value: this, type: "array"},
            )
            this[0].atomicSymbol.should.be.a.String()
            return this.filter((atom=>{
                return atom.atomicSymbol !== 'O' || (atom.atomicSymbol === 'O' && atom.hydrogens(this).length !== 2)
            }))
        }
    })
    Object.defineProperty(Array.prototype, 'checkAtomsBonds', {
        value: function (molecule, logger) {

            try {


                Typecheck(
                    {name: "molecule", value: molecule, type: "object"},
                    {name: "logger", value: logger, type: "object"}
                )

                // Can't use .atoms here
                const atoms = molecule.atoms

                if (molecule[0] !== null && typeof molecule[0] !== 'number') {
                    throw new Error('First item in molecule should be a number.')
                }

                // Are we dealing with just a single atom with hydrogens?
                // eg water
                if(atoms.length === 1 && atoms[0].isTerminalAtom(atoms)) {
                    return true
                }

                if(atoms.length===1 && atoms[0].bonds(atoms, true).length===0) {
                    return true
                }

                const hydrogens = atoms.filter((atom)=>{
                    return atom.atomicSymbol === 'H'
                })
                if (atoms.length - hydrogens.length === -1) {
                    return
                }

                let error_found = false

                atoms.map((atom, i)=>{

                    if(!Array.isArray(atom))  {
                        console.log('Atom:')
                        console.log(atom)
                        throw new Error('Atom should be an array')
                    }

                    if (atom.atomicSymbol === 'H') {
                        // Ignore hydrogens for now
                        return atom
                    }

                    // Filter atoms that have bonds to current atom.
                    // If we are left with no atoms then the current atom
                    // has no bonds to any of the other atoms.
                    // Also do a reverse check to check that an where an atom
                    // is bonded to another atom that other atom is also
                    // shown as bonded to the first atom.
                    const atoms_with_bonds_to_current_atom = this.filter((_atom)=>{
                        if (_atom.atomId === atom.atomId) {
                            return false
                        }
                        return (atom.isBondedTo(_atom) && _atom.isBondedTo(atom))
                    })

                    try {
                        if (atoms_with_bonds_to_current_atom.length === 0) {
                            throw new Error('Atom has no bonds to any of the other atoms.')
                        }
                    } catch(e) {
                        console.log(e.stack)
                        console.log('Molecule')
                        molecule.atoms.map((atom)=>{
                            console.log(atom)
                            console.log(atom.ionicBonds(atoms))
                        })
                        console.log('Atom')
                        console.log(atom)
                        logger.log('error', 'Prototypes.checkAtomsBonds() filter ' + e)
                        process.exit()

                    }

                })

                if (error_found) {
                    console.log('Error when calling checkAtomBonds()')
                    molecule.renderCompressed(false, logger)
                    process.exit()
                }




            } catch(e) {
                console.log(e.stack)
                logger.log('error', 'Prototypes.checkAtomsBonds() '+e)
                process.exit()
            }



        }
    })

    Object.defineProperty(Array.prototype, 'checkElectrons', {
        value: function (molecule, logger) {

            try {

                Typecheck(
                    {name: "molecule", value: molecule, type: "object"},
                    {name: "logger", value: logger, type: "object"},
                )

                const charge = this.charge( molecule.atoms, logger)
                const bond_count_map = {
                    'N':3 + charge,
                    'O':2 + charge
                }

                // For ionic bonds the ionic electron is included in the child atom electrons even though
                // the child atom doesn't actually have the ionic electron.
                // Hence we need to check if the atom has any ionic electrons and if the atom is a child
                // substract the number of electrons from the number of electrons.
                const ionic_electrons = this.electrons().filter((electron)=>{
                    return this.electrons().length > 8 && electron.indexOf('ionic') !== -1
                })

                const electron_count = this.electrons().length - ionic_electrons.length


              //  console.log('Electron pairs:'+this.electronPairs().length+'.Electrons:' + this.electrons().length)
                if (undefined !== bond_count_map[this.atomicSymbol] 
                && this.electronPairs().length === bond_count_map[this.atomicSymbol]
                && electron_count !== 8
                    ) {
                    throw new Error('Atom has incorrect number of valence electrons.')    
                }



                this.electronPairs.map((electron_pair)=>{
                    if (undefined === electron_pair) {
                        throw new Error('Electron pair is undefined!')
                    }
                    electron_pair.map((item)=> {
                        if (typeof item !== 'string') {
                            throw new Error('Electron pair element should be a string')
                        }

                        if (electron_pair.length > 1) {
                            const first_electron_pair_arr = _.cloneDeep(electron_pair[0]).split('.')
                            const second_electron_pair_arr = _.cloneDeep(electron_pair[1]).split('.')
                            try {
                                if (first_electron_pair_arr[1] == second_electron_pair_arr[1]) {
                                    throw new Error('Electron pair values use the same atom id')
                                }
                            } catch (e) {
                                logger.log('error', 'Prototypes.checkElectrons() '+e)
                                process.exit()
                            }
                        }
                    })
                })

            } catch(e) {
                console.log(e.stack)
                logger.log('error', 'Prototypes.checkElectrons() '+e)
                process.exit()
            }

        }
    })
    Object.defineProperty(Array.prototype, 'isHalide', {
        value: function () {
            return ['Br', 'Cl', 'F', 'I'].indexOf(this.atomicSymbol) !==-1
        }
    })
    Object.defineProperty(Array.prototype, 'charge', {
        value: function (atoms, logger) {

            try {

                Typecheck(
                    {name: "atoms", value: atoms, type: "array"},
                    {name: "logger", value: logger, type: "object"},
                )

                // 'this' is an atom
                if (this.isHalide()) {
                    // Check if has taken an electron from another atom (ionic bond) and it has
                    // give it a negative charge
                    return undefined ===_.find(
                        this.electrons(),
                        (electron)=>{
                            //console.log('electron---')
                            //console.log(electron)
                            //return false
                            return electron.split('.')[0]==='ionic'
                        }
                    )?0:-1
                }
    
    
                // @see https://www.masterorganicchemistry.com/2010/09/24/how-to-calculate-formal-charge/
                /*
                Formal charge = [# of valence electrons] – [electrons in lone pairs + 1/2 the number of bonding electrons]
    
                eg B[H4]
                valence electrons = 3
                electrons in lone pairs (non-bonded electrons) = 0
                total number of bonding electrons = 8 (full octet). One half of this is 4.
                Formal charge = 3 - (0 +4
    
                Alternatively
                Formal Charge = [# of valence electrons on atom] – [non-bonded electrons + number of bonds].
    
                eg B[H4]
                Applying this again to BH$
                The number of valence electrons for boron is 3.
                The number of non-bonded electrons is zero.
                The number of bonds around boron is 4.
                So formal charge = 3 – (0 + 4)  = 3 – 4  = –1
    
                eg C[H3]
                The number of valence electrons for carbon is 4
                The number of non-bonded electrons is two (it has a lone pair)
                The number of bonds around carbon is 3.
                So formal charge = 4 – (2 +3) = 4 – 5  = –1
    
                eg C[H3]+
                The number of valence electrons for carbon is 4
                The number of non-bonded electrons is zero
                The number of bonds around carbon is 3.
                 So formal charge = 4 – (0 +3) = 4 – 3 = +1
                 */
    
    
                const valence_electron_count = this.valenceElectronsCount
    
                const atomic_symbol = this.atomicSymbol
    
                let charge = 0
                
                // When determining charge we do not count ionic bonds
                // @see https://chem.libretexts.org/Bookshelves/Organic_Chemistry/Supplemental_Modules_(Organic_Chemistry)/Amines/Synthesis_of_Amines/Gabriel_Synthesis
                // Potassium Phthalmide - nitrogen atom has three bonds with one iconic bond but has negative charge.
                //let number_of_bonds = this.bondCount(atoms) + (this.ionicBonds(atoms).length/2)
                let number_of_bonds = this.bondCount(atoms)

                switch(atomic_symbol) {
                    case 'Hg':
                        switch(number_of_bonds) {
                            case 0:
                                charge = -2
                                break
                            case 0:
                                charge = -1
                                break
                            case 2:
                                charge = 0
                                break
                            case 3:
                                charge = 1
                                break
                        }
                        break
                    case 'N':
                        switch(number_of_bonds) {
                            case 4:
                                charge = 1
                                break
                            case 3:
                                charge = 0
                                break
                            case 2:
                                charge = -1
                                break
                            case 1:
                                charge = -2
                                break
                        }
                        break
                    case 'P':
                            switch(number_of_bonds) {
                                case 4:
                                    charge = 1
                                    break
                                case 3:
                                    charge = 0
                                    break
                                case 2:
                                    charge = -1
                                    break
                                case 1:
                                    charge = -2
                                    break
                            }
                            break
                    case 'O':
                        switch(number_of_bonds) {
                            case 3:
                                charge = 1
                                break
                            case 2:
                                charge = 0
                                break
                            case 1:
                                charge = -1
                                break
                        }
                        break
                    case 'K': // Need to revise
                        switch(this.electrons().length) {
                            case 0:
                                charge = 1
                                break
                            default:
                                charge = 0
                                break
                        }
                        break
                    default:
                        charge = valence_electron_count - this.nonBondedElectrons().length -  number_of_bonds
                }
    
                // @see https://study.com/skill/learn/how-to-calculate-formal-charge-explanation.html
                // Formal charge = valence electrons - unbonded electrons - 1/2 bonded electrons
                /*
                if(charge === 0 && this[Constants().atom_charge_index] === "&+" || this[Constants().atom_charge_index] === "&-") {
                    return this[Constants().atom_charge_index]
                }
                 */
                return charge
    

            } catch(e) {
                console.log(e.stack)
                logger.log('error', 'Prototypes.charge() '+e)
                process.exit()
            }
            

        }
    })
    Object.defineProperty(Array.prototype, 'setCharges', {
        value: function (logger) {

            try {
                Typecheck(
                    {name: "logger", value: logger, type: "object"},
                )

                if (typeof this !== 'number') {
                    throw new Error('First item in molecule should be a string.')
                }

                this.atoms.map((atom)=> {
                    if(atom.atomicSymbol==="H") {
                        return atom
                    }
                    atom[Constants().atom_charge_index] = atom.charge(this.atoms, logger)
                    return atom
                })
            } catch(e) {
                console.log(e.stack)
                logger.log('error', 'Prototypes.setCharges() '+e)
                process.exit()
            }
        }
    })
    Object.defineProperty(Array.prototype, 'atomId', {
        value: function () {

            const atom = this

            const atomId = this[Constants().atom_id_index]
            const atomicSymbol = this.atomicSymbol

            try {
                if (typeof atomId !== "string") {
                    throw new Error('Atom id should be a string')
                }
            } catch(e) {
                console.log(e)
                console.log('Debug information:')
                console.log('Atom')
                console.log(atom)
                process.exit()
            }

            try {
                if (typeof atomId !== "string") {
                    throw new Error('Atomic symbol should be a string')
                }
            } catch(e) {
                console.log('Debug information:')
                console.log('Atom')
                console.log(atom)
                console.log(e)
                process.exit()
            }

            Typecheck(
                {name: "atomic symbol", value: atom.atomicSymbol, type: "string"},
            )
            try {
                if (atomId === undefined || atomId === null) {
                    console.log('Atom')
                    console.log(atom)
                    throw new Error("Atom id is undefined or null")
                }
            } catch(e) {
                console.log(e)
                process.exit()
            }
            return atomId
        }
    })

    Object.defineProperty(Array.prototype, 'renderCompressedOld', {
        value: function (no_hydrogens, logger) {
            try {

                Typecheck(
                    {name: "no_hydrogens", value: no_hydrogens, type: "bool"},
                    {name: "logger", value: logger, type: "object"},
                )

                const atoms = this.atoms

                atoms.map((atom)=>{
                    if (undefined !== no_hydrogens && no_hydrogens === true && atom.atomicSymbol === 'H') {
                        return atom
                    }
                    console.log(atom.atomicSymbol + ' ' + atom.atomId)
                    console.log('Electrons (renderCompressed): ' + atom[Constants().electron_index].length + ' Charge: ' + atom.charge(atoms, logger))
                    console.log(atom[Constants().electron_index])
                })
    
            } catch(e) {
                console.log(e.stack)
                logger.log('error', 'Prototypes.renderCompressed() '+e)
                process.exit()
            }
        }
    }),
    Object.defineProperty(Array.prototype, 'breakIonicBond_remove', {
        value: function (target_atom, molecule, logger) {

            Typecheck(
                {name: "atom", value: target_atom, type: "array"},
                {name: "molecule", value: molecule, type: "object"},
                {name: "logger", value: logger, type: "logger"},
            )
            
            // Break bond by removing the ionic bond from target atom
            // @todo create a new method called hasIonicBondWith()
            //console.log('breakIonicBond()')
            const ionic_bond = target_atom.ionicBonds(molecule.atoms).filter((bond)=>{
                return bond.atom.atomId === this.atomId || bond.atom.atomId === target_atom.atomId
            })
                        /*
            {
            parent: [
                'K',
                19,
                1,
                1,
                1,
                '91u',
                0.8,
                undefined,
                8,
                2,
                [ '2', '8', '8', '1' ],
                []
            ],
            atom: [
                'O',
                8,
                6,
                2,
                -1,
                '91w',
                3.5,
                1,
                8,
                6,
                [ '2', '6' ],
                [
                [Array], [Array],
                [Array], [Array],
                [Array], [Array],
                [Array], [Array]
                ]
            ],
            atom_index: 2,
            bond_type: 'ionic'
            }
                        */
            //console.log('source atom')
            //console.log(this)
            //console.log('target atom')
            //console.log(target_atom)
            if (ionic_bond !== undefined) {
                // Does the source atom have the electron or does the target_atom
                // Look for the ionic electron in the target atom
                const target_atom_ionic_electron = _.find(target_atom.electronPairs, (electron_pair) => {
                    return electron_pair.length === 1 && electron_pair[0] === 'ionic.' + this.atomicSymbol + '.' + this.atomId
                })
                if (undefined !==target_atom_ionic_electron){
                    // target atom has the ionic electron
                    this.electronPairs.push([this.atomicSymbol+'.' + this.atomId])
                    _.remove(target_atom.electronPairs, (electron_pair)=>{
                        return electron_pair.length === 1 && electron_pair[0] === 'ionic.' + this.atomicSymbol + '.' + this.atomId
                    })
                } else {
                    // source atom has the ionic electron
                    target_atom.electronPairs.push([target_atom.atomicSymbol+'.' + target_atom.atomId])
                    _.remove(this.electronPairs, (electron_pair)=>{
                        return electron_pair.length === 1 && electron_pair[0] === 'ionic.' +target_atom.atomicSymbol + '.' + target_atom.atomId
                    })
                }

     /*
                console.log('breakIonicBond()')
                console.log('source atom')
                console.log(this)
                console.log('target atom')
                console.log(target_atom)

                process.exit()
                */

            } 

            // 
        }
    })
    Object.defineProperty(Array.prototype, 'breakSingleBond_remove', {
        value: function (target_atom, molecule,logger) {

            try {

                // molecule is the molecule containing the target_atom
                Typecheck(
                    {name: "atom", value: target_atom, type: "array"},
                    {name: "source_atom", value: this, type: "array"},
                    {name: "molecule", value: molecule, type: "object"},
                    {name: "logger", value: logger, type: "object"},
                )
                
                const base_atom = (this)

                if (target_atom === undefined || target_atom === null) {
                    throw new Error("Atom is undefined or null")
                }

                if (target_atom === undefined || target_atom === null) {
                    throw new Error("Atoms are undefined or null")
                }

                // Check bonds
                if(true === base_atom.isTripleBondedTo(target_atom) && false === target_atom.isTripleBondedTo(base_atom)) {
                    throw new Error('Base and target atom should be triple bonded to each other')
                }
                if(true === base_atom.isDoubleBondedTo(target_atom) && false === target_atom.isDoubleBondedTo(base_atom)) {
                    throw new Error('Base and target atom should be double bonded to each other')
                }
                if(true === base_atom.isSingleBondedTo(target_atom) && false === target_atom.isSingleBondedTo(base_atom)) {
                    throw new Error('Base and target atom should be single bonded to each other')
                }

                // Set variables for checking against result
               // const target_atom_electrons_count_before_breaking_bond = target_atom.electronCount()
               // const base_atom_electrons_count_before_breaking_bond = base_atom.electronCount()
                const saved_target_atom_charge = target_atom[Constants().atom_charge_index]
                const saved_source_atom_charge = base_atom[Constants().atom_charge_index]

                // Verify that base atom ('base_atom') is bonded to target atom ('atom')
                if (base_atom.isSingleBondedTo(target_atom) === false && base_atom.isDoubleBondedTo(target_atom) === false && base_atom.isTripleBondedTo(target_atom) === false) {
                    throw new Error('No bond found between target atom and base atom')
                }

                // Get base atom - target atom bond
                const base_atom_target_atom_bonds = base_atom.bonds(molecule.atoms, true).filter((bond) => {
                    return bond.atom.atomId === target_atom.atomId
                })

                if (base_atom_target_atom_bonds.length === 0) {
                    throw new Error("No base atom to target atom bonds found")
                }

                // Get electron pair from base atom ('base_atom')
                const base_atom_target_atom_bond = base_atom_target_atom_bonds[0]
                const base_atom_target_atom_bond_electron_pair = base_atom_target_atom_bond.electron_pairs[0]

                // Checks
                const bond_type = base_atom_target_atom_bond.bond_type

                if (undefined === base_atom_target_atom_bond_electron_pair || base_atom_target_atom_bond_electron_pair === false || base_atom_target_atom_bond_electron_pair.length !== 2) {
                    throw new Error("Could not get electron pair shared by base atom and target atom")
                }

               // const base_atom_before_removing_single_bond = _.cloneDeep(base_atom)
               // const target_atom_before_removing_single_bond = _.cloneDeep(target_atom)

                // Note: When removing a proton the proton is the base atom.
                // This simulates the electron pair "collapsing" onto the target atom.
                // Remove matching electron pair from base atom ('base_atom')
                const base_atom_electron_pairs_count = base_atom.electronPairs.length

                const base_atom_electron_pair_index = _.findIndex(base_atom.electronPairs, (electron_pair)=>{
                    return _.isEqual(electron_pair, base_atom_target_atom_bond_electron_pair)
                })
                
                // Remove electron pair from base atom
                base_atom.electronPairs.splice(base_atom_electron_pair_index, 1);
                // Re-add electron pair as single electrons
                base_atom.electronPairs.push([base_atom.atomicSymbol + '.' + base_atom_target_atom_bond_electron_pair[0]])
                base_atom.electronPairs.push([base_atom.atomicSymbol + '.' + base_atom_target_atom_bond_electron_pair[1]])
                    
                if (base_atom_electron_pairs_count === base_atom.electronPairs.length) {
                    throw new Error("Failed to remove electron pair from base atom")
                }
                    // Remove an electron pair from target atom ('atom' parameter)
                    const target_atom_electron_pair_index = _.findIndex(target_atom.electronPairs, (electron_pair)=>{
                        const electron_pair_reversed = _.cloneDeep(electron_pair).reverse()
                        return _.isEqual(electron_pair_reversed, base_atom_target_atom_bond_electron_pair)
                    })
                    target_atom.electronPairs.splice(target_atom_electron_pair_index, 1);
                    /*
                    _.remove(target_atom.electronPairs, (electron_pair, index) => {
                        const electron_pair_reversed = _.cloneDeep(electron_pair).reverse()
                        return _.isEqual(electron_pair_reversed, base_atom_target_atom_bond_electron_pair)
                    }).should.not.equal(-1)
                */   
                
                // Check that the bond has been removed
                switch(bond_type) {
                    case '#':
                        if (true === base_atom.isTripleBondedTo(target_atom)) {
                            throw new Error('Base atom should not be still triple bonded to target atom')
                        }
                        if (false === base_atom.isDoubleBondedTo(target_atom)) {
                            throw new Error('Base atom should now be double bonded to target atom')
                        }
                        if (true === base_atom.isSingleBondedTo(target_atom)) {
                            throw new Error('Base atom should now be double bonded to target atom')
                        }
                        break
                    case '=':
                        if (true === base_atom.isTripleBondedTo(target_atom)) {
                            throw new Error('Base atom should not be triple bonded to target atom')
                        }
                        if (true === base_atom.isDoubleBondedTo(target_atom)) {
                            throw new Error('Base atom should not still be double bonded to target atom')
                        }
                        if (false === base_atom.isSingleBondedTo(target_atom)) {
                            throw new Error('Base atom should now be single bonded to target atom')
                        }
                        break
                    case '':
                        if (true === base_atom.isTripleBondedTo(target_atom)) {
                            throw new Error('Base atom should not be triple bonded to target atom')
                        }
                        if (true === base_atom.isDoubleBondedTo(target_atom)) {
                            throw new Error('Base atom should not still be double bonded to target atom')
                        }
                        if (true === base_atom.isSingleBondedTo(target_atom)) {
                            throw new Error('Base atom should not single bonded to target atom')
                        }
                        break
                }

                // We don't add electron pairs to the atom, we just remove the matching electron pair from the base atom ('base_atom')
             //   target_atom.electronCount().should.be.lessThan(target_atom_electrons_count_before_breaking_bond)
             //   base_atom.electronCount().should.be.lessThan(base_atom_electrons_count_before_breaking_bond)

                // Split the formerly-shared electron pair into two and add each item onto the target atom. Remove the
                // electron pair from the target atom. This is to make each electron available for bonding
                // and also so that we get correct free electron counts.
                /*
                _.remove(atom.electronPairs, (electron_pair, index) => {
                    return _.isEqual(electron_pair, base_atom_target_atom_bond_electron_pair)
                })
                */

                // Add new electrons to the target atom
                //atom.electronPairs.push([base_atom_target_atom_bond_electron_pair[1]])
                //atom.electronPairs.push([base_atom_target_atom_bond_electron_pair[0]])
                target_atom.electronPairs.push([target_atom.atomicSymbol + '.2000'])
                target_atom.electronPairs.push([target_atom.atomicSymbol + '.2001'])

                // Adjust charges
                if (saved_source_atom_charge==="&+" || saved_source_atom_charge==="&-") {
                    base_atom[Constants().atom_charge_index] = 1
                }

                if (saved_target_atom_charge==="&+" || saved_target_atom_charge ==="&-") {
                    target_atom[Constants().atom_charge_index] = -1
                }

                if (saved_source_atom_charge !=="&+" && saved_source_atom_charge !=="&-") {
                    target_atom[Constants().atom_charge_index] = base_atom.charge( molecule.atoms, logger)
                }

                if (saved_target_atom_charge !=="&+" && saved_target_atom_charge!=="&-") {
                    target_atom[Constants().atom_charge_index] = target_atom.charge( molecule.atoms, logger)
                }

                return molecule.atoms.map((atom)=>{
                    return atom.atomId === target_atom.atomId?target_atom:atom
                })


                // Note: We can't do an atom check here as we may have an atom with no bonds
                // that we still have to remove



            } catch(e) {
                console.log(e.stack)
                logger.log('error', 'Prototypes.breakSingleBond() '+e)
                process.exit()
            }

           // return base_atom

        }

    })

    // @todo change this to 'makeCovalentBond()'
    Object.defineProperty(Array.prototype, 'makeBond', {
        value: function (target_atom, logger) {

            try {

                const source_atom = this

                const source_atom_free_electrons = source_atom.freeElectrons()
                const target_atom_free_electrons = target_atom.freeElectrons()

                const source_atom_electron_pair = [source_atom_free_electrons[0][0], target_atom_free_electrons[0][0]]
                const target_atom_electron_pair = [target_atom_free_electrons[0][0], source_atom_free_electrons[0][0]]

                _.remove(source_atom.electronPairs, (ep)=>{
                    return ep.length === 1 && ep[0] === source_atom_free_electrons[0][0]
                })

                _.remove(target_atom.electronPairs, (ep)=>{
                    return ep.length === 1 && ep[0] === target_atom_free_electrons[0][0]
                })

                source_atom.electronPairs.push(source_atom_electron_pair)
                target_atom.electronPairs.push(target_atom_electron_pair)

            } catch(e) {
                console.log(e.stack)
                logger.log('error', 'Prototypes.makeBond() '+e)
                process.exit()
            }

        }

    })
    /**
     * 
     * this: array, array, atom that is bonded to the bonded atom.
     * bonded_atom: array, bonded atom from which the bond will be shifted.
     * target_atom: array, atom that the bond will shift to.
     * 
     * Note: In order to avoid having to call this method recursively, this method can
     * result in the target atom having more electrons than allowed.
     */
    Object.defineProperty(Array.prototype, 'shiftBond', {
        value: function (bonded_atom, target_atom, molecule, logger) {

            try {

                Typecheck(
                    {name: "bonded_atom", value: bonded_atom, type: "array"},
                    {name: "target_atom", value: target_atom, type: "array"},
                    {name: "molecule", value: molecule, type: "object"},
                    {name: "logger", value: logger, type: "object"},
                )

                const source_atom = this
                const atoms = molecule.atoms

                const electron_pair_id = uniqid().substr(uniqid().length-3,3)

                // Break bond between source atom and bonded atom
                const shared_source_atom_electron_pair = source_atom.sharedElectronPairs(bonded_atom)[0]
                const shared_target_atom_electron_pair = _.cloneDeep(shared_source_atom_electron_pair)
                shared_target_atom_electron_pair.reverse()

                _.remove(bonded_atom.electronPairs, (ep)=>{
                    return _.isEqual(ep, shared_target_atom_electron_pair)
                })   

                // const uniq_id = uniqid().substr(uniqid().length-3,3)
                const bonded_atom_electron_id_1 = bonded_atom.atomicSymbol + "." + bonded_atom.atomId + ".sb" + uniqid().substr(uniqid().length-3,3)
                const bonded_atom_electron_id_2 = bonded_atom.atomicSymbol + "." + bonded_atom.atomId + ".sb" + uniqid().substr(uniqid().length-3,3)
                bonded_atom.electronPairs.push([bonded_atom_electron_id_1])
                bonded_atom.electronPairs.push([bonded_atom_electron_id_2])

                _.remove(source_atom.electronPairs, (ep)=>{
                    return _.isEqual(ep, shared_source_atom_electron_pair)
                })                

                // Create a new electron pair that uses the target atom id and the source atom id
                const source_atom_electron_id = source_atom.atomicSymbol + "." + target_atom.atomId + ".sb" + electron_pair_id
                const target_atom_electron_id = target_atom.atomicSymbol + "." + source_atom.atomId + ".sb" + electron_pair_id
                const new_shared_source_atom_electron_pair = [
                    target_atom_electron_id,
                    source_atom_electron_id
                ]

                const new_shared_target_atom_electron_pair = _.cloneDeep(new_shared_source_atom_electron_pair)
                new_shared_target_atom_electron_pair

                // "Bond" bonded_atom to target atom
                // Note at this point we don't care if the target atom can accept the electrons.
                source_atom.electronPairs.push([new_shared_source_atom_electron_pair[0], new_shared_source_atom_electron_pair[1]])
                const single_electron_pairs = target_atom.electronPairs.filter((p)=>{
                    return p.length === 1
                })
                single_electron_pairs.pop()
                single_electron_pairs.pop()
                _.remove(target_atom.electronPairs, (ep)=>{
                    return ep.length === 1
                })
                single_electron_pairs.map((ep)=>{
                    target_atom.electronPairs.push(ep)
                })
                target_atom.electronPairs.push([new_shared_target_atom_electron_pair[1], new_shared_target_atom_electron_pair[0]])

                if (source_atom.isSingleBondedTo(target_atom) === false && source_atom.isDoubleBondedTo(target_atom) === false && source_atom.isTripleBondedTo(target_atom) === false) {
                    throw new Error("Failed to bond source atom to target atom ())")
                 }

                 if (target_atom.isSingleBondedTo(source_atom) === false && target_atom.isDoubleBondedTo(source_atom) === false && target_atom.isTripleBondedTo(source_atom) === false) {
                    throw new Error("Failed to target source atom to source atom ())")
                 }

                 // @todo We shouldn't need to do this
                 const source_atom_index = source_atom.atomIndex(atoms)
                 atoms[source_atom_index] = source_atom

                return atoms

            } catch(e) {
                console.log(e.stack)
                logger.log('error', 'Prototypes.shiftBond() '+e)
                process.exit()
            }

        }
    })
    Object.defineProperty(Array.prototype, 'breakDativeBond', {
        value: function (target_atom, molecule, logger) {

            try {

                Typecheck(
                    {name: "target_atom", value: target_atom, type: "array"},
                    {name: "molecule", value: molecule, type: "object"},
                    {name: "logger", value: logger, type: "object"},
                )

                const source_atom = this
                const atoms = molecule.atoms

                // Target atom is the atom that shared the electron pair.
                if (target_atom === undefined || target_atom === null) {
                    throw new Error("Target atom is undefined or null")
                }

                const shared_source_atom_electron_pair = source_atom.sharedElectronPairs(target_atom)[0]
                if (undefined === shared_source_atom_electron_pair) {
                    if (ENV.debug) {
                        logger.log(ENV.debug_log, '[breakBond] No shared source atom electron pair')
                    }
                    return false
                }
                const shared_target_atom_electron_pair = _.cloneDeep(shared_source_atom_electron_pair)
                shared_target_atom_electron_pair.reverse()

                _.remove(source_atom.electronPairs, (ep)=>{
                    return _.isEqual(ep, shared_source_atom_electron_pair)
                })                
                _.remove(target_atom.electronPairs, (ep)=>{
                    return _.isEqual(ep, shared_target_atom_electron_pair)
                })                

                // Re-add electron pair to target atom
                target_atom.electronPairs.push([shared_target_atom_electron_pair[0]])
                target_atom.electronPairs.push([shared_target_atom_electron_pair[1]])

                return atoms

            } catch(e) {
                console.log(e.stack)
                logger.log('error', 'Prototypes.breakBond() '+e)
            }


        }

    })
    Object.defineProperty(Array.prototype, 'breakBond', {
        value: function (target_atom, molecule, logger) {

            try {

                Typecheck(
                    {name: "target_atom", value: target_atom, type: "array"},
                    {name: "molecule", value: molecule, type: "object"},
                    {name: "logger", value: logger, type: "object"},
                )

                const source_atom = this
                const atoms = molecule.atoms

                if (target_atom === undefined || target_atom === null) {
                    throw new Error("Target atom is undefined or null")
                }

                if (atoms === undefined || atoms === null) {
                    throw new Error("Atoms are undefined or null")
                }
     
                const atom_electrons_count_before_removing_proton = target_atom.electronCount()
               // const base_atom_free_electrons_count_before_removing_proton = this.freeElectrons().length
                const saved_target_atom_charge = target_atom[Constants().atom_charge_index]
                const saved_source_atom_charge = source_atom[Constants().atom_charge_index]

                const shared_source_atom_electron_pair = source_atom.sharedElectronPairs(target_atom)[0]
                if (undefined === shared_source_atom_electron_pair) {
                    if (ENV.debug) {
                        logger.log(ENV.debug_log, '[breakBond] No shared source atom electron pair')
                    }
                    return false
                }
                const shared_target_atom_electron_pair = _.cloneDeep(shared_source_atom_electron_pair)
                shared_target_atom_electron_pair.reverse()

                _.remove(source_atom.electronPairs, (ep)=>{
                    return _.isEqual(ep, shared_source_atom_electron_pair)
                })                
                _.remove(target_atom.electronPairs, (ep)=>{
                    return _.isEqual(ep, shared_target_atom_electron_pair)
                })                

                // Re-add electron to target atom
                target_atom.electronPairs.push([shared_target_atom_electron_pair[0]])

                // Ionic bond or CC / C=C
                // If ionic bond then we add the full electron pair to the target atom.
                // otherwise covalent bond so re-add the electron the source atom was sharing to 
                // the source atom.
                if (source_atom.electronegativity - target_atom.electronegativity > 1.9 || ('C' === source_atom.atomicSymbol || 'H' === source_atom.atomicSymbol)) {
                    target_atom.electronPairs.push([shared_target_atom_electron_pair[1]])
                } else {
                    source_atom.electronPairs.push([shared_source_atom_electron_pair[0]])
                }

                return atoms

            } catch(e) {
                console.log(e.stack)
                logger.log('error', 'Prototypes.breakBond() '+e)
            }


        }

    })


    Object.defineProperty(Array.prototype, 'moleculeNonHydrogens', {
        value: function () {

            const atoms = this.atoms

            atoms.should.be.an.Array()
            atoms[0].should.be.an.Array()
            atoms[0].atomicSymbol.should.be.a.String()

            // "this" is a molecule
            return atoms.filter(
                (__atom) => {
                    return __atom.atomicSymbol !== "H"
                }
            )

        }
    })
    Object.defineProperty(Array.prototype, 'moleculeHydrogens', {
        value: function () {

            const atoms = this.atoms

            atoms.should.be.an.Array()
            atoms[0].should.be.an.Array()
            atoms[0].atomicSymbol.should.be.a.String()

            // "this" is a molecule
            return atoms.filter(
                (__atom) => {
                    return __atom.atomicSymbol === "H"
                }
            )
        }
    })

    Object.defineProperty(Array.prototype, 'hydrogens', {
        value: function (atoms) {

            Typecheck(
                {name: "atoms", value: atoms, type: "array"},
            )
            if (atoms === undefined || atoms === null) {
                throw new Error("Atoms are  undefined or null")
            }

            // "this
            this.atomicSymbol.should.be.a.String()
            atoms[0].should.be.an.Array()
            atoms[0].atomicSymbol.should.be.a.String()

            // "this" is an atom
            /*
            if(this[Constants().atom_electronegativity_index] >=3) {
                return this.bondCount() === 1?0:(8 - (this.electronCount()-6))
            }
             */

            return atoms.filter(
                (__atom) => {
                    if (__atom.atomicSymbol === "H" && !_.isEqual(__atom, this)) {
                        return __atom.isSingleBondedTo(this)
                    }
                    return false
                }
            )
        }
    })
    Object.defineProperty(Array.prototype, 'electrons', {
        value: function () {

            this.atomicSymbol.should.be.a.String()

            Typecheck(
                {name: "electrons", value: this.electronPairs, type: "array"},
            )

            // "this" is an atom
            // Get electrons belonging to the atom into an array
            const electrons = this.electronPairs.reduce((carry, electron_pair) => {
                // An electron pair can have one or two electrons plus optionally a bond charge.
                carry.push(electron_pair[0])
                if (electron_pair[1] !== undefined) {
                    carry.push(electron_pair[1])
                }
                return carry
            }, [])
            return electrons
        }
    })
    Object.defineProperty(Array.prototype, 'sharedElectronPairs', {
        value: function (sibling_atom) {

            try {

                Typecheck(
                    {name: "sibling_atom", value: sibling_atom, type: "array"}
                )

                if (sibling_atom === undefined || sibling_atom === null) {
                    throw new Error("sibling_atom is undefined or null")
                }

                    if (_.isEqual(this, sibling_atom)) {
                        throw new Error("Atom and sibling atom are the same.")
                    }

                const base_atom = this

                    if (_.isEqual(base_atom, sibling_atom)) {
                        throw new Error('base atom and sibling atom are the same')
                    }

                // 'this' electron pairs
                // Filter 'pairs' containing only one element
                let base_atom_electron_pairs = _.cloneDeep(base_atom[Constants().electron_index]).filter((base_atom_electron_pair)=>{
                    return base_atom_electron_pair.length > 1
                })



                // If an electron has 4 elements remove the last element
                /*
                base_atom_electron_pairs = base_atom_electron_pairs.map((ep)=>{
                    const p1_parts = ep[0].split(".")
                    const p2_parts = ep[1].split(".")
                    // This is caused when we shift a bond.
                    if (p1_parts.length === 4 && p2_parts.length === 4) {
                        p1_parts.pop()
                        p2_parts.pop()
                        ep[0] = p1_parts.join('.')
                        ep[1] = p2_parts.join('.')
                    }
                    return ep
                })
                */
                // We reverse each electron pair otherwise we won't get a match with the base atom ('this')
                // even if there is a bond
                const sibling_atom_electron_pairs = _.cloneDeep(sibling_atom[Constants().electron_index]).map((sibling_atom_electron_pair)=>{
                    const sibling_atom_electron_pair_reversed = _.cloneDeep(sibling_atom_electron_pair).reverse()
                    return sibling_atom_electron_pair_reversed
                   // return sibling_atom_electron_pair
                }).filter((sibling_atom_electron_pair)=>{
                    return sibling_atom_electron_pair.length > 1
                })

                                // 13 Mar 2023
                                const matching_pairs = base_atom_electron_pairs.reduce((carry, base_atom_electron_pair)=>{
                                    const base_atom_electron_pair_parts_1 = base_atom_electron_pair[0].split(("."))
                                    const base_atom_electron_pair_parts_2 = base_atom_electron_pair[1].split(("."))
                                    if (_.findIndex(sibling_atom_electron_pairs, (sibling_atom_electron_pair)=>{
                                        const sibling_atom_electron_pair_parts_1 = sibling_atom_electron_pair[0].split(("."))
                                        const sibling_atom_electron_pair_parts_2 = sibling_atom_electron_pair[1].split(("."))
                                        return sibling_atom_electron_pair_parts_1[1] === base_atom_electron_pair_parts_1[1] && sibling_atom_electron_pair_parts_2[1] === base_atom_electron_pair_parts_2[1]
                                    }) !== -1) {
                                    carry.push(base_atom_electron_pair)
                                    }
                                    return carry
                                }, [])
                

                // Get  matching pairs
                const matching_pairs_old = base_atom_electron_pairs.reduce((carry, base_atom_electron_pair)=>{
                    if (_.findIndex(sibling_atom_electron_pairs, (sibling_atom_electron_pair)=>{
                        return _.isEqual(sibling_atom_electron_pair, base_atom_electron_pair)
                    }) !== -1) {
                    carry.push(base_atom_electron_pair)
                    }
                    return carry
                }, [])

                return matching_pairs

            } catch(e) {
                console.log(sibling_atom)
                console.log(e.stack)
                process.exit()
            }
            
        }
    })
    Object.defineProperty(Array.prototype, 'isSingleBondedTo', {
        value: function (sibling_atom, atoms) {


            Typecheck(
                {name: "sibling_atom", value: sibling_atom, type: "array"}
            )

            if (sibling_atom === undefined || sibling_atom === null) {
                throw new Error("sibling_atom is undefined or null")
            }

            try {
                if (typeof this.atomicSymbol !== 'string') {
                    throw new Error('parent atom is not an atom')
                }
                if (typeof sibling_atom.atomicSymbol !== 'string') {
                    throw new Error('parent atom is not an atom')
                }
            } catch(e) {
                console.log(e)
                console.log('parent atom:')
                console.log(this)
                console.log('sibling atom:')
                console.log(sibling_atom)
                process.exit()
            }

            try {
                if (_.isEqual(this, sibling_atom)) {
                    throw new Error("Atom and sibling atom are the same.")
                }
            } catch(e) {
                console.log(e)
                console.log('isSingleBondedTo()')
                console.log('Sibling atom:')
                console.log(sibling_atom)
                if (undefined !== atoms) {
                }
                console.log(e.stack)
                process.exit()
            }

            const base_atom = this

            if (_.isEqual(base_atom, sibling_atom)) {
                throw new Error('base atom and sibling atom are the same')
            }

            const matching_pairs = base_atom.sharedElectronPairs(sibling_atom)

            return matching_pairs.length === 1

        }
    })
    Object.defineProperty(Array.prototype, 'isDoubleBondedTo', {
        value: function (sibling_atom) {

            this.atomicSymbol.should.be.a.String()
            sibling_atom.atomicSymbol.should.be.a.String()

            Typecheck(
                {name: "sibling_atom", value: sibling_atom, type: "array"}
            )
            if (sibling_atom === undefined || sibling_atom === null) {
                throw new Error("sibling_atom is undefined or null")
            }
            if (_.isEqual(this, sibling_atom)) {
                throw new Error("Atom and sibling atom are the same.")
            }

            const base_atom = this

            if (_.isEqual(base_atom, sibling_atom)) {
                throw new Error('base atom and sibling atom are the same')
            }

            const matching_pairs = base_atom.sharedElectronPairs(sibling_atom)
            return matching_pairs.length === 2

            // return this.sharedElectrons(sibling_atom).length === 2

        }
    })
    Object.defineProperty(Array.prototype, 'isTripleBondedTo', {
        value: function (sibling_atom) {

            this.atomicSymbol.should.be.a.String()
            sibling_atom.atomicSymbol.should.be.a.String()

            Typecheck(
                {name: "sibling_atom", value: sibling_atom, type: "array"}
            )
            if (sibling_atom === undefined || sibling_atom === null) {
                throw new Error("sibling_atom is undefined or null")
            }
            if (_.isEqual(this, sibling_atom)) {
                throw new Error("Atom and sibling atom are the same.")
            }

            const base_atom = this

            if (_.isEqual(base_atom, sibling_atom)) {
                throw new Error('base atom and sibling atom are the same')
            }

            const matching_pairs = base_atom.sharedElectronPairs(sibling_atom)
            return matching_pairs.length === 3

            // return this.sharedElectrons(sibling_atom).length === 2

        }
    })
    // An additional type of bond is a "non-bond", indicated with ., to indicate that two parts are not bonded together. For example, aqueous sodium chloride may be written as [Na+].[Cl-] to show the dissociation.
    Object.defineProperty(Array.prototype, 'sharedElectrons', {
        value: function (atom) {
            Typecheck(
                {name: "atom", value: atom, type: "array"},
            )
            // this is an atom
            this.atomicSymbol.should.be.a.String()
            atom.atomicSymbol.should.be.a.String()
            if (atom === undefined || atom === null) {
                throw new Error("Atom is undefined or null")
            }
            // Get electrons which are in the current atom set of electrons and also in the atom set of electrons.
            return Set().intersection(this.electrons(), atom.electrons())
        }
    })
    Object.defineProperty(Array.prototype, 'parentBond', {
        value: function (atoms, parent) {

            Typecheck(
                {name: "parent atom", value: parent, type: "array"},
                {name: "atoms", value: atoms, type: "array"}
            )

            // this is an atom
            if (parent === undefined || parent === null) {
                throw new Error("Parent atom is undefined or null")
            }

            parent.atomicSymbol.should.be.a.String()
            this.atomicSymbol.should.be.a.String()

            return this.bonds(atoms).filter((bond)=>{
                return bond.parent.atomId === parent.atomId || bond.atom.atomId === parent.atomId
            })[0]

        }
    })
    Object.defineProperty(Array.prototype, 'nonSharedElectronPairs', {
        value: function (atom) {

            Typecheck(
                {name: "atom", value: atom, type: "array"}
            )

            this.atomicSymbol.should.be.a.String()
            atom.atomicSymbol.should.be.a.String()

            const shared_electrons = this.sharedElectrons(atom)
            return this.electronPairs.filter((electron_pair)=>{
                if (electron_pair.length === 1) {
                    return false
                }
                return shared_electrons.indexOf(electron_pair[0]) === -1 && shared_electrons.indexOf(electron_pair[1]) === -1
            })
        }
    })
    Object.defineProperty(Array.prototype, 'checkAtomsElectronPairs', {
        value: function () {

            // 'this' is an array of atoms
            const atoms = this

            if (atoms.length === 0) {
                return
            }

            atoms[0].atomicSymbol.should.be.a.String()

            // If we have an electron pair with only one electron then the electron
            // should not be being used by any of the other atoms
            // 'this' is the array of atoms
            let error_found = false
            atoms.map((atom) => {
                atom.atomicSymbol.should.be.a.String()
                if (atom.atomicSymbol !== 'H') {
                    try {
                        if (undefined === atom.electronPairs) {
                            throw new Error('Atom has no electron pairs')
                        }
                    }catch(e) {
                        console.log('Atom')
                        console.log(atom)
                        console.log('Atoms')
                        console.log(atoms)
                        error_found = true
                        console.log(e)
                    }
                    atom.electronPairs.map((electron_pair) => {
                        // Go through each atom checking for an electron pair where
                        // one of the electrons matches the electron pair electron.
                        const matches = this.filter((_atom) => {

                            if (electron_pair.length !== 1 || _atom.atomId === atom.atomId) {
                                return false
                            }


                            // For now ignore ionic bonds
                            if (electron_pair[0].split('.')[0]=== 'ionic'){
                                return false
                            }

                            const _atom_electron_pairs = _atom.electronPairs
                            // Check target atom electron pairs for any electron pair containing
                            // and electron matching the current electron pair electron we are checking.
                            // Return true if a match is found.
                            return _atom_electron_pairs.filter((_atom_electron_pair) => {
                                return _atom_electron_pair[0] === electron_pair[0] || _atom_electron_pair[1] === electron_pair[0]
                            }).length > 0
                        })
                        // We have found a match
                        try {
                            if (matches.length > 0) {
                                throw new Error('(checkAtomsElectronPairs()) A free electron is being used by at least one other atom')
                            }
                        } catch(e) {
                            console.log(e)
                            console.log('Atom')
                            console.log(atom)
                            matches.map((_atom) => {
                                console.log('Matching atom')
                                console.log(_atom)
                            })
                           this.renderCompressed(true, logger)
                            console.log(e)
                           process.exit()
                        }
                    })
                } // Not hydrogen atom

                // Check electron pair doesn't use the same id
                atom[Constants().electron_index].map((electron_pair)=>{
                    if (electron_pair.length > 1) {
                        const first_electron_pair_arr = _.cloneDeep(electron_pair[0]).split('.')
                        const second_electron_pair_arr = _.cloneDeep(electron_pair[1]).split('.')
                        try {
                            if (first_electron_pair_arr[1] == second_electron_pair_arr[1]) {
                                throw new Error('Electron pair values use the same atom id')
                            }
                        } catch (e) {
                            console.log('Atom pair error')
                            console.log(electron_pair)
                            console.log(e)
                            error_found = true
                        }
                    }
                })

            })

            if(error_found===true) {
                process.exit()
            }



        }
    }),
    Object.defineProperty(Array.prototype, 'removeRingBond', {
        value: function () {
            this[Constants().atom_ringbond_index] = 0
            this[Constants().atom_ringbond_type_index] = ''
        }
    }),
    Object.defineProperty(Array.prototype, 'ringbondNumber', {
        value: function () {
            return this[Constants().atom_ringbond_index]
        }
    }),
    Object.defineProperty(Array.prototype, 'ringbondType', {
        value: function () {
            return this[Constants().atom_ringbond_type_index]
        }
    }),
    Object.defineProperty(Array.prototype, 'electronegativity', {
        value: function () {
            try {
                if (typeof this[0] !== 'string') {
                    throw new Error("'this' should be an atom")
                }
            } catch(e) {
                console.log(e)
                process.exit()
            }
            return this[Constants().atom_electronegativity_index]
        }
    }),
    Object.defineProperty(Array.prototype, 'atomIndex', {
        value: function (atoms) {

            Typecheck(
                {name: "atoms", value: atoms, type: "array"}
            )

            return _.findIndex(atoms, (a)=>{
                return typeof a === 'object' && this.atomId === a.atomId
            })

        }
    }),
    Object.defineProperty(Array.prototype, 'isIonicBondedTo', {
        value: function (child_atom) {

            Typecheck(
                {name: "child atom", value: child_atom, type: "array"}
            )

            const parent_atom = this

            const child_atom_electrons = child_atom.freeElectrons().filter((electron_pair)=>{
                if (electron_pair.length > 1) {
                    return false
                }
                return electron_pair[0] === 'ionic.' + parent_atom.atomicSymbol + '.' + parent_atom.atomId
            }) 

            if (child_atom_electrons.length > 0) {
                return true
            }

            // Try reverse
            const parent_atom_electrons =  parent_atom.freeElectrons().filter((electron_pair)=>{
                if (electron_pair.length > 1) {
                    return false
                }
                return electron_pair[0] === 'ionic.' + child_atom.atomicSymbol + '.' + child_atom.atomId
            }) 

            return parent_atom_electrons.length > 0

        }
    }),
    Object.defineProperty(Array.prototype, 'bonds', {
        value: function (atoms, include_hydrogens) {

            try {

                if (typeof this.atomicSymbol !== 'string') {
                    throw new Error('Atoms array passed into bonds() is not an array of atoms')
                }

                if (atoms === undefined || atoms === null) {
                    throw new Error("Atoms are  undefined or null")
                }
    
                //  target_atom[Constants().electron_index].push('ionic.' + this.atomicSymbol + '.' + this.atomId)
                const parent_atom = this
    
                let r = atoms.reduce(
                    (bonds, _atom, _atom_index) => {
    
                        // not an array
                        Typecheck(
                            {name: "_atom", value: _atom, type: "array"}
                        )
    
                        if ((undefined === include_hydrogens || false === include_hydrogens) && _atom.atomicSymbol === "H") {
                            return bonds
                        }
    
                        // current atom is equal to parent atom
                        if ((_.isEqual(_.cloneDeep(parent_atom).sort(), _.cloneDeep(_atom).sort()))){
                            return bonds
                        }
    
    
                        // No bonds
                        if (false === parent_atom.isBondedTo(_atom)) {
                            return bonds
                        }
    
    
                        if (parent_atom.isIonicBondedTo(_atom)) {
                            bonds.push({
                                'parent': parent_atom,
                                'atom': _atom,
                                'atom_index': _atom_index,
                                'bond_type': "ionic",
                            })
    
                        } else if(!_atom.isIonicBondedTo(parent_atom)) {
    
                            const electron_pairs = parent_atom.sharedElectronPairs(_atom)
    
                            try {
                                if (electron_pairs.length < 1) {
                                    throw new Error('Number of shared electron pairs should be greater than 0')
                                }
                            } catch(e) {
                                console.log(e)
                                console.log('Parent atom')
                                console.log(parent_atom)
                                console.log('Target atom')
                                console.log(_atom)
                            }
        
                            if (parent_atom.isSingleBondedTo(_atom)) {
    
                                if (false === _atom.isSingleBondedTo(parent_atom)) {
                                    console.log('parent atom')
                                    console.log(parent_atom)
                                    console.log('atom')
                                    console.log(_atom)
                                    throw new Error('Mismatching bonds (single)')
                                }
    
                                bonds.push({
                                    'parent': parent_atom,
                                    'atom': _atom,
                                    'atom_index': _atom_index,
                                    'bond_type': "",
                                    'electron_pairs': electron_pairs
                                })
    
                            } else if (parent_atom.isDoubleBondedTo(_atom)) {
    
                                if (false === _atom.isDoubleBondedTo(parent_atom)) {
                                    console.log('parent atom')
                                    console.log(parent_atom)
                                    console.log('atom')
                                    console.log(_atom)
                                    throw new Error('Mismatching bonds (double)')
                                }
    
                                bonds.push({
                                    'parent': parent_atom,
                                    'atom': _atom,
                                    'atom_index': _atom_index,
                                    'bond_type': "=",
                                    'electron_pairs': electron_pairs
                                })
                            } else if (parent_atom.isTripleBondedTo(_atom)) {
    
                                if (false === _atom.isTripleBondedTo(parent_atom)) {
                                    console.log('parent atom')
                                    console.log(parent_atom)
                                    console.log('atom')
                                    console.log(_atom)
                                    throw new Error('Mismatching bonds (triple)')
                                }
    
                                bonds.push({
                                    'parent': parent_atom,
                                    'atom': _atom,
                                    'atom_index': _atom_index,
                                    'bond_type': "#",
                                    'electron_pairs': electron_pairs
                                })
                            }
        
                        }
    
                        parent_atom[0].should.be.a.String()
    
    
                        return bonds
    
                    },
                    []
                )
    
                return r

            } catch(e) {
                console.log(e)
                console.log(e.stack)
                process.exit()
            }

            // 'this' is an atom
            Typecheck(
                {name: "atoms", value: atoms, type: "array"}
            )


        }
    })
}
module.exports = Prototypes
