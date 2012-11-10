/*
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

// TODO: remove these three redundant definitions when
// meta-weirdness fixed

Property.getPrototype().outSQL = function(out) {
  out.push(this.toSQL());
};

Property.getPrototype().toSQL = function() {
  return this.name;
};

Property.getPrototype().f = function(obj) {
  return obj[this.name];
}



var EXPR = FOAM.create({
   model_: 'Model',

   name: 'EXPR',

   properties: [
      {
	 name:  'args',
	 label: 'Arguments',
	 type:  'Expr[]',
	 help:  'Sub-expressions',
	 valueFactory: function() { return []; },
      }
   ],

   methods: {
     toSQL: function() {
       var out = [];
       this.outSQL(out);
       return out.join('');
     },
     outSQL: function(out) {
       out(this.toString());
     },
     partialEval: function() { return this; },
     normalize: function() { return this; },
     toString: function() { return this.name_; }
   }
});


var TRUE = (FOAM.create({
   model_: 'Model',

   extendsModel: 'EXPR',

   name: 'TRUE',

   methods: {
     outSQL: function(out) { out.push('( 1 = 1 )'); },
     f:      function() { return true; }
   }
})).create();


var FALSE = (FOAM.create({
   model_: 'Model',

   extendsModel: 'EXPR',

   name: 'FALSE',

   methods: {
     outSQL: function(out) { out.push('( 1 <> 1 )'); },
     f:      function() { return false; }
   }
})).create();


/** An n-ary function. **/
var NARY = FOAM.create({
   model_: 'Model',

   extendsModel: 'EXPR',

   name: 'NARY',

   properties: [
      {
	 name:  'args',
	 label: 'Arguments',
	 type:  'Expr[]',
	 help:  'Sub-expressions',
	 valueFactory: function() { return []; },
      }
   ],

   methods: {
      outSQL: function(out) {
        out.push(this.model_.name);
        out.push('(');
        for ( var i = 0 ; i < this.args.length ; i++ ) {
          var a = this.args[i];
          a.outSQL(out);
          if ( i < this.args.length-1 ) out.push(',');
        }
        out.push(')');
      }
   }
});


/** An unary function. **/
var UNARY = FOAM.create({
   model_: 'Model',

   extendsModel: 'EXPR',

   name: 'UNARY',

   properties: [
      {
	 name:  'arg1',
	 label: 'Argument',
	 type:  'Expr',
	 help:  'Sub-expression',
         defaultValue: TRUE
      }
   ],

   methods: {
      outSQL: function(out) {
        out.push(this.name_);
        out.push('(');
        this.arg1.outSQL(out);
        out.push(')');
      }
   }
});


/** An unary function. **/
var BINARY = FOAM.create({
   model_: 'Model',

   extendsModel: 'UNARY',

   name: 'BINARY',

   properties: [
      {
	 name:  'arg2',
	 label: 'Argument',
	 type:  'Expr',
	 help:  'Sub-expression',
         defaultValue: TRUE
      }
   ],

   methods: {
      outSQL: function(out) {
        this.arg1.outSQL(out);
        out.push(' ');
        out.push(this.name_);
        out.push(' ');
        this.arg2.outSQL(out);
      }
   }
});


var AndExpr = FOAM.create({
   model_: 'Model',

   extendsModel: 'NARY',

   name: 'AndExpr',

   methods: {
      outSQL: function(out) {
        out.push('(');
        for ( var i = 0 ; i < this.args.length ; i++ ) {
          var a = this.args[i];
          a.outSQL(out);
          if ( i < this.args.length-1 ) out.push(' AND ');
        }
        out.push(')');
      },

      partialEval: function() {
        var newArgs = this.args;
        var updated = false;

        for ( var i = 0 ; i < this.args.length ; i++ ) {
          var a    = this.args[i];
          var newA = this.args[i].partialEval();

          if ( newA === FALSE ) return FALSE;

          if ( AndExpr.isInstance(newA) ) {
            // In-line nested AND clauses
            for ( var j = 0 ; j < newA.args.length ; j++ ) {
              newArgs.push(newA[j]);
            }
            updated = true;
          }
          else {
            if ( newA !== TRUE ) {
              newArgs.push(newA);
            }
            if ( a !== newA ) updated = true;
          }
        }

        if ( newArgs.length === 0 ) return TRUE;
        if ( newArgs.length === 1 ) return newArgs[0];

        return updated ? AndExpr.create({args: newArgs}) : this;
      },

      f: function(obj) {
        for ( var i = 0 ; i < this.args.length ; i++ ) {
          var a = this.args[i];

          if ( ! a.f(obj) ) return false;
        }
        return true;
      }
   }
});


var OrExpr = FOAM.create({
   model_: 'Model',

   extendsModel: 'NARY',

   name: 'OrExpr',

   methods: {
      outSQL: function(out) {
        out.push('(');
        for ( var i = 0 ; i < this.args.length ; i++ ) {
          var a = this.args[i];
          a.outSQL(out);
          if ( i < this.args.length-1 ) out.push(' OR ');
        }
        out.push(')');
      },

      partialEval: function() {
        var newArgs = this.args;
        var updated = false;

        for ( var i = 0 ; i < this.args.length ; i++ ) {
          var a    = this.args[i];
          var newA = this.args[i].partialEval();

          if ( newA === FALSE ) return FALSE;

          if ( OrExpr.isInstance(newA) ) {
            // In-line nested OR clauses
            for ( var j = 0 ; j < newA.args.length ; j++ ) {
              newArgs.push(newA[j]);
            }
            updated = true;
          }
          else {
            if ( newA !== FALSE ) {
              newArgs.push(newA);
            }
            if ( a !== newA ) updated = true;
          }
        }

        if ( newArgs.length === 0 ) return TRUE;
        if ( newArgs.length === 1 ) return newArgs[0];

        return updated ? AndExpr.create({args: newArgs}) : this;
      },

      f: function(obj) {
        for ( var i = 0 ; i < this.args.length ; i++ ) {
          var a = this.args[i];

          if ( a.f(obj) ) return true;
        }
        return false;
      }
   }
});


var NotExpr = FOAM.create({
   model_: 'Model',

   extendsModel: 'NARY',

   name: 'NotExpr',

   methods: {
      outSQL: function(out) {
        out.push(this.name_);
        out.push('(');
        this.arg1.outSQL(out);
        out.push(')');
      },

      partialEval: function() {
        var newArg = this.arg1.partialEval();

        if ( newArg === TRUE ) return FALSE;
        if ( newArg === FALSE ) return TRUE;
        if ( NotExpr.isInstance(newArg) ) return newArg.arg1;

        return this.arg1 === newArg ? this : newArg;
      },

      f: function(obj) { return ! this.arg1.f(obj); }
   }
});


var EqExpr = FOAM.create({
   model_: 'Model',

   extendsModel: 'BINARY',

   name: 'EqExpr',

   methods: {
      outSQL: function(out) {
        this.arg1.outSQL(out);
        out.push(' = ');
        this.arg2.outSQL(out);
      },

      partialEval: function() {
        var newArg1 = this.arg1.partialEval();
        var newArg2 = this.arg2.partialEval();

        if ( ConstantExpr.isInstance(newArg1) && ConstantExpr.isInstance(newArg2) ) {
          return compile_(newArg1.f() === newArg2.f());
        }

        return this.arg1 !== newArg1 || this.arg2 != newArg2 ?
          EqExpr.create({arg1: newArg1, arg2: newArg2}) :
          this;
      },

      f: function(obj) { return this.arg1.f(obj) === this.arg2.f(obj); }
   }
});

var NeqExpr = FOAM.create({
   model_: 'Model',

   extendsModel: 'BINARY',

   name: 'NeqExpr',

   methods: {
      outSQL: function(out) {
        this.arg1.outSQL(out);
        out.push(' <> ');
        this.arg2.outSQL(out);
      },

      partialEval: function() {
        var newArg1 = this.arg1.partialEval();
        var newArg2 = this.arg2.partialEval();

        if ( ConstantExpr.isInstance(newArg1) && ConstantExpr.isInstance(newArg2) ) {
          return compile_(newArg1.f() !== newArg2.f());
        }

        return this.arg1 !== newArg1 || this.arg2 != newArg2 ?
          NeqExpr.create({arg1: newArg1, arg2: newArg2}) :
          this;
      },

      f: function(obj) { return this.arg1.f(obj) !== this.arg2.f(obj); }
   }
});

var LtExpr = FOAM.create({
   model_: 'Model',

   extendsModel: 'BINARY',

   name: 'LtExpr',

   methods: {
      outSQL: function(out) {
        this.arg1.outSQL(out);
        out.push(' < ');
        this.arg2.outSQL(out);
      },

      partialEval: function() {
        var newArg1 = this.arg1.partialEval();
        var newArg2 = this.arg2.partialEval();

        if ( ConstantExpr.isInstance(newArg1) && ConstantExpr.isInstance(newArg2) ) {
          return compile_(newArg1.f() < newArg2.f());
        }

        return this.arg1 !== newArg1 || this.arg2 != newArg2 ?
          LtExpr.create({arg1: newArg1, arg2: newArg2}) :
          this;
      },

      f: function(obj) { return this.arg1.f(obj) < this.arg2.f(obj); }
   }
});

var GtExpr = FOAM.create({
   model_: 'Model',

   extendsModel: 'BINARY',

   name: 'GtExpr',

   methods: {
      outSQL: function(out) {
        this.arg1.outSQL(out);
        out.push(' > ');
        this.arg2.outSQL(out);
      },

      partialEval: function() {
        var newArg1 = this.arg1.partialEval();
        var newArg2 = this.arg2.partialEval();

        if ( ConstantExpr.isInstance(newArg1) && ConstantExpr.isInstance(newArg2) ) {
          return compile_(newArg1.f() > newArg2.f());
        }

        return this.arg1 !== newArg1 || this.arg2 != newArg2 ?
          GtExpr.create({arg1: newArg1, arg2: newArg2}) :
          this;
      },

      f: function(obj) { return this.arg1.f(obj) > this.arg2.f(obj); }
   }
});

var LteExpr = FOAM.create({
   model_: 'Model',

   extendsModel: 'BINARY',

   name: 'LteExpr',

   methods: {
      outSQL: function(out) {
        this.arg1.outSQL(out);
        out.push(' <= ');
        this.arg2.outSQL(out);
      },

      partialEval: function() {
        var newArg1 = this.arg1.partialEval();
        var newArg2 = this.arg2.partialEval();

        if ( ConstantExpr.isInstance(newArg1) && ConstantExpr.isInstance(newArg2) ) {
          return compile_(newArg1.f() <= newArg2.f());
        }

        return this.arg1 !== newArg1 || this.arg2 != newArg2 ?
          LtExpr.create({arg1: newArg1, arg2: newArg2}) :
          this;
      },

      f: function(obj) { return this.arg1.f(obj) <= this.arg2.f(obj); }
   }
});

var GteExpr = FOAM.create({
   model_: 'Model',

   extendsModel: 'BINARY',

   name: 'GteExpr',

   methods: {
      outSQL: function(out) {
        this.arg1.outSQL(out);
        out.push(' >= ');
        this.arg2.outSQL(out);
      },

      partialEval: function() {
        var newArg1 = this.arg1.partialEval();
        var newArg2 = this.arg2.partialEval();

        if ( ConstantExpr.isInstance(newArg1) && ConstantExpr.isInstance(newArg2) ) {
          return compile_(newArg1.f() >= newArg2.f());
        }

        return this.arg1 !== newArg1 || this.arg2 != newArg2 ?
          GtExpr.create({arg1: newArg1, arg2: newArg2}) :
          this;
      },

      f: function(obj) { return this.arg1.f(obj) >= this.arg2.f(obj); }
   }
});


var ConstantExpr = FOAM.create({
   model_: 'Model',

   extendsModel: 'UNARY',

   name: 'ConstantExpr',

   methods: {
      outString: function(out, str) {
        out.push("'");
        out.push(str.replace(/\\/g, "\\\\").replace(/'/g, "\\'"));
        out.push("'");
      },
      outSQL: function(out) {
        if ( typeof this.arg1 === 'string' ) {
          this.outString(out, this.arg1);
        } else {
          out.push(this.arg1.toString);
        }
      },
      f: function(obj) { return this.arg1; }
   }
});


function compile_(a) {
  return EXPR.isInstance(a) || Property.isInstance(a) ? a :
      a === true  ? TRUE        :
      a === false ? FALSE       :
      ConstantExpr.create({arg1:a});
}

function compileArray_(args) {
  var b = [];

  for ( var i = 0 ; i < args.length ; i++ ) {
    var a = args[i];

    b.push(compile_(a));
  }

  return b;
};


function AND() {
  return AndExpr.create({args: compileArray_.call(null, arguments)});
}

function OR() {
  return OrExpr.create({args: compileArray_.call(null, arguments)});
}

function NOT(arg) {
  return NotExpr.create({arg1: compile_(arg)});
}

function EQ(arg1, arg2) {
  return EqExpr.create({arg1: compile_(arg1), arg2: compile_(arg2)});
}

function NEQ(arg1, arg2) {
  return NeqExpr.create({arg1: compile_(arg1), arg2: compile_(arg2)});
}

function LT(arg1, arg2) {
  return LtExpr.create({arg1: compile_(arg1), arg2: compile_(arg2)});
}

function GT(arg1, arg2) {
  return GtExpr.create({arg1: compile_(arg1), arg2: compile_(arg2)});
}

function LTE(arg1, arg2) {
  return LteExpr.create({arg1: compile_(arg1), arg2: compile_(arg2)});
}

function GTE(arg1, arg2) {
  return GteExpr.create({arg1: compile_(arg1), arg2: compile_(arg2)});
}