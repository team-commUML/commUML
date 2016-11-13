var graph = new joint.dia.Graph();

var paper = new joint.dia.Paper({
    el: $('#paper'),
    width: window.innerWidth,
    height: window.innerHeight,
    gridSize: 1,
    model: graph
});

var uml = joint.shapes.uml;

var classes = {

    mammal: new uml.Interface({
        position: {x: 300, y: 50},
        size: {width: 240, height: 100},
        name: 'Mammal',
        attributes: ['dob: Date'],
        methods: ['+ setDateOfBirth(dob: Date): Void', '+ getAgeAsDays(): Numeric'],
        attrs: {
            '.uml-class-name-rect': {
                fill: '#feb662',
                stroke: '#ffffff',
                'stroke-width': 0.5
            },
            '.uml-class-attrs-rect, .uml-class-methods-rect': {
                fill: '#fdc886',
                stroke: '#fff',
                'stroke-width': 0.5
            },
            '.uml-class-attrs-text': {
                ref: '.uml-class-attrs-rect',
                'ref-y': 0.5,
                'y-alignment': 'middle'
            },
            '.uml-class-methods-text': {
                ref: '.uml-class-methods-rect',
                'ref-y': 0.5,
                'y-alignment': 'middle'
            }

        }
    }),

    person: new uml.Abstract({
        position: {x: 300, y: 300},
        size: {width: 260, height: 100},
        name: 'Person',
        attributes: ['firstName: String', 'lastName: String'],
        methods: ['+ setName(first: String, last: String): Void', '+ getName(): String'],
        attrs: {
            '.uml-class-name-rect': {
                fill: '#68ddd5',
                stroke: '#ffffff',
                'stroke-width': 0.5
            },
            '.uml-class-attrs-rect, .uml-class-methods-rect': {
                fill: '#9687fe',
                stroke: '#fff',
                'stroke-width': 0.5
            },
            '.uml-class-methods-text, .uml-class-attrs-text': {
                fill: '#fff'
            }
        }
    }),

    bloodgroup: new uml.Class({
        position: {x: 20, y: 190},
        size: {width: 220, height: 100},
        name: 'BloodGroup',
        attributes: ['bloodGroup: String'],
        methods: ['+ isCompatible(bG: String): Boolean'],
        attrs: {
            '.uml-class-name-rect': {
                fill: '#ff8450',
                stroke: '#fff',
                'stroke-width': 0.5
            },
            '.uml-class-attrs-rect, .uml-class-methods-rect': {
                fill: '#fe976a',
                stroke: '#fff',
                'stroke-width': 0.5
            },
            '.uml-class-attrs-text': {
                ref: '.uml-class-attrs-rect',
                'ref-y': 0.5,
                'y-alignment': 'middle'
            },
            '.uml-class-methods-text': {
                ref: '.uml-class-methods-rect',
                'ref-y': 0.5,
                'y-alignment': 'middle'
            }
        }
    }),

    address: new uml.Class({
        position: {x: 630, y: 190},
        size: {width: 160, height: 100},
        name: 'Address',
        attributes: ['houseNumber: Integer', 'streetName: String', 'town: String', 'postcode: String'],
        methods: [],
        attrs: {
            '.uml-class-name-rect': {
                fill: '#ff8450',
                stroke: '#fff',
                'stroke-width': 0.5
            },
            '.uml-class-attrs-rect, .uml-class-methods-rect': {
                fill: '#fe976a',
                stroke: '#fff',
                'stroke-width': 0.5
            },
            '.uml-class-attrs-text': {
                'ref-y': 0.5,
                'y-alignment': 'middle'
            }
        }

    }),

    man: new uml.Class({
        position: {x: 200, y: 500},
        size: {width: 180, height: 50},
        name: 'Man',
        attrs: {
            '.uml-class-name-rect': {
                fill: '#ff8450',
                stroke: '#fff',
                'stroke-width': 0.5
            },
            '.uml-class-attrs-rect, .uml-class-methods-rect': {
                fill: '#fe976a',
                stroke: '#fff',
                'stroke-width': 0.5
            }
        }
    }),

    woman: new uml.Class({
        position: {x: 450, y: 500},
        size: {width: 180, height: 50},
        name: 'Woman',
        methods: ['+ giveBirth(): Person []'],
        attrs: {
            '.uml-class-name-rect': {
                fill: '#ff8450',
                stroke: '#fff',
                'stroke-width': 0.5
            },
            '.uml-class-attrs-rect, .uml-class-methods-rect': {
                fill: '#fe976a',
                stroke: '#fff',
                'stroke-width': 0.5
            },
            '.uml-class-methods-text': {
                'ref-y': 0.5,
                'y-alignment': 'middle'
            }
        }
    })


};

_.each(classes, function (c) {
    graph.addCell(c);
});

var relations = [
    new uml.Generalization({source: {id: classes.man.id}, target: {id: classes.person.id}}),
    new uml.Generalization({source: {id: classes.woman.id}, target: {id: classes.person.id}}),
    new uml.Implementation({source: {id: classes.person.id}, target: {id: classes.mammal.id}}),
    new uml.Aggregation({source: {id: classes.person.id}, target: {id: classes.address.id}}),
    new uml.Composition({source: {id: classes.person.id}, target: {id: classes.bloodgroup.id}})
];

_.each(relations, function (r) {
    graph.addCell(r);
});

function addClassDiagram() {
    graph.addCell(new uml.Class({
        position: {x: 100, y: 100},
        size: {width: 180, height: 50},
        name: 'Neue Klasse',
        attrs: {
            '.uml-class-name-rect': {
                fill: '#ff8450',
                stroke: '#fff',
                'stroke-width': 0.5
            },
            '.uml-class-attrs-rect, .uml-class-methods-rect': {
                fill: '#fe976a',
                stroke: '#fff',
                'stroke-width': 0.5
            }
        }
    }))
}

var relationClass;
var clicks = [];

paper.on('cell:pointerdown',
    function (cellView, evt, x, y) {

        if(isInDeleteMode) {
            cellView.model.remove();
            isInDeleteMode = false;
            setDeleteButtonColor();
        } else if (typeof relationClass != 'undefined') {
            if (typeof clicks[0] == 'undefined') {
                clicks[0] = cellView.model.id;
            } else if(cellView.model.id != clicks[0]) {
                clicks[1] = cellView.model.id;
                graph.addCell(new relationClass({source: {id: clicks[0]}, target: {id: clicks[1]}}));
                clicks = [];
                relationClass = undefined;
            }
        }

    }
);


function addInheritance() {
    relationClass = uml.Generalization;
}
function addDirectedAssociation() {
    relationClass = uml.Transition;
}
function addUndirectedAssociation() {
    relationClass = uml.Association;
}
function addAggregation() {
    relationClass = uml.Aggregation;
}
function addComposition() {
    relationClass = uml.Composition;
}

var isInDeleteMode = false;

function deleteMode() {
   isInDeleteMode = !isInDeleteMode;
    setDeleteButtonColor();
}

function setDeleteButtonColor() {
    var property = document.getElementById("delete");
    if (isInDeleteMode) {
        property.style.backgroundColor = "#533";
    } else {
        property.style.backgroundColor = "#333";
    }
}

function share() {
}
function upload() {
}
function download() {
}