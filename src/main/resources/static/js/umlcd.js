var commuml_vers = 'ver_1.0';
var alternatives_Highlighting = true;

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

document.getElementById("link").value = window.location.href;

var uigraph = new joint.dia.Graph();

var uipaperWidth = 200;
var uipaperHeight = window.innerHeight-200;

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

            '<label id="Klasse"></label>',

            '<span></span>', '<br/>',

            '<button class="button farbe blau not_selected" id= "00BFFF" value="#32CBFF"></button>',
            '<button class="button farbe gelb not_selected" id= "F4D03F" value="#f5d452"></button>',
            '<button class="button farbe gruen not_selected" id = "A5DF00" value="#B5E135"></button>',
            '<button class="button farbe orange not_selected" id = "ff8450" value="#fe976a"></button>',


//            '<select onchange="this.className=this.options[this.selectedIndex].className" class="default" >',
//            '<option class="farbe"  selected="true" hidden>Farbe</option>',//style="display:none;"
//            '<option class="orange" value="#ff8450"></option>',
//            '<option class="gruen"  value="#A5DF00"></option>',
//            '<option class="gelb"   value="#FFFF00"></option>',
//            '<option class="blau"   value="#00BFFF"></option>',
//
//
//            '</select>',
            '<br/>',
            '<textarea id="Klassenname" placeholder="Klassenname"></textarea>',
            '<textarea id="Attribute" placeholder="Attribute"></textarea>',
            '<textarea id="Methoden" placeholder="Methoden"></textarea>',
            '<button class="button changer klasseaendern">Anpassen</button>','<br/>',
            '<p><p/>',
            '<label id="Assoziation"></label>',
            '<textarea id="Assoziationsname" placeholder="Assoziationsname"></textarea>',
            '<textarea id="KardinalitaetQuelle" placeholder="KardinalitaetQuelle"></textarea>',
            '<textarea id="KardinalitaetZiel" placeholder="KardinalitaetZiel"></textarea>',
            '<button class="button changer assoziationaendern">Anpassen</button>','<br/>',
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
//            this.$box.find('select').on('change', _.bind(function(evt) {
//                            this.model.set('select', $(evt.target).val());
//                        }, this));
//            this.$box.find('select').val(this.model.get('select'));

            this.$box.find('.farbe').on('click', _.bind(function (evt) {
//                           if ( $(evt.target).attr('id') != this.model.get('farbe')) {
                           this.model.set('farbePrimaer', "#" + $(evt.target).attr('id'));
                           this.model.set('farbeSekundaer', $(evt.target).val());
                           this.changeButtonColor("#" + $(evt.target).attr('id'));
                        }, this));

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
                this.$box.find('#Range').text(val+'%');
                paper.scale(val/100, val/100);
                paper.fitToContent({allowNewOrigin:'negative'});

            } , this));







            this.$box.find('.klasseaendern').on('click', _.bind(function () {
                if (existingCell(this.model.get('bezugsklasse'))) {
                graph.getCell(this.model.get('bezugsklasse')).set('name', this.model.get('klassenName'));
                graph.getCell(this.model.get('bezugsklasse')).set('attributes', this.model.get('attribute'));
                graph.getCell(this.model.get('bezugsklasse')).set('methods', this.model.get('methoden'));
                graph.getCell(this.model.get('bezugsklasse')).attr({'.uml-class-name-rect': {fill: this.model.get('farbePrimaer')}});
                graph.getCell(this.model.get('bezugsklasse')).attr({'.uml-class-attrs-rect, .uml-class-methods-rect': {fill: this.model.get('farbeSekundaer')}});

//                graph.getCell(this.model.get('bezugsklasse')).attr({'.uml-class-name-rect': {fill: this.model.get('select')}});
                serialize();}
            }, this));

           this.$box.find('.assoziationaendern').on('click', _.bind(function(){
                if (existingCell(this.model.get('bezugsAssoziation'))) {
                               graph.getCell(this.model.get('bezugsAssoziation')).label(0,{attrs: {text:{text: this.model.get('assoziationName')}}});  //(0,{position: .5,attrs: {rect: { fill: 'white' },text: { fill: 'blue',text: this.model.get('assoziationName'),'font-size': 13,'font-family': 'Times New Roman'}}});
                               graph.getCell(this.model.get('bezugsAssoziation')).label(1,{attrs: {text:{text: this.model.get('kardinalitaetQuelle')}}}); //(1,{position: 0.1,attrs: {rect: { fill: 'white' },text: { fill: 'blue',text: this.model.get('kardinalitaetQuelle'),'font-size': 13,'font-family': 'Times New Roman'}}});
                               graph.getCell(this.model.get('bezugsAssoziation')).label(2,{attrs: {text:{text: this.model.get('kardinalitaetZiel')}}});  //(2,{position: 0.9,attrs: {rect: { fill: 'white' },text: { fill: 'blue',text: this.model.get('kardinalitaetZiel'),'font-size': 13,'font-family': 'Times New Roman'}}});
                               serialize();}
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

//            this.$box.find('select').val(this.model.get('select'));

            this.changeButtonColor(this.model.get('farbePrimaer'));
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

        changeButtonColor: function (buttonID) {
                this.$box.find('.farbe').addClass("not_selected");
                var elem = this.$box.find(buttonID);
                elem.removeClass("not_selected");           //css( "background-color", "white" );                  //.style.backgroundColor("white");
//                $(buttonID).style.background-color= $(buttonID).val();

//                this.$box.find(buttonID).addClass(this.$box.find(buttonID) + "-selected");              //css( "background-color", this.$box.find(buttonID).val());


        },

        getNewClass: function () {


            this.model.set('klassenName', graph.getCell(this.model.get('bezugsklasse')).get('name'));
            this.model.set('attribute', graph.getCell(this.model.get('bezugsklasse')).get('attributes'));
            this.model.set('methoden', graph.getCell(this.model.get('bezugsklasse')).get('methods'));
//            this.model.set('select', graph.getCell(this.model.get('bezugsklasse')).get('select'));
            this.model.set('farbePrimaer', graph.getCell(this.model.get('bezugsklasse')).attr('.uml-class-name-rect/fill'));
            var klasse = graph.getCell(this.model.get('bezugsklasse'));

            this.model.set('farbeSekundaer', graph.getCell(this.model.get('bezugsklasse')).attr('.uml-class-attrs-rect, .uml-class-methods-rect/fill'));
        },

        getNewAssociation: function () {


            this.model.set('assoziationName', graph.getCell(this.model.get('bezugsAssoziation')).label(0).attrs.text.text);
            this.model.set('kardinalitaetQuelle', graph.getCell(this.model.get('bezugsAssoziation')).label(1).attrs.text.text);
            this.model.set('kardinalitaetZiel', graph.getCell(this.model.get('bezugsAssoziation')).label(2).attrs.text.text);

        },

        resetSelection: function() {
                propertyBox.set('bezugsAssoziation', 'undefined');
                propertyBox.set('bezugsklasse', 'undefined');

                this.model.set('assoziationName','');
                this.model.set('kardinalitaetQuelle','');
                this.model.set('kardinalitaetZiel','');
                this.model.set('klassenName','');
                this.model.set('attribute','');
                this.model.set('methoden','');
                this.model.set('farbePrimaer', '#ff8450');
                this.model.set('farbeSekundaer', '#fe976a');
//                this.model.set('select', 'Farbe');
//                this.$box.find('select').className='farbe';

        },

        removeBox: function (evt) {
            this.$box.remove();
        }


    });


}())




var propertyBox = new joint.shapes.html.Element({
    position: {x: 0, y: 0},
    size: {width: 200, height: 500},
    labelKlasse: 'Klasse bearbeiten',
    klassenName: '',
    attribute: '',
    methoden: '',
    bezugsklasse: 'undefined',
    labelAssoziation: 'Assoziation bearbeiten',
    assoziationName: '',
    kardinalitaetQuelle: '',
    kardinalitaetZiel: '',
    bezugsAssoziation: 'undefined',
    farbePrimaer: '#ff8450',
    farbeSekundaer: '#fe976a'
});

uigraph.addCell(propertyBox);

var graph = new joint.dia.Graph();

var paper = new joint.dia.Paper({
    el: $('#paper'),
    width: window.innerWidth,
    height: window.innerHeight,
    gridSize: 1,
//    drawGrid: true,
    model: graph,

        interactive: function(cellView) {
            if (cellView.model instanceof joint.dia.Link) {
                // Disable the default vertex add functionality on pointerdown.
                return { vertexAdd: false };
            }
            return true;
        },

        linkView: joint.dia.LinkView.extend({
                pointerdblclick: function(evt, x, y) {
                    if (V(evt.target).hasClass('connection') || V(evt.target).hasClass('connection-wrap')) {
                        this.addVertex({ x: x, y: y });
                    }
                }
            })
});

graph.on('change:position', function(cell, newPosition, opt) {
paper.fitToContent({allowNewOrigin:'negative'});


});


var uml = joint.shapes.uml;







var classes = {

    mammal: new uml.Class({
        position: {x: 300, y: 50},
        size: {width: 240, height: 100},
        name: ['<<Interface>>','Mammal'],
        attributes: ['dob: Date'],
        methods: ['+ setDateOfBirth(dob: Date): Void', '+ getAgeAsDays(): Numeric'],
        attrs: {
            '.uml-class-name-rect': {
                fill: '#F4D03F',
                stroke: '#ffffff',
                'stroke-width': 0.5
            },
            '.uml-class-attrs-rect, .uml-class-methods-rect': {
                fill: '#f5d452',
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

    person: new uml.Class({
        position: {x: 300, y: 300},
        size: {width: 260, height: 100},
        name: ['<<Abstract>>','Person'],
        attributes: ['firstName: String', 'lastName: String'],
        methods: ['+ setName(first: String, last: String): Void', '+ getName(): String'],
        attrs: {
            '.uml-class-name-rect': {
                fill: '#00BFFF',
                stroke: '#ffffff',
                'stroke-width': 0.5
            },
            '.uml-class-attrs-rect, .uml-class-methods-rect': {
                fill: '#32CBFF',
                stroke: '#fff',
                'stroke-width': 0.5
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
var string = 'UML.';
    string+= commuml_vers;
    string+= '.json';
updateDownloadLink('downloadButton',JSON.stringify(graph) , string);

var createOffset = 0;

function clearModes() {
isInDeleteMode = false;
isInRelationMode = false;
relationClass = [];
setButtonColor(undefined);
}

function addClassDiagram() {
    clearModes();
    graph.addCell(new uml.Class({
        position: {x: 100+createOffset, y: 100+createOffset},
        size: {width: 180, height: 50},
        name: propertyBox.get('klassenName'),
        attributes: propertyBox.get('attribute'),
        methods: propertyBox.get('methoden'),
        attrs: {
            '.uml-class-name-rect': {
                fill: propertyBox.get('farbePrimaer'),
                stroke: '#fff',
                'stroke-width': 0.5
            },
            '.uml-class-attrs-rect, .uml-class-methods-rect': {
                fill: propertyBox.get('farbeSekundaer'),
                stroke: '#fff',
                'stroke-width': 0.5
            }
        }
    }))
    createOffset = (createOffset+10)%100;
    serialize();

}

var relationClass;
var clicks = [];
var currentSelected=undefined;

paper.on('cell:pointerdown',
    function (cellView, evt, x, y) {
    unhighlight();
        currentSelected = cellView.model.id;
        highlightCurrentSelected();


        if (isInDeleteMode) {
//            cellView.model.remove();
            graph.getCell(cellView.model.id).remove();
            isInDeleteMode = false;
            currentSelected=undefined;
            setButtonColor(undefined);
            //serialize();
        }
        else if (isInRelationMode) {
            if (typeof clicks[0] == 'undefined') {
                clicks[0] = cellView.model.id;
            } else if (cellView.model.id != clicks[0]) {
                clicks[1] = cellView.model.id;
                var newLink=new relationClass[0]({source: {id: clicks[0]}, target: {id: clicks[1]}});
                newLink.label(0,{position: .5,attrs: {rect: { fill: 'white' },text: { fill: 'blue',text: propertyBox.get('assoziationName'),'font-size': 13,'font-family': 'Times New Roman'}}});
                newLink.label(1,{position: .1,attrs: {rect: { fill: 'white' },text: { fill: 'blue',text: propertyBox.get('kardinalitaetQuelle'),'font-size': 13,'font-family': 'Times New Roman'}}});
                newLink.label(2,{position: .9,attrs: {rect: { fill: 'white' },text: { fill: 'blue',text: propertyBox.get('kardinalitaetZiel'),'font-size': 13,'font-family': 'Times New Roman'}}});
                graph.addCell(newLink);
                clicks = [];
                relationClass = undefined;

                isInRelationMode = false;
                setButtonColor(undefined);
            }
        } else


        if (graph.getCell(cellView.model.id).isLink()) {
           uipaper.findViewByModel(propertyBox).resetSelection();
            propertyBox.set('bezugsAssoziation', cellView.model.id);
            uipaper.findViewByModel(propertyBox).getNewAssociation();
        } else {
            uipaper.findViewByModel(propertyBox).resetSelection();
            propertyBox.set('bezugsklasse', cellView.model.id);
            uipaper.findViewByModel(propertyBox).getNewClass();
        }





    }
);



paper.on('blank:pointerclick', function () {

    uipaper.findViewByModel(propertyBox).resetSelection();


    relationClass=undefined;
    clicks = [];
    isInRelationMode = false;
    setButtonColor(undefined);
    unhighlight();
    currentSelected=undefined;
    isInDeleteMode = false;
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
    relationClass = [uml.Generalization,"vererbung"];
    relationMode("vererbung")
}
function addDirectedAssociation() {
    clicks = [];
    relationClass = [uml.Transition,"gerichtete_assoziation"];
    relationMode("gerichtete_Assoziation")
}
function addUndirectedAssociation() {
    clicks = [];
    relationClass = [uml.Association,"ungerichtete_assoziation"];
    relationMode("ungerichtete_Assoziation")
}
function addAggregation() {
    clicks = [];
    relationClass = [uml.Aggregation,"aggregation"];
    relationMode("aggregation")
}
function addComposition() {
    clicks = [];
    relationClass = [uml.Composition,"komposition"];
    relationMode("komposition")
}

var isInDeleteMode = false;

var isInRelationMode = false;

function deleteMode() {
    relationClass = undefined;
    isInRelationMode = false;
    isInDeleteMode = !isInDeleteMode;
    setButtonColor("delete");
}

function relationMode(relationButton) {
    isInDeleteMode = false;
    var buttonRM = relationButton;
    isInRelationMode = true;
    setButtonColor(buttonRM);
}


var prevButton=undefined;
function setButtonColor(buttonIdentifier) {

    if(typeof buttonIdentifier != 'undefined') {
    document.getElementById(buttonIdentifier).style.backgroundColor = "#533";}


    if (typeof prevButton != 'undefined') {
    document.getElementById(prevButton).style.backgroundColor = "#333";
    }

    prevButton = buttonIdentifier;




//    if (isInDeleteMode) {
//        property.style.backgroundColor = "#533";
//    } else {
//        property.style.backgroundColor = "#333";
//    }
}

function share() {
    clearModes();
    var shareLink = document.getElementById("link");
    shareLink.select();

    try {
        var successful = document.execCommand('copy');
        var msg = successful ? 'successful' : 'unsuccessful';
        console.log('Copying text command was ' + msg);
      } catch (err) {
        console.log('Oops, unable to copy');
      }

}

$("#uploadIMG" ).click(function () {
    $("#the-file-input").trigger('click');
});

$("#the-file-input").change(function() {


    upload(this.files[0]);
});


function upload(uploadedJson) {
    clearModes();
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
        updateDownloadLink('downloadButton', newJson, string);
        paper.fitToContent({allowNewOrigin:'negative'});
        highlightCurrentSelected();

}




function serialize() {
        var json = JSON.stringify(graph);
        var databaseObject = {};
        databaseObject[uniqueID] = json;
        database.ref().set(databaseObject);
//        highlightCurrentSelected();
}

function existingCell(id) {
    if (typeof graph.getCell(id)!='undefined') {
        return true;}
    else {
        return false;}
}

function highlightCurrentSelected() {
    if (alternatives_Highlighting) {
        if (existingCell(currentSelected)) {
        var cells = graph.getCells();

        for (i=0; i<cells.length; i++) {
        if (cells[i].id!= currentSelected){
        paper.findViewByModel(cells[i]).highlight(null,{highlighter: {name: 'opacity'}});
        }
        }




                                            }
                                            } else {
                                                if (existingCell(currentSelected)) {
                                                                paper.findViewByModel(graph.getCell(currentSelected)).highlight(null,{
                                                                                            highlighter: {
                                                                                                name: 'opacity'
                                                                                            }
                                                                                        });
                                                                                        }
                                            }

}

function unhighlight() {


if (alternatives_Highlighting) {
    var cells = graph.getCells();

            for (i=0; i<cells.length; i++) {
            paper.findViewByModel(cells[i]).unhighlight(null,{highlighter: {name: 'opacity'} } );
            }
            } else {
            if (existingCell(currentSelected)) {
                    paper.findViewByModel(graph.getCell(currentSelected)).unhighlight(null,{
                                                                                     highlighter: {
                                                                                         name: 'opacity'
                                                                                     }
                                                                                 } );
                  }
            }



}

