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


//Creation of Property-Panel
//Custom Element:
(function() {
joint.shapes.html = {};
    joint.shapes.html.Element = joint.shapes.basic.Rect.extend({
        defaults: joint.util.deepSupplement({
            type: 'html.Element',
            attrs: {
                rect: { stroke: 'none', 'fill-opacity': 0 }
            }
        }, joint.shapes.basic.Rect.prototype.defaults)
    });

//Custom View
joint.shapes.html.ElementView = joint.dia.ElementView.extend({

        template: [
            '<div class="html-element">',
            //'<button class="delete">x</button>',
            '<label></label>',

            // '<span></span>', '<br/>',
            //'<select><option>--</option><option>one</option><option>two</option></select>',

            '<textarea id="Klassenname"></textarea>',
            '<textarea id="Attribute"></textarea>',
            '<textarea id="Methoden"></textarea>',
            '</div>'
        ].join(''),

        initialize: function() {
            _.bindAll(this, 'updateBox');
            joint.dia.ElementView.prototype.initialize.apply(this, arguments);

            this.$box = $(_.template(this.template)());
            // Prevent paper from handling pointerdown.
            this.$box.find('textarea,select').on('mousedown click', function(evt) {
                evt.stopPropagation();
            });
            // This is an example of reacting on the input change and storing the input data in the cell model.
            this.$box.find('#Klassenname').on('change', _.bind(function(evt) {
                this.model.set('neuKlassenName', $(evt.target).val());
                graph.getCell(this.model.get('bezugsklasse')).set('name',this.model.get('neuKlassenName'));
            }, this));
            this.$box.find('#Attribute').on('change', _.bind(function(evt) {
                            this.model.set('neuAttribute', $(evt.target).val());
                            graph.getCell(this.model.get('bezugsklasse')).set('attributes',this.model.get('neuAttribute'));
                        }, this));
            this.$box.find('#Methoden').on('change', _.bind(function(evt) {
                             this.model.set('neuMethoden', $(evt.target).val());
                             graph.getCell(this.model.get('bezugsklasse')).set('methods',this.model.get('neuMethoden'));
                         }, this));

//            this.$box.find('select').on('change', _.bind(function(evt) {
//                this.model.set('select', $(evt.target).val());
//            }, this));
//            this.$box.find('select').val(this.model.get('select'));

            this.$box.find('.delete').on('click', _.bind(this.model.remove, this.model));
            // Update the box position whenever the underlying model changes.
            this.model.on('change', this.updateBox, this);
            // Remove the box when the model gets removed from the graph.
            this.model.on('remove', this.removeBox, this);

            this.updateBox();
        },
        render: function() {
            joint.dia.ElementView.prototype.render.apply(this, arguments);
            this.paper.$el.prepend(this.$box);
            this.updateBox();
            return this;
        },
        updateBox: function() {
            // Set the position and dimension of the box so that it covers the JointJS element.
            var bbox = this.model.getBBox();
            // Example of updating the HTML with a data stored in the cell model.
            this.$box.find('label').text(this.model.get('label'));
            this.$box.find('span').text(this.model.get('select'));
            if (!(this.model.get('bezugsklasse')==='undefined')) {

                this.model.set('klassenName',graph.getCell(this.model.get('bezugsklasse')).get('name'));
                this.model.set('attribute',graph.getCell(this.model.get('bezugsklasse')).get('attributes'));
                this.model.set('methoden',graph.getCell(this.model.get('bezugsklasse')).get('methods'));
            }
            this.$box.find('#Klassenname').text(this.model.get('klassenName'));
            this.$box.find('#Attribute').text(this.model.get('attribute'));
            this.$box.find('#Methoden').text(this.model.get('methoden'));



            this.$box.css({
                width: bbox.width,
                height: bbox.height,
                left: bbox.x,
                top: bbox.y,
                transform: 'rotate(' + (this.model.get('angle') || 0) + 'deg)'
            });
        },
        removeBox: function(evt) {
            this.$box.remove();
        }


    });


}())

var propertyBox = new joint.shapes.html.Element({
        position: { x: 80, y: 80 },
        size: { width: 170, height: 100 },
        label: 'Property Box',
        klassenName: 'Klassenname',
        attribute: 'Attribute',
        methoden: 'Methoden',
        bezugsklasse: 'undefined',
        neuKlassenname: 'neuKlassenname',
        neuAttribute: 'neuAttribute',
        neuMethoden: 'neuMethoden'
        //select: 'one'
    });



graph.addCells([propertyBox]);

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

        propertyBox.set('bezugsklasse',cellView.model.id);
        //propertyBox.set('klassenName',cellView.model.get('name'));
        paper.findViewByModel(propertyBox).updateBox();





    }
);


function addInheritance() {
    clicks = [];
    relationClass = uml.Generalization;
}
function addDirectedAssociation() {
    clicks = [];
    relationClass = uml.Transition;
}
function addUndirectedAssociation() {
    clicks = [];
    relationClass = uml.Association;
}
function addAggregation() {
    clicks = [];
    relationClass = uml.Aggregation;
}
function addComposition() {
    clicks = [];
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