/* The following code creates the UML-Diagram and the PropertyBox (for editing purposes) as seen in the Users browser
 and provides the logic for reacting to the Users interaction with the Diagram, the PropertyBox and the Toolbar.
  It does so by also making use of the JointJS library. For better understanding refer to the JointJS API under: http://resources.jointjs.com/docs/jointjs/v1.0/joint.html
*/

//All the globally used Variables:

var database; //The underlying database for synchronizing sessions
var uniqueID; //Holds the ID used to refer to the current sessions database entry
var commuml_vers = 'ver_1.0'; //Current Version of commUML. Will be appended to downloaded saveFile.
var downloadFileName = 'UML.'; //Filename for the downloaded JSON-representation of the diagram
downloadFileName+= commuml_vers;
downloadFileName+= '.json';
var alternatives_Highlighting = true; //Toogle this for selecting the highlighting mode. If false, the selected Item on the Paper will be greyed out instead of the other way around.
var uigraph; //Holds the UIGraph for the PropertyBox
var uipaper; //Holds the UIPaper for the PropertyBox
var propertyBox; //Holds the PropertyBox instance
var graph; //Holds the Graph for the Diagram
var paper; //Holds the Paper for the Diagram
var uml = joint.shapes.uml; //Shortcut to JointJS' uml-shapes
var createOffset = 0; //The offset used everytime a new class is added to the Diagram
var relationClass; //Holds the current assoziation type (selected through the toolbar)
var currentSelected=undefined; //Holds the ID of the currently selected diagram element
var isInDeleteMode = false; //Boolean flag indicating the DeleteMode being active
var isInRelationMode = false; //Boolean flag indicating the RelationMode being active
var prevButton = undefined; //Holds the id-value of the last clicked editing-mode-buttons (delete-button or any addAssoziation-button)

//Initialize Firebase
firebase.initializeApp( {
                        		apiKey: "AIzaSyB9oU1pamHZdx2QJXx3tGgdo2svnZ4sFuk",
                        		authDomain: "commuml-64817.firebaseapp.com",
                        		databaseURL: "https://commuml-64817.firebaseio.com",
                        		storageBucket: "commuml-64817.appspot.com",
                        		messagingSenderId: "320513362473"
                        } );

database = firebase.database();

//Create a unique session id (based on current time).  Gets appended to the current pages href and will be used as reference-key to the database.
(function () {

uniqueID = document.getElementById( "uniqeIdStore" ).value;
if (uniqueID.match(/[a-z]/i)) { // thymeleaf parameter was not defined, so we get a garbage value that contains letters
	uniqueID = new Date().getTime();
	var newLinkSeparator = ( window.location.href.indexOf( "?" ) === -1 ) ? "?" : "&";
	window.location.href = window.location.href + newLinkSeparator + "id=" + uniqueID;
}

//Upate the Toolbars share-link-window with the new href
document.getElementById( "link" ).value = window.location.href;
})();




//Initializing separate Graph and Paper background for the PropertyBox
uigraph = new joint.dia.Graph();

uipaper = new joint.dia.Paper( {
	el: $( '#uipaper' ),
	width: 200,
	height: window.innerHeight-200,
	gridSize: 1,
	model: uigraph
});


//Creates a custom shape and element view of the PropertyBox. The PropertyBox enables the User to manipulate the Diagrams elements.
( function () {
    // Adding a custom element to the jointJS' predefined shapes:
	joint.shapes.html = {};
	joint.shapes.html.Element = joint.shapes.basic.Rect.extend( {
		defaults: joint.util.deepSupplement( {
			type: 'html.Element',
			attrs: {
				rect: {stroke: 'none','fill-opacity': 0}
			}
		}, joint.shapes.basic.Rect.prototype.defaults ),

		getLinedString: function( attribut ) {
			var text="";
			var array=this.get( attribut );
			if ( typeof array==='string') {
				return array;}

			for (var i = 0; i < array.length; i++) {

				text = text+array[i];
				if ( i<array.length-1 ) {
					text = text+'\n';}
			}
			return text;
		}
	});

//	Creating a Custom View for this new custom element:
	joint.shapes.html.ElementView = joint.dia.ElementView.extend({

		//Defining the HTML-Structure of the PropertyBox
		template: [
			'<div class= "html-element" >',

			'<label id= "Klasse" ></label>',

			'<span></span>', '<br/>',

			'<button class= "button farbe blau not_selected" id= "00BFFF" value= "#32CBFF" ></button>',
			'<button class= "button farbe gelb not_selected" id= "F4D03F" value= "#f5d452" ></button>',
			'<button class= "button farbe gruen not_selected" id = "A5DF00" value= "#B5E135" ></button>',
			'<button class= "button farbe orange not_selected" id = "ff8450" value= "#fe976a" ></button>',
			'<br/>',

			'<textarea id= "Klassenname" placeholder= "Klassenname" ></textarea>',
			'<textarea id= "Attribute" placeholder= "Attribute" ></textarea>',
			'<textarea id= "Methoden" placeholder= "Methoden" ></textarea>',
			'<button class= "button changer klasseaendern" >Anpassen</button>','<br/>',

			'<p><p/>',

			'<label id= "Assoziation" ></label>',

			'<textarea id= "Assoziationsname" placeholder= "Assoziationsname" ></textarea>',
			'<textarea id= "KardinalitaetQuelle" placeholder= "KardinalitaetQuelle" ></textarea>',
			'<textarea id= "KardinalitaetZiel" placeholder= "KardinalitaetZiel" ></textarea>',
			'<button class= "button changer assoziationaendern" >Anpassen</button>','<br/>',

			'<p><p/>',

			'<label id= "Zoom" >Zoom:</label>','<span id= "Range" >100%</span>','<br/>',

			'<input id= "Zoom" type= "range" min= "10" max= "200" value= "100" step= "10" />',

			'</div>'
			].join(''),

			//On Initialize several listeners will be set up, that react to the Users changes on the Box' interactive elements
			//and store the inputdata
			initialize: function () {

				_.bindAll( this, 'updateBox' );
				joint.dia.ElementView.prototype.initialize.apply( this, arguments );

				this.$box = $(_.template( this.template )() );
				// Prevent paper from handling pointerdown.
				this.$box.find( 'textarea,select' ).on( 'mousedown click' , function ( evt ) {
					evt.stopPropagation();
				});

				// Reacting on the input change and storing the input data in the cell model.

				//Reacts to clicking a color-button and stores the chosen color (with a related secondary color)
				this.$box.find( '.farbe' ).on( 'click' , _.bind( function ( evt ) {
					this.model.set( 'farbePrimaer' , "#" + $( evt.target ).attr( 'id' ) );
					this.model.set( 'farbeSekundaer' , $( evt.target ).val() );
					this.changeButtonColor( "#" + $( evt.target ).attr( 'id' ) );
				}, this ) );

				this.$box.find( '#Klassenname' ).on( 'change' , _.bind( function ( evt ) {
					var tmpVal = $( evt.target ).val();
					var textArray = tmpVal.split( '\n' );
					this.model.set( 'klassenName' , textArray);
				}, this ) );

				this.$box.find( '#Attribute' ).on( 'change' , _.bind( function ( evt ) {
					var tmpVal = $( evt.target ).val();
					var textArray = tmpVal.split( '\n' );
					this.model.set( 'attribute' , textArray );
				}, this ) );

				this.$box.find( '#Methoden' ).on( 'change' , _.bind( function ( evt ) {
					var tmpVal = $( evt.target ).val();
					var textArray = tmpVal.split( '\n' );
					this.model.set( 'methoden' , textArray );
				}, this ) );

				this.$box.find( '#Assoziationsname' ).on( 'change' , _.bind( function ( evt ) {
					this.model.set( 'assoziationName' , $( evt.target ).val() );
				}, this ) );

				this.$box.find( '#KardinalitaetQuelle' ).on( 'change' , _.bind( function ( evt ) {
					this.model.set( 'kardinalitaetQuelle' , $( evt.target ).val() );
				}, this ) );

				this.$box.find( '#KardinalitaetZiel' ).on( 'change' , _.bind( function ( evt ) {
					this.model.set( 'kardinalitaetZiel' , $( evt.target ).val() );
				},this ) );

				//Resizes the whole drawing-paper according to new zoom-level
				this.$box.find( '#Zoom' ).on( 'change' , _.bind( function ( evt ) {
					var val = $( evt.target ).val();
					this.$box.find( '#Range' ).text( val + '%' );
					paper.scale( val/100 , val/100 );
					paper.fitToContent( { allowNewOrigin: 'negative' } );
				} , this ) );

				// When clicked, the selected class-element on the paper will have its name, attributes, methods and color changed based on the User input since selecting the element
				this.$box.find( '.klasseaendern' ).on( 'click' , _.bind( function () {
					if ( existingCell( this.model.get( 'bezugsklasse' ) ) ) {
						var relClass =  graph.getCell( this.model.get( 'bezugsklasse' ) );
						relClass.set( 'name' , this.model.get( 'klassenName' ) );
						relClass.set( 'attributes' , this.model.get( 'attribute' ) );
						relClass.set( 'methods' , this.model.get( 'methoden' ) );
						relClass.attr( { '.uml-class-name-rect': { fill: this.model.get( 'farbePrimaer' ) } } );
						relClass.attr( { '.uml-class-attrs-rect, .uml-class-methods-rect': { fill: this.model.get( 'farbeSekundaer' ) } } );
						serialize();
					}
				} , this ) );

				// When clicked, the selected assoziation-element on the paper will have its name and cardinalities changed based on the User input since selecting the element
				this.$box.find( '.assoziationaendern' ).on( 'click' , _.bind( function() {
					if ( existingCell( this.model.get( 'bezugsAssoziation' ) ) ) {
						var relAss = graph.getCell(this.model.get('bezugsAssoziation'));
						relAss.label( 0 , { attrs: { text: { text: this.model.get( 'assoziationName' ) } } } );
						relAss.label( 1 , { attrs: { text: { text: this.model.get( 'kardinalitaetQuelle' ) } } } );
						relAss.label( 2 , { attrs: { text: { text: this.model.get( 'kardinalitaetZiel' ) } } } );
						serialize();
					}
				}, this ) );

				// Update the box position whenever the underlying model changes.
				this.model.on('change', this.updateBox, this);
				// Remove the box when the model gets removed from the graph.
				this.model.on('remove', this.removeBox, this);

				//Update the HTML-Elements with the initial data
				this.updateBox();
			},

			render: function () {
				//Rendering the PropertyBox' view
				joint.dia.ElementView.prototype.render.apply( this , arguments );
				this.paper.$el.prepend( this.$box );
				this.updateBox();
				return this;
			},

			updateBox: function () {
				//Updates the Box' HTML-Elements with the data stored in the Box' underlying cell
                // This will be called automatically everytime a change to the Box' underlying cells data is made!


				// Set the position and dimension of the box so that it covers the
				// JointJS element.
				var bbox = this.model.getBBox();

				// Updating the HTML with a data stored in the cell model.
				this.$box.find('#Klasse').text(this.model.get('labelKlasse'));

				this.changeButtonColor(this.model.get('farbePrimaer'));
				this.$box.find('#Klassenname').val(this.model.getLinedString('klassenName'));
				this.$box.find('#Attribute').val(this.model.getLinedString('attribute'));
				this.$box.find('#Methoden').val(this.model.getLinedString('methoden'));

				this.$box.find('#Assoziation').text(this.model.get('labelAssoziation'));

				this.$box.find('#Assoziationsname').val(this.model.get('assoziationName'));
				this.$box.find('#KardinalitaetQuelle').val(this.model.get('kardinalitaetQuelle'));
				this.$box.find('#KardinalitaetZiel').val(this.model.get('kardinalitaetZiel'));

				//Updating the Box' CSS-Style
				this.$box.css({
					width: bbox.width,
					height: bbox.height,
					left: bbox.x,
					top: bbox.y,
					transform: 'rotate(' + (this.model.get('angle') || 0) + 'deg)'
				});
			},

			changeButtonColor: function ( buttonID ) {
				//Change the selected color-buttons style
				this.$box.find( '.farbe' ).addClass( "not_selected" );
				var elem = this.$box.find( buttonID );
				elem.removeClass( "not_selected" );

			},

			getNewClass: function () {
				//Extracts and stores a class-elements name, attributes, methodes and color based on the elements id stored in 'bezugsklasse'.
				var newClass = graph.getCell( this.model.get( 'bezugsklasse' ) );

				this.model.set( 'klassenName' , newClass.get( 'name' ) );
				this.model.set( 'attribute' , newClass.get( 'attributes' ) );
				this.model.set( 'methoden' , newClass.get( 'methods' ) );
				this.model.set( 'farbePrimaer' , newClass.attr( '.uml-class-name-rect/fill' ) );
				this.model.set( 'farbeSekundaer' , newClass.attr( '.uml-class-attrs-rect, .uml-class-methods-rect/fill' ) );

			},

			getNewAssociation: function () {
				//Extracts and stores an assoziation-elements name and cardinalities based on the elements id stored in 'bezugsAssoziation'.
				var newAssoziation = graph.getCell( this.model.get( 'bezugsAssoziation' ) );

				this.model.set( 'assoziationName' , newAssoziation.label( 0 ).attrs.text.text );
				this.model.set( 'kardinalitaetQuelle' , newAssoziation.label( 1 ).attrs.text.text );
				this.model.set( 'kardinalitaetZiel' , newAssoziation.label( 2 ).attrs.text.text );

			},

			resetSelection: function() {
				//Resets the Box' cell-data to default values
				propertyBox.set( 'bezugsAssoziation' , 'undefined' );
				propertyBox.set( 'bezugsklasse' , 'undefined' );

				this.model.set( 'assoziationName' , '');
				this.model.set( 'kardinalitaetQuelle' , '');
				this.model.set( 'kardinalitaetZiel' , '');
				this.model.set( 'klassenName' , '');
				this.model.set( 'attribute' , '');
				this.model.set( 'methoden' , '');
				this.model.set( 'farbePrimaer' , '#ff8450');
				this.model.set( 'farbeSekundaer' , '#fe976a');
			},

			removeBox: function (evt) {
				this.$box.remove();
			}


	});


})();


//Create the PropertyBox
var propertyBox = new joint.shapes.html.Element({
	position: { x: 0 , y: 0 },
	size: { width: 200 , height: 500 },
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

uigraph.addCell( propertyBox );






//Creating the Diagrams underlying graph and drawing paper

graph = new joint.dia.Graph();

paper = new joint.dia.Paper( {
	el: $( '#paper' ),
	width: window.innerWidth,
	height: window.innerHeight,
	gridSize: 1,
	model: graph,

	// Disable the default vertex add functionality for Links on pointerdown.
	interactive: function( cellView ) {
		if ( cellView.model instanceof joint.dia.Link ) {
			return { vertexAdd: false };
		}
		return true;
	},

	//Enable creating Vertices for Links on DoubleClick
	linkView: joint.dia.LinkView.extend( {
		pointerdblclick: function( evt , x , y) {
			if ( V( evt.target ).hasClass( 'connection' ) || V( evt.target ).hasClass( 'connection-wrap' ) ) {
				this.addVertex( { x: x , y: y });
			}
		}
	})
});

//Populating the new Diagram with some default elements
(function () {

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
	graph.addCell( c );
});

var relations = [
	new uml.Generalization( { source: { id: classes.man.id } , target: { id: classes.person.id } } ),
	new uml.Generalization( { source: { id: classes.woman.id } , target: { id: classes.person.id } } ),
	new uml.Implementation( { source: { id: classes.person.id } , target: { id: classes.mammal.id } } ),
	new uml.Aggregation( { source: { id: classes.person.id }, target: { id: classes.address.id } } ),
	new uml.Composition( { source: { id: classes.person.id }, target: { id: classes.bloodgroup.id } } )
	];

_.each( relations , function ( r ) {
	r.label( 0 , { position: .5,attrs: {rect: { fill: 'white' },text: { fill: 'blue',text: '','font-size': 13,'font-family': 'Times New Roman' } } } );
	r.label( 1 , { position: .1,attrs: {rect: { fill: 'white' },text: { fill: 'blue',text: '','font-size': 13,'font-family': 'Times New Roman' } } } );
	r.label( 2 , { position: .9,attrs: {rect: { fill: 'white' },text: { fill: 'blue',text: '','font-size': 13,'font-family': 'Times New Roman' } } } );
	graph.addCell( r );
});

paper.fitToContent( { allowNewOrigin: 'negative' } );
})();

//Updating the download-links href to the diagrams initial current JSON-Representation
(function () {
updateDownloadLink( 'downloadButton' , JSON.stringify( graph ) );
})();



//Listeners for  clicking/dragging of elements in the diagram
//Enabling the Papers size to automatically adjust when elements are moved beyond the papers current borders
graph.on( 'change:position' , function(cell , newPosition , opt ) {
	paper.fitToContent( { allowNewOrigin: 'negative' } );
});


//Reaction to the User clicking in any of the Diagrams elements. Reacts differently, depending if in delete- or relation mode or none of the above
paper.on( 'cell:pointerdown' , function ( cellView , evt , x , y) {

    //If in DeleteMode, deletes the clicked Element
	if ( isInDeleteMode ) {
		graph.getCell( cellView.model.id ).remove();
		isInDeleteMode = false;
		setButtonColor( undefined );
	}

	//If in RelationMode, stores the first selected Element in 'currentSelected'. If a second element has been clicked, creates the appropriate Relation (type based on User selection)
	else if ( isInRelationMode ) {
		if ( typeof currentSelected == 'undefined' ) {
			currentSelected = cellView.model.id;
            highlightCurrentSelected();
		} else  {
			var assoziationTarget = cellView.model.id;
			var newLink = new relationClass( {source: { id: currentSelected }, target: { id: assoziationTarget } } );
			newLink.label( 0 , { position: .5 , attrs: { rect: { fill: 'white' } , text: { fill: 'blue' , text: propertyBox.get( 'assoziationName' ) , 'font-size': 13 , 'font-family': 'Times New Roman' } } } );
			newLink.label( 1 , { position: .1 , attrs: { rect: { fill: 'white' }  ,text: { fill: 'blue' , text: propertyBox.get( 'kardinalitaetQuelle' ) , 'font-size': 13 , 'font-family': 'Times New Roman' } } } );
			newLink.label( 2 , { position: .9 , attrs: { rect: { fill: 'white' } , text: { fill: 'blue' , text: propertyBox.get( 'kardinalitaetZiel' ) , 'font-size': 13 , 'font-family': 'Times New Roman' } } } );
			graph.addCell( newLink );
			currentSelected = undefined;
			unhighlight();
			relationClass = undefined;
			isInRelationMode = false;
			setButtonColor( undefined );
		}
	}
	//If none of the above modes was enabled, the clicked element will be highlighted and become the property box' new focus
	else {
	    unhighlight();
        currentSelected = cellView.model.id;
        highlightCurrentSelected();

		if ( graph.getCell( cellView.model.id ).isLink() ) {
			uipaper.findViewByModel( propertyBox ).resetSelection();
			propertyBox.set( 'bezugsAssoziation' , cellView.model.id );
			uipaper.findViewByModel( propertyBox ).getNewAssociation();
		} else {
			uipaper.findViewByModel( propertyBox ).resetSelection();
			propertyBox.set( 'bezugsklasse' , cellView.model.id );
			uipaper.findViewByModel( propertyBox ).getNewClass();
		}
	}

});


//Reaction to the User clicking whitespace in the Diagram. Resets any editing modes and the Property Box' to its default state
paper.on( 'blank:pointerclick' , function () {

	uipaper.findViewByModel( propertyBox ).resetSelection();
	relationClass=undefined;
	isInRelationMode = false;
	setButtonColor( undefined );
	unhighlight();
	currentSelected=undefined;
	isInDeleteMode = false;

});


//When the User releases a mouseclick on any Diagram element, the sessions underlying database entry gets updated. This is done separately via 'pointerup', so a dragging operation will fire this function only once at the end of dragging.
paper.on( 'cell:pointerup' , function ( cellView , evt , x , y) {
	serialize();
});


//Listens to changes to the sessions underlying database and updates the Diagram accordingly.
database.ref().on( 'value' , function( snapshot ) {
	var jsonFromFirebase = snapshot.val()[uniqueID];
	if ( typeof jsonFromFirebase != 'undefined' ) {
		deserialize( jsonFromFirebase );
	}

});


//Forwards a click on the toolbars 'upload'-button to the file-input, triggering the browsers own file-upload-functionality
$( "#uploadIMG" ).click(
		function () {
			$( "#the-file-input" ).trigger( 'click' );
		}
);


//Listens to file-upload and updates the Diagram via upload( file )
$("#the-file-input").change(
		function() {
			upload( this.files[0] );
		}
);






//Disables current editing mode (adding assoziation or deleting element)
function clearModes() {

	isInDeleteMode = false;
	isInRelationMode = false;
	relationClass = undefined;
	setButtonColor( undefined );

}


//Adds new ClassElement to the Diagram
function addClassDiagram() {

	clearModes();
	graph.addCell( new uml.Class( {
		position: { x: 100+createOffset , y: 100+createOffset },
		size: { width: 180 , height: 50},
		name: propertyBox.get( 'klassenName' ),
		attributes: propertyBox.get( 'attribute' ),
		methods: propertyBox.get( 'methoden' ),
		attrs: {
			'.uml-class-name-rect': {
				fill: propertyBox.get( 'farbePrimaer' ),
				stroke: '#fff',
				'stroke-width': 0.5
			},
			'.uml-class-attrs-rect, .uml-class-methods-rect': {
				fill: propertyBox.get( 'farbeSekundaer' ),
				stroke: '#fff',
				'stroke-width': 0.5
			}
		}
	}))
	createOffset = ( createOffset + 10 ) % 100;
	serialize();

}


//These function are used whenever one of the toolbars assoziation buttons gets clicked
function addInheritance() {


	relationClass = uml.Generalization;
	relationMode( "vererbung" );

}
function addDirectedAssociation() {


	relationClass = uml.Transition;
	relationMode( "gerichtete_Assoziation" );

}
function addUndirectedAssociation() {


	relationClass = uml.Association;
	relationMode( "ungerichtete_Assoziation" );

}
function addAggregation() {


	relationClass = uml.Aggregation;
	relationMode( "aggregation" );

}
function addComposition() {


	relationClass = uml.Composition;
	relationMode( "komposition" );

}


//Is used when the User clicks the delete button in the toolbar
function deleteMode() {
    unhighlight();
    currentSelected = undefined;
	relationClass = undefined;
	isInRelationMode = false;
	isInDeleteMode = !isInDeleteMode;
	setButtonColor( "delete" );

}


//General method that is used by any function adding relations to the diagram
function relationMode( relationButton ) {
    unhighlight();
    currentSelected = undefined;
	isInDeleteMode = false;
	var buttonRM = relationButton;
	isInRelationMode = true;
	setButtonColor( buttonRM );

}


//Toggles the passed buttons color
function setButtonColor(buttonIdentifier) {

	if( typeof buttonIdentifier != 'undefined' ) {
		document.getElementById( buttonIdentifier ).style.backgroundColor = "#533";
	}


	if ( typeof prevButton != 'undefined' ) {
		document.getElementById( prevButton ).style.backgroundColor = "#333";
	}

	prevButton = buttonIdentifier;

}


//Is used when the toolbars 'share'-button is clicked. Copies the current sessions link to the clipboard
function share() {

	clearModes();
	var shareLink = document.getElementById( "link" );
	shareLink.select();

	try {
		var successful = document.execCommand( 'copy' );
		var msg = successful ? 'successful' : 'unsuccessful';
		console.log( 'Copying text command was ' + msg );
	} catch ( err ) {
		console.log( 'Oops, unable to copy' );
	}

}


//Updates the Diagram using the passed JSON-File
function upload( uploadedJson ) {
	clearModes();
	if ( window.File && window.FileReader && window.FileList ) {
		var reader = new FileReader();
		reader.onload = function( e ) {
			deserialize( reader.result );
			serialize();
		}


		reader.readAsText( uploadedJson );

	} else {
		alert('The File APIs are not fully supported in this browser. To Upload use a Browser that does support the File API');
	}
}


//Updates the download-link using the passed JSON-representation of the diagram and the passed filename
function updateDownloadLink( anchorSelector , jsonString ){

	var data = "text/json;charset=utf-8," + encodeURIComponent( jsonString );
	var dlAnchor = document.getElementById( anchorSelector );
	dlAnchor.setAttribute( "href" , 'data:' + data);
	dlAnchor.setAttribute( "download" , downloadFileName);

}


//Recreates the current Diagrams graph using the passed JSON-representation and updates the download-link with the new JSON-file
function deserialize(newJson) {

	graph.fromJSON( JSON.parse( newJson ) );
	updateDownloadLink( 'downloadButton' , newJson );
	paper.fitToContent( { allowNewOrigin:'negative' } );
	highlightCurrentSelected();

}


//Stores the current diagrams JSON-representation in the current sessions database entry
function serialize() {

	var json = JSON.stringify( graph );
	var databaseObject = {};
	databaseObject[uniqueID] = json;
	database.ref().set( databaseObject );

}


//Checks if the passed elementID belongs to an element still existing in the current graph
function existingCell( id ) {

	if (typeof graph.getCell( id ) != 'undefined' ) {
		return true;
	}
	else {
		return false;
	}

}


//Highlights the currently selected diagram element. If alternative Highlighting is active all other elements will be greyed out. Otherwise only the selected element will be greyed out.
function highlightCurrentSelected() {

	var cells;
	if ( alternatives_Highlighting ) {
		if ( existingCell( currentSelected ) ) {
			cells = graph.getCells();

			for ( i=0 ; i<cells.length ; i++ ) {
				if ( cells[i].id != currentSelected ){
					paper.findViewByModel( cells[i] ).highlight( null, {highlighter: {name: 'opacity'} } );
				}
			}
		}
	} else {
		if ( existingCell( currentSelected ) ) {
			paper.findViewByModel( graph.getCell( currentSelected ) ).highlight( null, { highlighter: { name: 'opacity'} } );
		}
	}

}


//Unhighlights the highlighted element.
function unhighlight() {

	var cells;
	if ( alternatives_Highlighting ) {
		cells = graph.getCells();

		for ( i=0 ; i<cells.length ; i++ ) {
			paper.findViewByModel( cells[i] ).unhighlight( null , {highlighter: {name: 'opacity'} } );
		}
	} else {
		if ( existingCell( currentSelected ) ) {
			paper.findViewByModel( graph.getCell( currentSelected ) ).unhighlight( null,{ highlighter: { name: 'opacity'} } );
		}
	}

}

