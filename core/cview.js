/**
 * @license
 * Copyright 2012 Google Inc. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
var Canvas = Model.create({

   extendsModel: 'AbstractView',

   name:  'Canvas',

   properties: [
      {
         name:  'background',
         label: 'Background Color',
         type:  'String',
         defaultValue: 'white'
      },
      {
         name:  'width',
         type:  'int',
         defaultValue: 100,
         postSet: function(width) {
           if ( this.$ ) this.$.width = width;
         }
      },
      {
         name:  'height',
         type:  'int',
         defaultValue: 100,
         postSet: function(height) {
           if ( this.$ ) this.$.height = height;
         }
      }
   ],

   methods: {
      init: function() {
         this.SUPER();

         this.repaint = EventService.animate(function() {
           this.paint();
         }.bind(this));
      },

      toHTML: function() {
         return '<canvas id="' + this.getID() + '" width="' + this.width + '" height="' + this.height + '"> </canvas>';
      },

      initHTML: function() {
         this.canvas = this.$.getContext('2d');
      },

      addChild: function(child) {
         this.SUPER(child);

         try {
            child.addListener(this.repaint);
         } catch (x) { }

         try {
            child.parent = this;
         } catch (x) { }

         return this;
      },

      erase: function() {
         this.canvas.fillStyle = this.background;
         this.canvas.fillRect(0, 0, this.width, this.height);
      },

      paintChildren: function() {
         for ( var i = 0 ; i < this.children.length ; i++ ) {
            var child = this.children[i];
            this.canvas.save();
            child.paint();
            this.canvas.restore();
         }
      },

      paint: function() {
         this.erase();
         this.paintChildren();
      }

   }
});


var Circle = Model.create({

   name:  'Circle',

   ids: [],

   properties: [
      {
         name:  'parent',
         type:  'CView',
         hidden: true
      },
      {
         name:  'color',
         type:  'String',
         defaultValue: 'white'
      },
      {
         name:  'border',
         label: 'Border Color',
         type:  'String',
         defaultValue: undefined
      },
      {
         name:  'borderWidth',
         type:  'int',
         defaultValue: 1
      },
      {
         name:  'alpha',
         type:  'int',
         defaultValue: 1
      },
      {
         name:  'x',
         type:  'int',
         defaultValue: 100
      },
      {
         name:  'y',
         type:  'int',
         defaultValue: 100
      },
      {
         name: 'r',
         label: 'Radius',
         type: 'int',
         defaultValue: 20
      }
   ],


   methods: {

      paint3d: function() {
         var canvas = this.parent.canvas;

         var radgrad = canvas.createRadialGradient(this.x+this.r/6,this.y+this.r/6,this.r/3,this.x+2,this.y,this.r);
         radgrad.addColorStop(0, '#a7a7a7'/*'#A7D30C'*/);
         radgrad.addColorStop(0.9, this.color /*'#019F62'*/);
         radgrad.addColorStop(1, 'black');

         canvas.fillStyle = radgrad;;

         canvas.beginPath();
         canvas.arc(this.x, this.y, this.r, 0, Math.PI*2, true);
         canvas.closePath();
         canvas.fill();

      },

      paint: function() {
         var canvas = this.parent.canvas;

         canvas.save();

         canvas.globalAlpha = this.alpha;

         canvas.fillStyle = this.color;

          if ( this.border && this.r ) {
            canvas.lineWidth = this.borderWidth;
            canvas.strokeStyle = this.border;
            canvas.beginPath();
            canvas.arc(this.x, this.y, this.r, 0, Math.PI*2, true);
            canvas.closePath();
            canvas.stroke();
          }

         if ( this.color ) {
           canvas.beginPath();
           canvas.arc(this.x, this.y, this.r, 0, Math.PI*2, true);
           canvas.closePath();
           canvas.fill();
         }

         canvas.restore();
      }
   }
});


var ImageCView = FOAM({

   model_: 'Model',

   name:  'ImageCView',

   properties: [
      {
         name:  'parent',
         type:  'CView',
         hidden: true
      },
      {
         name:  'alpha',
         type:  'int',
         defaultValue: 1
      },
      {
         name:  'x',
         type:  'int',
         defaultValue: 100
      },
      {
         name:  'y',
         type:  'int',
         defaultValue: 100
      },
      {
         name:  'scale',
         type:  'int',
         defaultValue: 1
      },
      {
         name: 'src',
         label: 'Source',
         type: 'String'
      }
   ],


   methods: {

      init: function() {
         this.SUPER();

         this.image_ = new Image();
         this.image_.src = this.src;
      },

      paint: function() {
         var c = this.parent.canvas;

         c.translate(this.x, this.y);
         c.scale(this.scale, this.scale);
         c.translate(-this.x, -this.y);
         c.drawImage(this.image_, this.x, this.y);
      }
   }
});


var Rectangle = FOAM({

   model_: 'Model',

   name:  'Rectangle',

   properties: [
      {
         name:  'parent',
         type:  'CView',
         hidden: true
      },
      {
         name:  'color',
         type:  'String',
         defaultValue: 'white',
      },
      {
         name:  'x',
         type:  'int',
         defaultValue: 1000
      },
      {
         name:  'y',
         type:  'int',
         defaultValue: 100
      },
      {
         name:  'width',
         type:  'int',
         defaultValue: 100
      },
      {
         name:  'height',
         type:  'int',
         defaultValue: 100
      }
   ],

   methods: {
      paint: function() {
         var canvas = this.parent.canvas;

         canvas.fillStyle = this.color;
         canvas.fillRect(this.x, this.y, this.width, this.height);
      }
   }
});


/** A Panel is a container of other CViews. **/
var PanelCView = FOAM({
   model_: 'Model',

   name:  'PanelCView',
   label: 'Panel',

   properties: [
      {
         name:  'parent',
         type:  'CView',
         hidden: true
      },
      {
         name:  'x',
         type:  'int',
         view:  'IntFieldView',
         defaultValue: 10
      },
      {
         name:  'y',
         type:  'int',
         view:  'IntFieldView',
         defaultValue: 10
      },
      {
         name:  'children',
         type:  'CView[]',
         valueFactory: function() { return []; }
      },
      {
         name:  'canvas',
         type:  'CView',
         getter: function() {
           return this.parent.canvas;
         },
         setter: undefined
      }
   ],

   methods: {
      toHTML: function() {
//       this.canvasView = Canvas.create(this);
         this.canvasView = Canvas.create({width:this.width+1, height:this.height+2});
         if ( this.backgroundColor ) this.canvasView.backgroundColor = this.backgroundColor;
         return this.canvasView.toHTML();
      },

      initHTML: function() {
         this.canvasView.initHTML();
         this.canvasView.addChild(this);
      },

      write: function(document) {
         document.writeln(this.toHTML());
         this.initHTML();
      },

      addChild: function(child) {
         this.children.push(child);
         child.parent = this;
         return this;
      },

      removeChild: function(child) {
         this.children.remove(child);
         child.parent = undefined;
         return this;
      },

      paint: function() {
         for ( var i = 0 ; i < this.children.length ; i++ ) {
            var child = this.children[i];

            child.paint();
         }
      }
   }
});



/** Abstract CViews. **/
var CView = FOAM({
   model_: 'Model',

   name:  'CView',
   label: 'Panel',

   properties: [
      {
         name:  'parent',
         type:  'CView',
         hidden: true
      },
      {
         name:  'x',
         type:  'int',
         view:  'IntFieldView',
         postSet: function() { this.resizeParent(); },
         defaultValue: 10
      },
      {
         name:  'y',
         type:  'int',
         view:  'IntFieldView',
         postSet: function() { this.resizeParent(); },
         defaultValue: 10
      },
      {
         name:  'width',
         type:  'int',
         view:  'IntFieldView',
         postSet: function() { this.resizeParent(); },
         defaultValue: 10
      },
      {
         name:  'height',
         type:  'int',
         view:  'IntFieldView',
         postSet: function() { this.resizeParent(); },
         defaultValue: 10
      },
      {
         name:  'children',
         type:  'CView[]',
         valueFactory: function() { return []; },
         hidden: true
      },
      {
         name:  'background',
         label: 'Background Color',
         type:  'String',
         defaultValue: 'white'
      },
      {
         name:  'canvas',
         type:  'CView',
         getter: function() {
           return this.parent.canvas;
         },
         setter: undefined,
         hidden: true
      }
   ],

   methods: {
      toHTML: function() {

         // If being added to HTML directly, then needs to create own Canvas as parent.
         this.parent = Canvas.create();
         this.resizeParent();
         return this.parent.toHTML();
      },

      resizeParent: function() {
        this.parent.width  = this.x + this.width + 1;
        this.parent.height = this.y + this.height + 2;
      },

      initHTML: function() {
         var self = this;
         var parent = this.parent;

         parent.initHTML();
         parent.addChild(this);
         Events.dynamic(
           function() { self.background; }, function() {
             parent.background = self.background;
           });
      },

      write: function(document) {
         document.writeln(this.toHTML());
         this.initHTML();
      },

      addChild: function(child) {
         this.children.push(child);
         child.parent = this;
         return this;
      },

      removeChild: function(child) {
         this.children.remove(child);
         child.parent = undefined;
         return this;
      },

      erase: function() {
         this.canvas.fillStyle = this.background;
         this.canvas.fillRect(0, 0, this.width, this.height);
      },

      paintChildren: function() {
         for ( var i = 0 ; i < this.children.length ; i++ ) {
            var child = this.children[i];
            this.canvas.save();
            child.paint();
            this.canvas.restore();
         }
      },

      paint: function() {
         this.erase();
         this.paintChildren();
      }
   }
});


var ProgressCView = FOAM({

   model_: 'Model',

   extendsModel: 'PanelCView',

   name:  'ProgressCView',
   label: 'ProgressCView',

   properties: [
      {
         name:  'value',
         type:  'Value',
         valueFactory: function() { return SimpleValue.create(); },
         postSet: function(newValue, oldValue) {
           oldValue && oldValue.removeListener(this.updateValue);
           newValue.addListener(this.updateValue);
         }
      }
   ],

   listeners: {
     updateValue: function() {
       this.paint();
     }
   },

   methods: {

    paint: function() {
        var c = this.canvas;

        c.fillStyle = '#fff';
        c.fillRect(0, 0, 104, 20);

        c.strokeStyle = '#000';
        c.strokeRect(0, 0, 104, 20);
        c.fillStyle = '#f00';
        c.fillRect(2, 2, parseInt(this.value.get()), 16);
    },

    destroy: function() {
      this.value.removeListener(this.listener_);
    }
   }
});


var Graph = FOAM({
   model_: 'Model',

   extendsModel: 'PanelCView',

   name:  'Graph',

   properties: [
      {
         name:  'style',
         type:  'String',
         defaultValue: 'Line',
         // TODO: fix the view, it's not storabe
         view: {
            create: function() { return ChoiceView.create({choices: [
              'Bar',
              'Line',
              'Point'
            ]});}
         }
      },
      {
         name:  'width',
         type:  'int',
         view:  'IntFieldView',
         defaultValue: 5
      },
      {
         name:  'height',
         type:  'int',
         view:  'IntFieldView',
         defaultValue: 5
      },
      {
         name:  'graphColor',
         type:  'String',
         defaultValue: 'green'
      },
      {
         name:  'backgroundColor',
         type:  'String',
         defaultValue: undefined
      },
      {
         name:  'lineWidth',
         type:  'int',
         defaultValue: 6
      },
      {
         name:  'drawShadow',
         type:  'boolean',
         defaultValue: true
      },
      {
         name:  'capColor',
         type:  'String',
         defaultValue: ''
      },
      {
         name:  'axisColor',
         type:  'String',
         defaultValue: 'black'
      },
      {
         name:  'gridColor',
         type:  'String',
         defaultValue: undefined
      },
      {
         name:  'axisSize',
         type:  'int',
         defaultValue: 2
      },
      {
         name:  'xAxisInterval',
         type:  'int',
         defaultValue: 0
      },
      {
         name:  'yAxisInterval',
         type:  'int',
         defaultValue: 0
      },
      {
         name:  'maxValue',
         label: 'Maximum Value',
         type:  'float',
         defaultValue: -1
      },
      {
         name:  'data',
         type:  'Array[float]',
         valueFactory: function() {
            return [];
         }
//       defaultValue: []
      },
      {
         name: 'f',
         label: 'Data Function',
         type: 'Function',
         required: false,
         displayWidth: 70,
         displayHeight: 3,
         view: 'FunctionView',
         defaultValue: function (x) { return x; },
         help: 'The graph\'s data function.'
      }

   ],

   issues: [
    {
      id: 1000,
      severity: 'Major',
      status: 'Open',
      summary: 'Make \'style\' view serializable',
      created: 'Sun Dec 23 2012 18:14:56 GMT-0500 (EST)',
      createdBy: 'kgr',
      assignedTo: 'kgr',
      notes: 'ChoiceView factory prevents Model from being serializable.'
    }
   ],

   methods: {
      paintLineData: function(canvas, x, y, xs, w, h, maxValue) {
         if ( this.graphColor ) {
           canvas.fillStyle = this.graphColor;
           canvas.beginPath();
           canvas.moveTo(x+xs, y+h-xs);
           for ( var i = 0 ; i < this.data.length ; i++ ) {
             var d = this.f(this.data[i]);
             var lx = x+xs+(i==0?0:w*i/(this.data.length-1));
             var ly = this.toY(d, maxValue);

             canvas.lineTo(lx, ly);
           }

           canvas.lineTo(x+this.width-1, y+h-xs);
           canvas.lineTo(x+xs, y+h-xs);
           canvas.fill();
         }

         if ( this.capColor ) {
           if ( this.drawShadow ) {
             canvas.shadowOffsetX = 0;
             canvas.shadowOffsetY = 2;
             canvas.shadowBlur = 2;
             canvas.shadowColor = "rgba(0, 0, 0, 0.5)";
           }

           canvas.strokeStyle = this.capColor;
           canvas.lineWidth = this.lineWidth;
           canvas.lineJoin = 'round';
           canvas.beginPath();
           for ( var i = 0 ; i < this.data.length ; i++ ) {
             var d = this.f(this.data[i]);
             var lx = this.toX(i)+0.5;
             var ly = this.toY(d, maxValue)/*+0.5*/-5;

             if ( i == 0 )
               canvas.moveTo(lx, ly);
             else
               canvas.lineTo(lx, ly);
           }

           canvas.stroke();
         }
      },


      paintPointData: function(canvas, x, y, xs, w, h, maxValue)
      {
         canvas.shadowOffsetX = 2;
         canvas.shadowOffsetY = 2;
         canvas.shadowBlur = 2;
         canvas.shadowColor = "rgba(0, 0, 0, 0.5)";

         canvas.strokeStyle = this.capColor;
         canvas.lineWidth = 2;
         canvas.lineJoin = 'round';
         canvas.beginPath();
         for ( var i = 0 ; i < this.data.length ; i++ )
         {
            var d = this.f(this.data[i]);
            var lx = this.toX(i)+0.5;
            var ly = this.toY(d, maxValue)+0.5;

            if ( i == 0 )
               canvas.moveTo(lx, ly);
            else
               canvas.lineTo(lx, ly);
         }

         canvas.stroke();

         canvas.lineWidth = 3;
         for ( var i = 0 ; i < this.data.length ; i++ )
         {
            var d = this.f(this.data[i]);
            var lx = this.toX(i)+0.5;
            var ly = this.toY(d, maxValue)+0.5;

            canvas.beginPath();
            canvas.arc(lx,ly,4,0,-Math.PI/2);
            canvas.closePath();
            canvas.stroke();
         }

      },


      paintBarData: function(canvas, x, y, xs, w, h, maxValue)
      {
         canvas.fillStyle = this.graphColor;

         for ( var i = 0 ; i < this.data.length ; i++ )
         {
            var d = this.f(this.data[i]);
            var x1 = x+xs+w*i/this.data.length;
            var y1 = this.toY(d, maxValue);

            canvas.fillRect(x1, y1, w/this.data.length+1.5, d*h/maxValue);
         }
      },

      paint: function()
      {
         var canvas = this.canvas;
         var x  = this.x;
         var y  = this.y;
         var xs = this.axisSize;
         var w  = this.width-xs;
         var h  = this.height-xs;
         var maxValue = this.maxValue;

         if ( this.backgroundColor ) {
            canvas.fillStyle = this.backgroundColor;
            canvas.fillRect(x,y,w,h);
         }

         if ( maxValue == -1 ) {
            maxValue = 0.001;

            for ( var i = 0 ; i < this.data.length ; i++ ) {
               var d = this.f(this.data[i]);

               maxValue = Math.max(maxValue, d);
            }
         }

         if ( this.style == 'Line' ) this.paintLineData(canvas, x, y, xs, w, h, maxValue);
         else if ( this.style == 'Bar' ) this.paintBarData(canvas, x, y, xs, w, h, maxValue);
         else if ( this.style == 'Point' ) this.paintPointData(canvas, x, y, xs, w, h, maxValue);

         if ( this.axisColor && xs != 0 ) {
            canvas.fillStyle = this.axisColor;
            // x-axis
            canvas.fillRect(x, y+h-xs*1.5, this.width, xs);
            // y-axis
            canvas.fillRect(x, y, xs, this.height-xs*1.5);
         }

         if ( this.xAxisInterval )
         for ( var i = this.xAxisInterval ; i <= this.data.length ; i += this.xAxisInterval )
         {
            var x2 = this.toX(i);

            if ( this.gridColor ) {
               canvas.save();
               canvas.shadowOffsetX = 0;
               canvas.shadowOffsetY = 0;
               canvas.shadowBlur = 0;
               canvas.fillStyle = this.gridColor;
               canvas.fillRect(x2+1.5, this.toY(0,1)-2*xs, 0.5, -this.height);
               canvas.restore();
            }

            canvas.fillRect(x2, this.toY(0,1)-2*xs, xs/2, -xs);
         }

         if ( this.yAxisInterval )
         for ( var i = this.yAxisInterval ; i <= maxValue ; i += this.yAxisInterval )
         {
            var y = this.toY(i, maxValue);

            if ( this.gridColor ) {
               canvas.save();
               canvas.shadowOffsetX = 0;
               canvas.shadowOffsetY = 0;
               canvas.shadowBlur = 0;
               canvas.fillStyle = this.gridColor;
               canvas.fillRect(x+xs, y+3, this.width, 0.5);
               canvas.restore();
            }

            canvas.fillRect(x+xs, y, xs, xs/2);
         }

      },

      toX: function(val) {
         var w  = this.width-this.axisSize;
         return this.x+this.axisSize+(val==0?0:w*val/(this.data.length-1));
      },

      toY: function(val, maxValue) {
         var h  = this.height-this.axisSize;
         return this.y+h-val*h/maxValue+0.5;
      },

      lastValue: function() {
         return this.data[this.data.length-1];
      },

      addData: function(value, opt_maxNumValues) {
         var maxNumValues = opt_maxNumValues || this.width;

         this.data.push(value);
         if ( this.data.length > maxNumValues ) this.data.shift();
      },

      watch: function(value, opt_maxNumValues) {
         var graph = this;

         value.addListener(function() {
           graph.addData(value.get(), opt_maxNumValues);
         });
      }

   }
});