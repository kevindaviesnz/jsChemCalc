const PeriodicTable = {
// https://periodictableguide.com/periodic-table-of-elements/
// https://www.wikihow.com/Find-Valence-Electrons

    "Al": {
        "group":13,
        "column":"111A",
        "atomic_number":13,
        "name":"aluminium",
        "atomic_weight":26.982,
        "electrons_per_shell": "2-8-3",
        "state_of_matter":"solid",
        "subcategory":"post transition metal"
    },

    "B": {
        "group":13,
        "column":"111A",
        "atomic_number":5,
        "name":"boron",
        "atomic_weight":10.811,
        "electrons_per_shell": "2-3",
        "state_of_matter":"solid",
        "subcategory":"metalloid"
    },

    "H": {
        "group":1,
        "column":"1A",
        "atomic_number":1,
        "name":"hydrogen",
        "atomic_weight":1.008,
        "electrons_per_shell": "1",
        "state_of_matter":"gas",
        "subcategory":"reactive nonmetal"
    },

    "C": {
        "group":14,
        "column":"IVA",
        "atomic_number":6,
        "name":"carbon",
        "atomic_weight":12.001,
        "electrons_per_shell": "2-4",
        "state_of_matter":"solid",
        "subcategory":"reactive nonmetal"
    },

    "O": {
        "group":16,
        "column":"VIA",
        "atomic_number":8,
        "name":"oxygen",
        "atomic_weight":15.999,
        "electrons_per_shell": "2-6",
        "state_of_matter":"gas",
        "subcategory":"reactive nonmetal"
    },

    "N": {
        "group":15,
        "column":"VA",
        "atomic_number":7,
        "name":"nitrogen",
        "atomic_weight":14.007,
        "electrons_per_shell": "2-5",
        "state_of_matter":"gas",
        "subcategory":"reactive nonmetal"
    },

    "F": {
        "group":17,
        "column":"VIIA",
        "atomic_number":7,
        "name":"fluorine",
        "atomic_weight":18.998,
        "electrons_per_shell": "2-7",
        "state_of_matter":"gas",
        "subcategory":"reactive nonmetal"
    },

    "S": {
        "group":17,
        "column":"VIA",
        "atomic_number":16,
        "name":"sulfur",
        "atomic_weight":32.06,
        "electrons_per_shell": "2-8-6",
        "state_of_matter":"solid",
        "subcategory":"reactive nonmetal"
    },

    "Cl": {
        "group":17,
        "column":"VIIA",
        "atomic_number":17,
        "name":"chlorine",
        "atomic_weight":35.45,
        "electrons_per_shell": "2-8-7",
        "state_of_matter":"gas",
        "subcategory":"reactive nonmetal"
    },

    "Br": {
        "group":17,
        "column":"VIIA",
        "atomic_number":35,
        "name":"bromine",
        "atomic_weight":79.904,
        "electrons_per_shell": "2-8-18-7",
        "state_of_matter":"liquid",
        "subcategory":"reactive nonmetal"
    },

    "I": {
        "group":17,
        "column":"VIIA",
        "atomic_number":53,
        "name":"iodine",
        "atomic_weight":126.90,
        "electrons_per_shell": "2-8-18-18-7",
        "state_of_matter":"solid",
        "subcategory":"reactive nonmetal"
    },

    "Li": {
        "group":1,
        "column":"IA",
        "atomic_number":3,
        "name":"lithium",
        "atomic_weight":6.94,
        "electrons_per_shell": "2-1",
        "state_of_matter":"solid",
        "subcategory":"alkali metal"
    },

    "Na": {
        "group":1,
        "column":"IA",
        "atomic_number":11,
        "name":"sodium",
        "atomic_weight":22.98976,
        "electrons_per_shell": "2-8-1",
        "state_of_matter":"solid",
        "subcategory":"alkali metal"
    },

    "Ac": {
        "group":3,
        "column":"IIIB",
        "atomic_number":89,
        "name":"actinium",
        "atomic_weight":227,
        "electrons_per_shell": "2-8-18-32-18-9-2",
        "state_of_matter":"solid",
        "subcategory":"actinide"
    },

    "Hg": {
        "group":12,
        "column":"IIB",
        "atomic_number":80,
        "name":"mercury",
        "atomic_weight":200.59,
        "electrons_per_shell": "2-8-18-32-18-2",
        "state_of_matter":"liquid",
        "subcategory":"post-transition metal"
    },

    "P": {
        "group":15,
        "column":"VA",
        "atomic_number":15,
        "name":"phosphorous",
        "atomic_weight":30.973761,
        "electrons_per_shell": "2-8-5",
        "state_of_matter":"solid",
        "subcategory":"non metal"
    },

    "K": {
        "group":1,
        "column":"VA",
        "atomic_number":19,
        "name":"potassium",
        "atomic_weight":30.973761,
        "electrons_per_shell": "2-8-8-1",
        "state_of_matter":"solid",
        "subcategory":"alkali metals",
        "electronegativity":0.82
    },

    "At": {
        "group":17,
        "column":"VIIA",
        "atomic_number":85,
        "name":"astatine",
        "atomic_weight":-1,
        "electrons_per_shell": "2,8,18,32,18,7",
        "state_of_matter":'',
        "subcategory":"halide"
    },

    "Os": {
        "group":8,
        "column":"VIIIB",
        "atomic_number":76,
        "name":"osimium",
        "atomic_weight":190.23,
        "electrons_per_shell": "2,8,18,32,14,2",
        "state_of_matter":'solid',
        "subcategory":"transition metals"
    }





}

module.exports = PeriodicTable
