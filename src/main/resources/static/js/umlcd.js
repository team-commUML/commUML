var uigraph = new joint.dia.Graph();

var uipaperWidth = 200;
var uipaperHeight = 400;

var uipaper = new joint.dia.Paper({
    el: $('#uipaper'),
    width: uipaperWidth,
    height: uipaperHeight,
    gridSize: 1,
    model: uigraph
});

//Creation of Property-Panel
//Custom Element:
(function () {
    joint.shapes.html = {};
    joint.shapes.html.Element = joint.shapes.basic.Rect.extend({
        defaults: joint.util.deepSupplement({
            type: 'html.Element',
            attrs: {
                rect: {stroke: 'none','fill-opacity': 0}
            }
        }, joint.shapes.basic.Rect.prototype.defaults),

        getLinedString: function(attribut) {
            var text="";
            var array=this.get(attribut);
            if (typeof array==='string') {
            return array;}

                for (var i = 0; i < array.length; i++) {

                       text = text+array[i];
                       if (i<array.length-1) {
                       text = text+'\n';}
                }
                return text;
        }
    });

//Custom View
    joint.shapes.html.ElementView = joint.dia.ElementView.extend({

        template: [
            '<div class="html-element">',
            //'<button class="delete">x</button>',
            '<label id="Klasse"></label>',

            // '<span></span>', '<br/>',
            //'<select><option>--</option><option>one</option><option>two</option></select>',

            '<textarea id="Klassenname"></textarea>',
            '<textarea id="Attribute"></textarea>',
            '<textarea id="Methoden"></textarea>',
            '<button class="klasseaendern">Aendern</button>','<br/>',
            '<p><p/>',
            '<label id="Assoziation"></label>',
            '<textarea id="Assoziationsname"></textarea>',
            '<textarea id="KardinalitaetQuelle"></textarea>',
            '<textarea id="KardinalitaetZiel"></textarea>',
            '<button class="assoziationaendern">Aendern</button>','<br/>',
            '<p><p/>',
            '<label id="Zoom">Zoom:</label>','<span id="Range">100%</span>','<br/>',
            '<input id="Zoom" type="range" min="10" max="200" value="100" step="10" />',


            '</div>'
        ].join(''),

        initialize: function () {
            _.bindAll(this, 'updateBox');
            joint.dia.ElementView.prototype.initialize.apply(this, arguments);

            this.$box = $(_.template(this.template)());
            // Prevent paper from handling pointerdown.
            this.$box.find('textarea,select').on('mousedown click', function (evt) {
                evt.stopPropagation();
            });
            // This is an example of reacting on the input change and storing the input data in the cell model.
            this.$box.find('#Klassenname').on('change', _.bind(function (evt) {
                var tmpVal = $(evt.target).val();
                var textArray = tmpVal.split('\n');
                this.model.set('klassenName', textArray);


            }, this));
            this.$box.find('#Attribute').on('change', _.bind(function (evt) {
                var tmpVal = $(evt.target).val();
                var textArray = tmpVal.split('\n');
                this.model.set('attribute', textArray);

            }, this));
            this.$box.find('#Methoden').on('change', _.bind(function (evt) {
                            var tmpVal = $(evt.target).val();
                            var textArray = tmpVal.split('\n');
                this.model.set('methoden', textArray);

            }, this));


            this.$box.find('#Assoziationsname').on('change', _.bind(function (evt) {

                this.model.set('assoziationName', $(evt.target).val());

            }, this));
            this.$box.find('#KardinalitaetQuelle').on('change', _.bind(function (evt) {

                this.model.set('kardinalitaetQuelle', $(evt.target).val());

            }, this));
            this.$box.find('#KardinalitaetZiel').on('change', _.bind(function (evt) {

                this.model.set('kardinalitaetZiel', $(evt.target).val());

            },this));
            this.$box.find('#Zoom').on('change',_.bind(function (evt) {

                var val = $(evt.target).val();
                this.$box.find('span').text(val+'%');
                paper.scale(val/100, val/100);
                paper.fitToContent({allowNewOrigin:'negative'});

            } , this));







            this.$box.find('.klasseaendern').on('click', _.bind(function () {
                graph.getCell(this.model.get('bezugsklasse')).set('name', this.model.get('klassenName'));
                graph.getCell(this.model.get('bezugsklasse')).set('attributes', this.model.get('attribute'));
                graph.getCell(this.model.get('bezugsklasse')).set('methods', this.model.get('methoden'));
                serialize();
            }, this));

           this.$box.find('.assoziationaendern').on('click', _.bind(function(){
                               graph.getCell(this.model.get('bezugsAssoziation')).label(0,{attrs: {text:{text: this.model.get('assoziationName')}}});  //(0,{position: .5,attrs: {rect: { fill: 'white' },text: { fill: 'blue',text: this.model.get('assoziationName'),'font-size': 13,'font-family': 'Times New Roman'}}});
                               graph.getCell(this.model.get('bezugsAssoziation')).label(1,{attrs: {text:{text: this.model.get('kardinalitaetQuelle')}}}); //(1,{position: 0.1,attrs: {rect: { fill: 'white' },text: { fill: 'blue',text: this.model.get('kardinalitaetQuelle'),'font-size': 13,'font-family': 'Times New Roman'}}});
                               graph.getCell(this.model.get('bezugsAssoziation')).label(2,{attrs: {text:{text: this.model.get('kardinalitaetZiel')}}});  //(2,{position: 0.9,attrs: {rect: { fill: 'white' },text: { fill: 'blue',text: this.model.get('kardinalitaetZiel'),'font-size': 13,'font-family': 'Times New Roman'}}});
                               serialize();
                       }, this));

            // Update the box position whenever the underlying model changes.
            this.model.on('change', this.updateBox, this);
            // Remove the box when the model gets removed from the graph.
            this.model.on('remove', this.removeBox, this);

            this.updateBox();
        },
        render: function () {
            joint.dia.ElementView.prototype.render.apply(this, arguments);
            this.paper.$el.prepend(this.$box);
            this.updateBox();
            return this;
        },
        updateBox: function () {
            // Set the position and dimension of the box so that it covers the JointJS element.
            var bbox = this.model.getBBox();
            // Example of updating the HTML with a data stored in the cell model.
            this.$box.find('#Klasse').text(this.model.get('labelKlasse'));




            this.$box.find('#Klassenname').val(this.model.getLinedString('klassenName'));
            this.$box.find('#Attribute').val(this.model.getLinedString('attribute'));
            this.$box.find('#Methoden').val(this.model.getLinedString('methoden'));

            this.$box.find('#Assoziation').text(this.model.get('labelAssoziation'));

            this.$box.find('#Assoziationsname').val(this.model.get('assoziationName'));
            this.$box.find('#KardinalitaetQuelle').val(this.model.get('kardinalitaetQuelle'));
            this.$box.find('#KardinalitaetZiel').val(this.model.get('kardinalitaetZiel'));


            this.$box.css({
                width: bbox.width,
                height: bbox.height,
                left: bbox.x,
                top: bbox.y,
                transform: 'rotate(' + (this.model.get('angle') || 0) + 'deg)'
            });
        },
        getNewClass: function () {
            this.model.set('klassenName', graph.getCell(this.model.get('bezugsklasse')).get('name'));
            this.model.set('attribute', graph.getCell(this.model.get('bezugsklasse')).get('attributes'));
            this.model.set('methoden', graph.getCell(this.model.get('bezugsklasse')).get('methods'));
        },

        getNewAssociation: function () {
            this.model.set('assoziationName', graph.getCell(this.model.get('bezugsAssoziation')).label(0).attrs.text.text);
            this.model.set('kardinalitaetQuelle', graph.getCell(this.model.get('bezugsAssoziation')).label(1).attrs.text.text);
            this.model.set('kardinalitaetZiel', graph.getCell(this.model.get('bezugsAssoziation')).label(2).attrs.text.text);

        },

        removeBox: function (evt) {
            this.$box.remove();
        }


    });


}())




var propertyBox = new joint.shapes.html.Element({
    position: {x: 80, y: 80},
    size: {width: 170, height: 100},
    labelKlasse: 'Klasse bearbeiten',
    klassenName: 'Klassenname',
    attribute: 'Attribute',
    methoden: 'Methoden',
    bezugsklasse: 'undefined',
    labelAssoziation: 'Assoziation bearbeiten',
    assoziationName: 'Beschriftung',
    kardinalitaetQuelle: 'Kardinalitaet',
    kardinalitaetZiel: 'Kardinalitaet',
    bezugsAssoziation: 'undefined'
    //select: 'one'
});

uigraph.addCell(propertyBox);

var graph = new joint.dia.Graph();

var paper = new joint.dia.Paper({
    el: $('#paper'),
    width: window.innerWidth,
    height: window.innerHeight,
    gridSize: 1,
    model: graph
});

graph.on('change:position', function(cell, newPosition, opt) {
paper.fitToContent({allowNewOrigin:'negative'});

});


var uml = joint.shapes.uml;


// Initialize Firebase
var config = {
    apiKey: "AIzaSyB9oU1pamHZdx2QJXx3tGgdo2svnZ4sFuk",
    authDomain: "commuml-64817.firebaseapp.com",
    databaseURL: "https://commuml-64817.firebaseio.com",
    storageBucket: "commuml-64817.appspot.com",
    messagingSenderId: "320513362473"
};
firebase.initializeApp(config);

var database = firebase.database();

var uniqueID = document.getElementById("uniqeIdStore").value;
if (uniqueID.match(/[a-z]/i)) { // thymeleaf parameter was not defined, so we get a garbage value that contains letters
    uniqueID = new Date().getTime();
    var separator = (window.location.href.indexOf("?")===-1)?"?":"&";
    window.location.href = window.location.href + separator + "id=" + uniqueID;
}

document.getElementById("link").value = "localhost:8080/draw?id=" + uniqueID;




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
    r.label(0,{position: .5,attrs: {rect: { fill: 'white' },text: { fill: 'blue',text: '','font-size': 13,'font-family': 'Times New Roman'}}});
    r.label(1,{position: .1,attrs: {rect: { fill: 'white' },text: { fill: 'blue',text: '','font-size': 13,'font-family': 'Times New Roman'}}});
    r.label(2,{position: .9,attrs: {rect: { fill: 'white' },text: { fill: 'blue',text: '','font-size': 13,'font-family': 'Times New Roman'}}});
    graph.addCell(r);
});


paper.fitToContent({allowNewOrigin:'negative'});

updateDownloadLink('downloadButton',JSON.stringify(graph) , 'UML.json');

var createOffset = 0;
function addClassDiagram() {
    graph.addCell(new uml.Class({
        position: {x: 100+createOffset, y: 100+createOffset},
        size: {width: 180, height: 50},
        name: propertyBox.get('klassenName'),
        attributes: propertyBox.get('attribute'),
        methods: propertyBox.get('methoden'),
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
    createOffset = createOffset+10;
}

var relationClass;
var clicks = [];

paper.on('cell:pointerdown',
    function (cellView, evt, x, y) {

        if (isInDeleteMode) {
            cellView.model.remove();
            isInDeleteMode = false;
            setDeleteButtonColor();
        } else if (typeof relationClass != 'undefined') {
            if (typeof clicks[0] == 'undefined') {
                clicks[0] = cellView.model.id;
            } else if (cellView.model.id != clicks[0]) {
                clicks[1] = cellView.model.id;
                var newLink=new relationClass({source: {id: clicks[0]}, target: {id: clicks[1]}});
                newLink.label(0,{position: .5,attrs: {rect: { fill: 'white' },text: { fill: 'blue',text: propertyBox.get('assoziationName'),'font-size': 13,'font-family': 'Times New Roman'}}});
                newLink.label(1,{position: .1,attrs: {rect: { fill: 'white' },text: { fill: 'blue',text: propertyBox.get('kardinalitaetQuelle'),'font-size': 13,'font-family': 'Times New Roman'}}});
                newLink.label(2,{position: .9,attrs: {rect: { fill: 'white' },text: { fill: 'blue',text: propertyBox.get('kardinalitaetZiel'),'font-size': 13,'font-family': 'Times New Roman'}}});
                graph.addCell(newLink);
                clicks = [];
                relationClass = undefined;
            }
        }
        //var tempID = propertyBox.get('bezugsklasse');

        if (graph.getCell(cellView.model.id).isLink()) {
            propertyBox.set('bezugsAssoziation', cellView.model.id);
            uipaper.findViewByModel(propertyBox).getNewAssociation();
        } else {
            propertyBox.set('bezugsklasse', cellView.model.id);
            uipaper.findViewByModel(propertyBox).getNewClass();
        }





    }
);


paper.on('cell:pointerup',
    function (cellView, evt, x, y) {

        serialize();

}
);

database.ref().on('value', function(snapshot) {
    var jsonFromFirebase = snapshot.val()[uniqueID];
    if (typeof jsonFromFirebase != 'undefined') {
        deserialize(jsonFromFirebase);
    }




});


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

$("#uploadIMG" ).click(function () {
    $("#the-file-input").trigger('click');
});

$("#the-file-input").change(function() {


    upload(this.files[0]);
});


function upload(uploadedJson) {
    if (window.File && window.FileReader && window.FileList) {
    var reader = new FileReader();

    reader.onload = function(e) {
      deserialize(reader.result);
      serialize();
    }


    reader.readAsText(uploadedJson);

    } else {
        alert('The File APIs are not fully supported in this browser.');
    }
}


function updateDownloadLink(anchorSelector, str, fileName){

            var data = "text/json;charset=utf-8," + encodeURIComponent(str);
                var dlAnchor = document.getElementById(anchorSelector);
                dlAnchor.setAttribute("href", 'data:' + data);
                dlAnchor.setAttribute("download", fileName);


}



function deserialize(newJson) {

        graph.fromJSON(JSON.parse(newJson));
        updateDownloadLink('downloadButton', newJson, 'UML.json');
        paper.fitToContent({allowNewOrigin:'negative'});
}




function serialize() {
        var json = JSON.stringify(graph);
        var databaseObject = {};
        databaseObject[uniqueID] = json;
        database.ref().set(databaseObject);
}

