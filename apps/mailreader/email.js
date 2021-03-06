/**
 * @license
 * Copyright 2013 Google Inc. All Rights Reserved.
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

/* TODO:
     - parse multiple addresses in 'to'
*/

function lazyEval(fn) {
   var result;
   return function() {
      if ( ! result ) {
         result = fn.call(this);
      }
      return result;
   };
};

var EMailLabel = FOAM({
    model_: 'Model',
    name: 'EMailLabel',
    label: 'EMailLabel',

    ids: [ 'id' ],

    properties: [
        {
            model_: 'StringProperty',
            name: 'id',
            label: 'Label ID'
        },
        {
            model_: 'StringProperty',
            name: 'displayName',
            label: 'Display Name'
        },
        {
            model_: 'IntProperty',
            name: 'color',
            label: 'color',
            defaultValue: 0
        }
    ],

    methods: {
        // TODO:  Not an exhaustive list
        SystemLabels: {
          ALL:       '^all',
          DRAFT:     '^r',
          IMPORTANT: '^io_im',
          INBOX:     '^i',
          MUTED:     '^g', // 'g' is second letter of 'ignored'
          OPENED:    '^o',
          REPLIED:   '^io_re', // User has replied to this message
          SENT:      '^f',
          SPAM:      '^s',
          STARRED:   '^t', // 't' originall stood for TODO
          TRASH:     '^k',
          UNREAD:    '^u'
        },

        RENDERABLE_SYSTEM_LABELS: lazyEval(function() {
          var result = {};
          var SystemLabels = this.SystemLabels;
          result[SystemLabels.INBOX]     = true;
          result[SystemLabels.STARRED]   = true;
          result[SystemLabels.IMPORTANT] = true;
          result[SystemLabels.SPAM]      = true;
          result[SystemLabels.TRASH]     = true;
          result[SystemLabels.DRAFT]     = true;
          result[SystemLabels.SENT]      = true;
          result[SystemLabels.MUTED]     = true;
          result[SystemLabels.UNREAD]    = true;
          return result;
        }),

        SYSTEM_LABEL_RENDER_NAMES: lazyEval(function() {
          var result = {};
          var SystemLabels = this.SystemLabels;
          result[SystemLabels.ALL]       = 'All Mail';
          result[SystemLabels.INBOX]     = 'Inbox';
          result[SystemLabels.STARRED]   = 'Starred';
          result[SystemLabels.IMPORTANT] = 'Important';
          result[SystemLabels.SPAM]      = 'Spam';
          result[SystemLabels.TRASH]     = 'Trash';
          result[SystemLabels.DRAFT]     = 'Draft';
          result[SystemLabels.SENT]      = 'Sent';
          result[SystemLabels.MUTED]     = 'Muted';
          result[SystemLabels.UNREAD]    = 'Unread';
          result[SystemLabels.REPLIED]   = 'Replied';
          result[SystemLabels.OPENED]    = 'Opened';
          return result;
        }),

        SEARCHABLE_SYSTEM_LABELS: lazyEval(function() {
          var result = {};
          var SystemLabels = this.SystemLabels;
          result[SystemLabels.ALL]       = true;
          result[SystemLabels.INBOX]     = true;
          result[SystemLabels.STARRED]   = true;
          result[SystemLabels.IMPORTANT] = true;
          result[SystemLabels.SPAM]      = true;
          result[SystemLabels.TRASH]     = true;
          result[SystemLabels.DRAFT]     = true;
          result[SystemLabels.SENT]      = true;
          return result;
        }),

        isSystemLabel: function() {
          return this.displayName.charAt(0) == '^';
        },

        isRenderable: function() {
          return !this.isSystemLabel() || this.RENDERABLE_SYSTEM_LABELS()[this.displayName];
        },

        getRenderName: function() {
          var displayName = this.displayName;
          return this.SYSTEM_LABEL_RENDER_NAMES()[displayName] || displayName;
        },

        isSearchable: function() {
          return !this.isSystemLabel() || this.SEARCHABLE_SYSTEM_LABELS()[this.displayName];
        },

        getSearch: function() {
          switch(this.displayName) {
           case this.SystemLabels.ALL:
            return '-label:^r,^s,^k';
           case this.SystemLabels.SENT:
            return 'f:me';
           default:
            return 'label:"' + this.displayName + '"';
          }
        }
    }
});

var EMailPreference = FOAM({
    model_: 'Model',
    name: 'EMailPreference',
    label: 'EMailPreference',

    ids: [ 'name' ],

    properties: [
        {
            model_: 'StringProperty',
            name: 'name',
            label: 'Preference Name'
        },
        {
            model_: 'StringProperty',
            name: 'value',
            label: 'Preference Value'
        }
    ]
});

var Attachment = FOAM({
   model_: 'Model',
   name: 'Attachment',
   plural: 'Attachments',
   tableProperties:
   [
      'type',
      'filename',
      'position',
      'size'
   ],
   properties:
   [
      {
         model_: 'StringProperty',
         name: 'id',
         label: 'Identifier',
         displayWidth: 50,
         factory: function() {
           return this.$UID;
         }
      },
      {
         model_: 'Property',
         name: 'filename',
         label: 'File Name',
         type: 'String',
         displayWidth: 50,
         view: 'TextFieldView'
      },
      {
         model_: 'Property',
         name: 'type',
         type: 'String',
         displayWidth: 30,
         view: 'TextFieldView'
      },
      {
         model_: 'Property',
         name: 'size',
         type: 'int',
         displayWidth: 10,
         view: 'TextFieldView'
      },
      /**
       * Used in the MBOX reader to point to the position in the MBOX, but
       * for other uses, this doesn't make sense.
       **/
      {
         model_: 'Property',
         name: 'position',
         type: 'int',
         displayWidth: 10,
         view: 'TextFieldView'
      },
      {
        name: 'file',
        type: 'File',
        hidden: true
      },
      {
        model_: 'BooleanProperty',
        name: 'inline',
        defaultValue: false
      }
   ],
   methods: {
     atoMime: function(ret) {
       if ( !this.file ) {
         ret();
         return;
       }

       var self = this;

       var reader = new FileReader();
       reader.onloadend = function() {
         var data = Base64Encoder.encode(new Uint8Array(reader.result), 78);

         if ( data[data.length-1] !== '\n' ) data += '\r\n';

         var sanitizedName = self.filename
           .replace(/[\x00-\x1f]/g, '')
           .replace(/"/g, '');

         // TODO: Content disposition
         ret(
           "Content-Type: " + self.type + "; name=\"" + sanitizedName + '"\r\n' +
             (self.inline ? '' : 'Content-Disposition: attachment; filename=\"' + sanitizedName + '\"\r\n') +
             "Content-Transfer-Encoding: base64\r\n" +
             "Content-ID: <" + self.id + ">\r\n" +
             "X-Attachment-Id: " + self.id + "\r\n\r\n" +
             data);
       };
       reader.readAsArrayBuffer(this.file);
     }
   },
   actions:
   [
      {
         model_: 'Action',
         name: 'view',
         help: 'View an attachment.',
         action: function () {
         }
      }
   ]
});

var openComposeView = function(email) {
  DAOCreateController.getPrototype().newObj(email, EMailDAO);
}

var EMail = FOAM({
   model_: 'Model',
   name: 'EMail',
   plural: 'EMail',
   ids: [ 'id' ],
   tableProperties:
   [
      'from',
//      'to',
      'subject',
//      'attachments',
      'timestamp'
   ],
   properties:
   [
      {
         model_: 'StringProperty',
         name: 'id',
         label: 'Message ID',
         mode: 'read-write',
         required: true,
         displayWidth: 50,
         hidden: true,
         compareProperty: hexStringCompare
      },
      {
         model_: 'StringProperty',
         name: 'convId',
         label: 'Conversation ID',
         mode: 'read-write',
         hidden: true,
         displayWidth: 30
      },
      {
         model_: 'DateProperty',
         name: 'timestamp',
         aliases: ['time', 'modified', 't'],
         label: 'Date',
         type: 'String',
         mode: 'read-write',
         required: true,
         displayWidth: 45,
         displayHeight: 1,
         view: 'TextFieldView',
         tableWidth: '100',
         preSet: function (_, d) {
           if (typeof d === 'string' || typeof d === 'number')
             return new Date(d);
           return d;
         },
         factory: function() { return new Date(); }
      },
      {
         model_: 'StringProperty',
         name: 'from',
         shortName: 'f',
         mode: 'read-write',
         required: true,
         displayWidth: 90,
         tableWidth: '120',
         tableFormatter: function(t) {
           var ret;
           if (t.search('<.*>') != -1) {
             // If it's a name followed by <email>, just use the name.
             ret = t.replace(/<.*>/, '').replace(/"/g, '');
           } else {
             // If it's just an email, only use everything before the @.
             ret = t.replace(/@.*/, '');
           }
           return ret.trim();
         },
         factory: function() { return GLOBAL.user || ""; }
      },
      {
         model_: 'StringArrayProperty',
         name: 'to',
         shortName: 't',
         required: true,
         displayWidth: 90,
         tableFormatter: function(t) {
           return t.replace(/"/g, '').replace(/<.*/, '');
         }
      },
      {
         model_: 'StringArrayProperty',
         name: 'cc',
         required: true,
         displayWidth: 90,
         tableFormatter: function(t) {
           return t.replace(/"/g, '').replace(/<.*/, '');
         }
      },
      {
         model_: 'StringArrayProperty',
         name: 'bcc',
         required: true,
         displayWidth: 90,
         tableFormatter: function(t) {
           return t.replace(/"/g, '').replace(/<.*/, '');
         }
      },
      {
        model_: 'StringArrayProperty',
        name: 'replyTo'
      },
      {
         model_: 'Property',
         name: 'subject',
         shortName: 's',
         type: 'String',
         mode: 'read-write',
         required: true,
         displayWidth: 100,
         tableWidth: '45%',
         view: 'TextFieldView'
      },
      {
         model_: 'StringArrayProperty',
         name: 'labels',
         view: 'LabelView',
         postSet: function(_, a) {
           for ( var i = 0 ; i < a.length ; i++ ) a[i] = a[i].intern();
         },
         help: 'Email labels.'
      },
      {
         model_: 'Property',
         name: 'attachments',
         label: 'Attachments',
         tableLabel: '@',
         type: 'Array[Attachment]',
         subType: 'Attachment',
         view: 'ArrayView',
         factory: function() { return []; },
         tableWidth: '20',
         tableFormatter: function(a) {
           return a.length ? a.length : "";
         },
         help: 'Email attachments.'
      },
      {
         model_: 'StringProperty',
         name: 'body',
         shortName: 'b',
         label: '',
//         view: 'RichTextView',
        view: 'TextFieldView',
         displayWidth: 70,
         displayHeight: 20,
         help: 'Email message body.',
         summaryFormatter: function(t) {
           return '<div class="messageBody">' + t.replace(/\n/g,'<br/>') + '</div>';
         }
      }
   ],

   methods: {
      updateLabelByName: function(id) {
         var self = this;
         EMailLabelDAO.find(EQ(EMailLabel.DISPLAY_NAME, id), {put: function(label) {
            var mail = self.clone(); mail.toggleLabel(label.id); EMailDAO.put(mail);
         }});
      },
      hasLabel: function(l) { return this.labels.indexOf(l) != -1; },
      toggleLabel: function(l) { this.hasLabel(l) ? this.removeLabel(l) : this.addLabel(l); },
      addLabel: function(l) { this.labels = this.labels.deleteF(l).pushF(l); },
      removeLabel: function(l) { this.labels = this.labels.deleteF(l); },
      atoMime: function(ret) {
        // Filter attachments into inline and non-inline attachments.
        var inline = [];
        var attachments = []
        for ( var i = 0; i < this.attachments.length; i++ ) {
          if ( this.attachments[i].inline )
            inline.push(this.attachments[i]);
          else
            attachments.push(this.attachments[i]);
        }

        // Utility function for defining unique bounday values.
        var newBoundary = (function() {
          var boundary = Math.floor(Math.random() * 10000);
          return function() {
            return (boundary += 1).toString(16);
          };
        })();

        var body = "Content-Type: text/html; charset=UTF-8\r\n\r\n";

        var fragment = new DocumentFragment();
        fragment.appendChild(document.createElement('body'));
        fragment.firstChild.innerHTML = this.body;
        var images = fragment.querySelectorAll('img');
        for ( var i = 0; i < images.length; i++ ) {
          if ( images[i].id ) {
            images[i].src = 'cid:' + images[i].id;
            images[i].removeAttribute('id');
          }
        }
        body += fragment.firstChild.innerHTML + "\r\n";

        var i;
        var self = this;

        var addAttachments = function(attachments, inline) {
          return aseq(
            function(ret) {
              boundary = newBoundary();

              body = "Content-Type: multipart/" +
                ( inline ? 'related' : 'mixed' ) + "; boundary=" + boundary + "\r\n\r\n"
                + "--" + boundary + "\r\n"
                + body
                + "\r\n--" + boundary;
              i = 0;
              ret();
            },
            awhile(
              function() { return i < attachments.length; },
              aseq(
                function(ret) {
                  var att = attachments[i];
                  i++;
                  att.atoMime(ret);
                },
                function(ret, data) {
                  body += "\r\n" + data;
                  body += "--" + boundary;
                  ret();
                })),
            function(ret) {
              body += "--";
              ret();
            });
        };

        aseq(
          aif(inline.length > 0,
              addAttachments(inline, true)),
          aif(attachments.length > 0,
              addAttachments(attachments, false)))(function() {
                body = "From: " + self.from + "\r\n" +
                  "To: " + self.to.join(', ') + "\r\n" +
                  (self.cc.length ? "Cc: " + self.cc.join(", ") + "\r\n" : "") +
                  (self.bcc.length ? "Bcc: " + self.bcc.join(", ") + "\r\n" : "") +
                  "Subject: " + self.subject + "\r\n" +
                  body;
                ret(body);
              });
      }
   },

   actions:
   [
      {
         model_: 'Action',
         name: 'send',
         help: 'Send the email.',
         action: function () {
           EmailDAO.put(this);
           stack.back();
         }
      },
      {
         model_: 'Action',
         name: 'reply',
         help: 'Reply to an email.',
         action: function () {
           var replyMail = EMail.create({
             to: [this.from],
             from: ME || this.to,
             subject: "Re.: " + this.subject,
             body: this.body.replace(/^|\n/g, '\n>'),
             id: Math.floor(Math.random() * 0xffffff).toVarintString()
           });
           openComposeView(replyMail);
         }
      },
      {
         model_: 'Action',
         name: 'replyAll',
         help: 'Reply to all recipients of an email.',
         action: function () {
           var replyMail = EMail.create({
             to: [this.from],
             cc: this.cc,
             from: ME || this.to,
             subject: "Re.: " + this.subject,
             body: this.body.replace(/^|\n/g, '\n>'),
             id: Math.floor(Math.random() * 0xffffff).toVarintString()
           });

           for ( var i = 0 ; i < this.to ; i++ ) {
              replyMail.to.push(this.to[i]);
           }
           openComposeView(replyMail);
         }
      },
      {
         model_: 'Action',
         name: 'forward',
         help: 'Forward an email.',
         action: function () {
           var forwardedMail = EMail.create({
             from: ME,
             subject: "Fwd.: " + this.subject,
             body: this.body.replace(/^|\n/g, '\n>'),
             id: Math.floor(Math.random() * 0xffffff).toVarintString()
           });
           openComposeView(forwardedMail);
         }
      },
      {
         model_: 'Action',
         name: 'star',
         help: 'Star an email.',
         action: function () { this.updateLabelByName('^t'); }
      },
      {
         model_: 'Action',
         name: 'archive',
         help: 'Archive an email.',
         action: function () { this.updateLabelByName('^i'); }
      },
      {
         model_: 'Action',
         name: 'spam',
         help: 'Report an email as SPAM.',
         action: function () {
             var mail = this;
             apar(
               function(ret) {
                 EMailLabelDAO.where(EQ(EMailLabel.DISPLAY_NAME, "^i")).select({
                   put: function(o) { ret(o); }
                 });
               },
               function(ret) {
                 EMailLabelDAO.where(EQ(EMailLabel.DISPLAY_NAME, "^s")).select({
                   put: function(o) { ret(o); }
                 });
               })(function(inbox, spam) {
                 mail = mail.clone();
                 mail.removeLabel(inbox.id);
                 mail.addLabel(spam.id);
                 EmailDAO.put(mail);
               });
         }
      },
      {
         model_: 'Action',
         name: 'trash',
         help: 'Move an email to the trash.',
         action: function () {
             var mail = this;
             apar(
               function(ret) {
                 EMailLabelDAO.where(EQ(EMailLabel.DISPLAY_NAME, "^i")).select({
                   put: function(o) { ret(o); }
                 });
               },
               function(ret) {
                 EMailLabelDAO.where(EQ(EMailLabel.DISPLAY_NAME, "^k")).select({
                   put: function(o) { ret(o); }
                 });
               })(function(inbox, trash) {
                 mail = mail.clone();
                 mail.removeLabel(inbox.id);
                 mail.addLabel(trash.id);
                 EMailDAO.put(mail);
               });
         }
      },
     {
       model_: 'Action',
       name: 'open',
       action: function() {
         var mail = this;
         apar(
           function(ret) {
             EMailLabelDAO.where(EQ(EMailLabel.DISPLAY_NAME, "^o")).select({
               put: function(o) { ret(o); }
             });
           },
           function(ret) {
             EMailLabelDAO.where(EQ(EMailLabel.DISPLAY_NAME, "^u")).select({
               put: function(o) { ret(o); }
             });
           })(function(opened, unread) {
             if ( mail.hasLabel(unread.id) ) {
               mail = mail.clone();
               mail.removeLabel(unread.id);
               mail.addLabel(opened.id);
               EMailDAO.put(mail);
             }
           });
       }
     }
   ]
});


var EmailAddressParser = {
  __proto__: grammar,

  START: sym('address'),

  'until eol': repeat(notChar('\r')),

  'address list': repeat(sym('address'), seq(',', repeat(' '))),

  'address': alt(
    sym('labelled address'),
    sym('simple address')),

  'labelled address': seq(
    repeat(notChars('<,')),
    '<', sym('simple address'), '>'),

  'simple address': seq(repeat(notChar('@')), '@', repeat(notChars('\r>,')))
}.addActions({
  'labelled address': function(v) { return v[0].join('') + v[1] + v[2] + v[3]; },
  'simple address': function(v) { return v[0].join('') + v[1] + v[2].join(''); }
});


var MBOXParser = {
  __proto__: grammar,

  START: sym('line'),

  'eol': literal('\n'),

  'until eol': repeat(notChar('\r')),

  line: alt(
    sym('start of email'),
    sym('id'),
    sym('conversation id'),
    sym('to'),
    sym('cc'),
    sym('bcc'),
    sym('from'),
    sym('subject'),
    sym('date'),
    sym('labels'),
    sym('block separator'),
    sym('content type'),
    sym('transfer encoding'),
    sym('empty line'),
    sym('start of attachment')
  ),

  'empty line': literal('\r\n'),

  'start of email': seq('From ', sym('until eol')),

  id: seq('Message-ID: ', sym('until eol')),

  'conversation id': seq('X-GM-THRID: ', sym('until eol')),

  address: EmailAddressParser.export('address'),

  'address list': EmailAddressParser.export('address list'),

  to: seq('To: ', sym('until eol')),
  cc: seq('Cc: ', sym('until eol')),
  bcc: seq('Bcc: ', sym('until eol')),
  from: seq('From: ', sym('until eol')),

  labels: seq('X-Gmail-Labels: ', repeat(sym('label'), ',')),

  label: repeat(alt(range('a','z'), range('A', 'Z'), range('0', '9'))),

  subject: seq('Subject: ', sym('until eol')),

  date: seq('Date: ', sym('until eol')),

  'other': sym('until eol'),

  'block separator': seq(
    '--', repeat(notChars('-\r\n')), optional('--')),

  'token': repeat(notChars(' ()<>@,;:\\"/[]?=')),

  'type': alt(
    sym('multipart type'),
    sym('text/plain'),
    sym('text/html'),
    sym('unknown content type')),

  'unknown content type': seq(sym('token'), '/', sym('token')),

  'multipart type': seq(literal('multipart/'), sym('token')),

  'text/plain': literal('text/plain'),
  'text/html': literal('text/html'),

  'content type': seq(
    'Content-Type: ',
    sym('type'),
    optional(seq('; ', sym('params')))),

  'params': repeat(alt(
    sym('boundary declaration'),
    sym('charset declaration'),
    seq(sym('token'), '=', sym('token')))),

  'boundary declaration': seq('boundary=', sym('token')),

  'charset declaration': seq('charset=', alt(
    sym('utf-8'),
    sym('iso-8859-1'),
    sym('token'))),


  'utf-8': literal('UTF-8'),
  'iso-8859-1': literal('ISO-8859-1'),

  'transfer encoding': seq(
    'Content-Transfer-Encoding: ',
    alt(sym('quoted printable'),
        sym('base64'),
        sym('until eol'))),

  'quoted printable': literal_ic('quoted-printable'),
  'base64': literal_ic('base64'),

  'start of attachment': seq(
    'Content-Type: ', repeat(notChar(';')), '; name="', sym("filename"), '"', sym('until eol')
//    'Content-Disposition: attachment; filename="', sym("filename"), '"', sym('until eol')
    ),

  filename: repeat(notChar('"'))

};

/** Sink which loads Emails into a DAO. **/
var MBOXLoader = {
  __proto__: MBOXParser,

  ps: StringPS.create(""),

  state: function(str) {
    this.states[0].call(this, str);
  },

  PARSE_HEADERS_STATE: function HEADERS(str) {
    this.parseString(str);
  },

  IGNORE_SECTION_STATE: function IGNORE_SECTION(str) {
    if ( str.slice(0, 5) === 'From ' ) {
      this.states.shift();
      this.state(str);
    } else if ( str.indexOf(this.blockIds[0]) == 2) {
      this.states.shift();
      if ( str.slice(-4, -2) == '--' ) {
        this.blockIds.shift();
      }
    }
  },

  PLAIN_BODY_STATE: function PLAIN_BODY(str) {
    if ( str.slice(0, 5) === 'From ' ) {
      this.states.shift();
      this.state(str);
      return;
    }

    if ( str.indexOf(this.blockIds[0]) == 2) {
      this.states.shift();
      if ( str.slice(-4, -2) == '--' ) {
        this.blockIds.shift();
      }
      return;
    }

    if ( ! this.hasHtml ) {
      this.b.push(str.trimRight());
    }
  },

  HTML_BODY_STATE: function HTML_BODY(str) {
    if ( str.slice(0, 5) === 'From ' ) {
      this.states.shift();
      this.state(str);
      return;
    }

    if ( str.indexOf(this.blockIds[0]) == 2) {
      this.states.shift();
      if ( str.slice(-4, -2) == '--' ) {
        this.blockIds.shift();
      }
      return;
    }

    this.b.push(str.trimRight());
  },

  SKIP_ATTACHMENT_STATE: function ATTACHMENT(str) {
    var att = this.email.attachments[this.email.attachments.length-1];
    if ( str.slice(0, 5) === 'From ' ) {
      att.size = att.pos - att.position;
      this.states.shift();
      this.state(str);
      return;
    }

    if ( str.indexOf(this.blockIds[0]) == 2) {
      this.states.shift();
      if ( str.slice(-4, -2) == '--' ) {
        this.blockIds.shift();
      }
      return;
    }
  },

  created: 0, // No of Emails created

  lineNo: 0,  // Current Line Number in mbox file

  pos: 0,     // Current byte position in mbox file

  segPos: 0,

  put: function(str) {
    if ( this.lineNo == 0 ) {
      this.segStartTime = this.startTime = Date.now();
      this.states = [this.PARSE_HEADERS_STATE];
    }

    this.lineNo++;
    this.pos += str.length;

    if ( ! ( this.lineNo % 100000 ) ) {
      var lps = Math.floor(this.lineNo / (Date.now() - this.startTime));
      var bps = Math.floor(this.pos / (Date.now() - this.startTime));
      var slps = Math.floor(100000 / (Date.now() - this.segStartTime));
      var sbps = Math.floor((this.pos-this.segPos) / (Date.now() - this.segStartTime));

      console.log(
        'line: ' + Math.floor(this.lineNo/1000) +
        'k  time: ' + Math.floor((Date.now() - this.startTime)) +
        'ms  bytes: ' + Math.floor(this.pos/1000) +
        'k  created: ' + this.created +
        '    SEGMENT:',
        ' lps: ' + slps +
        'k bps: ' + sbps + 'k' +
        '    TOTAL:',
        ' lps: ' + lps +
        'k bps: ' + bps + 'k ' +
        'state: ' + this.states[0].name);

      this.segStartTime = Date.now();
      this.segPos = this.pos;
    }

    this.state(str);
  },

  eof: function() { this.saveCurrentEmail(); },

  saveCurrentEmail: function() {
    if ( this.email ) {
      // TODO: Standardize encoding and charset interfaces.
      // Make them fetched from the context on demand.
      if ( this.b.encoding && this.b.encoding == 'quoted-printable' ) {
        var decoder = QuotedPrintable;

        if ( this.b.charset && this.b.charset == 'UTF-8' ) {
          var charset = IncrementalUtf8.create();
        } else {
          charset = {
            string: "",
            remaining: 0,
            put: function(s) {
              this.string += String.fromCharCode(s);
            },
            reset: function() {
              this.string = "";
            }
          };
        }

        var b = decoder.decode(this.b.join('\n'), charset);
      } else {
        b = this.b.join('\n');
      }



      this.email.body = b;

      this.charset = "";
      this.encoding = "";
      this.b = [];

      if ( this.email.to.length == 0 ) return;
      if ( this.email.to.indexOf('<<') != -1 ) return;
      if ( this.email.from.indexOf('<<') != -1 ) return;
      if ( this.email.to.indexOf('3D') != -1 ) return;
      if ( this.email.from.indexOf('3D') != -1 ) return;
      if ( this.email.from.indexOf('=') != -1 ) return;
      if ( this.email.from.indexOf('<') == 0 ) return;
      if ( this.email.from.indexOf(' ') == 0 ) return;

      this.created++;

      // console.log('creating: ', this.created);
      // console.log('creating: ', this.email.toJSON());
      if ( this.dao ) this.dao.put(this.email);
    }
  }
}.addActions({
  'start of email': function() {
    this.saveCurrentEmail();

    this.email = EMail.create();
    this.b = [];
    this.blockIds = [];
    this.states = [this.PARSE_HEADERS_STATE];
  },

//  id: function(v) { this.email.id = v[1].join('').trim(); },
  id: function(v) { this.email.id = Math.floor(Math.random()*100000000); },

  'conversation id': function(v) { this.email.convId = v[1].join('').trim(); },

  to: function(v) {
    this.email.to = v[1].join('').trim();
    var i = this.email.to.indexOf(',');
    if ( i != -1 ) this.email.to = this.email.to.substring(0, i);
},

  cc: function(v) {
    var cc = v[1].join('').split(',');
    for ( var i = 0; i < cc.length; i++ ) {
      cc[i] = cc[i].trim();
    }
    this.email.cc = cc;
  },

  bcc: function(v) {
    var bcc = v[1].join('').split(',');
    for ( var i = 0; i < bcc.length; i++ ) {
      bcc[i] = bcc[i].trim();
    }
    this.email.bcc = bcc;
  },

  from: function(v) { this.email.from = v[1].join('').trim(); },

  subject: function(v) { this.email.subject = v[1].join('').trim(); },

  date: function(v) { this.email.timestamp = new Date(v[1].join('').trim()); },

  label: function(v) { this.email.labels.push(v.join('')); },

  'text/plain': function(v) {
    this.nextState = this.PLAIN_BODY_STATE;
  },

  'text/html': function(v) {
    this.b = [];
    this.nextState = this.HTML_BODY_STATE;
  },

  'unknown content type': function() {
    this.nextState = this.IGNORE_SECTION_STATE;
  },

  'multipart type': function(v) {
    this.nextState = this.PARSE_HEADERS_STATE;
  },

  'empty line': function(v) {
    if ( this.nextState === this.PLAIN_BODY_STATE ||
         this.nextState === this.HTML_BODY_STATE ) {
      this.b.encoding = this.encoding;
      this.b.charset = this.charset;
    }
    this.states.unshift(this.nextState);
  },

  'boundary declaration': function(v) {
    this.blockIds.unshift(v[1].join('').trimRight());
  },

  'quoted printable': function() {
    this.encoding = 'quoted-printable';
  },

  'base64': function() {
    this.encoding = 'base64';
  },

  'utf-8': function() {
    this.charset = 'UTF-8';
  },

  'iso-8859-1': function() {
    this.charset = 'ISO-8859-1';
  },

  'block separator': function(v) {
    this.nextState = this.IGNORE_SECTION_STATE
    if ( v[2] ) {
      this.nextState = this.PARSE_HEADERS_STATE;
      this.blockIds.shift();
    }
  },

  'start of attachment': function(v, unused, pos) {
    this.nextState = this.SKIP_ATTACHMENT_STATE;

    var attachment = Attachment.create({
      type: v[1].join(''),
      filename: v[3].join(''),
      position: this.pos
    });

    this.email.attachments.push(attachment);
  }

  // TODO: timestamp, message-id, body, attachments
  // TODO: internalize common strings to save memory (or maybe do it at the DAO level)

});


var EMailBody = FOAM({
    model_: 'Model',
    name: 'EMailBody',
    label: 'EMailBody',

    ids: [
        'offset',
        'size'
    ],

    properties: [
        {
            name: 'offset',
            type: 'Int',
            required: true
        },
        {
            name: 'size',
            type: 'Int',
            required: true
        },
        {
            name: 'value',
            type: 'String',
            defaultValue: ''
        }
    ],

    methods: {
    }
});

var ConversationAction = FOAM({
  model_: 'Model',
  extendsModel: 'Action',

  properties: [
    {
      name: 'name',
      defaultValueFn: function() {
        return this.delegate ? this.delegate.name : 'ConversationAction';
      },
    },
    {
      name: 'iconUrl',
      defaultValueFn: function() {
        return this.delegate.iconUrl;
      },
    },
    {
      name: 'help',
      defaultValueFn: function() {
        return this.delegate.help;
      },
    },
    {
      name: 'delegate',
    },
    {
      name: 'action',
      defaultValue: function(action) {
        var emails = this.emails;
        if (action.applyOnAll) {
          emails.forEach(function(e) {
            action.delegate.action.call(e);
          });
        } else if (emails.length) {
          var e = emails[emails.length - 1];
          action.delegate.action.call(e);
        }
      },
    },
    {
      name: 'applyOnAll',
      defaultValue: true,
    },
  ],
});

var EMailsView = FOAM({
   model_: 'Model',
   name:  'EMailsView',

   extendsModel: 'DetailView',

   properties: [
      {
         name:  'value',
         type:  'Value',
         postSet: function(oldValue, newValue) {
            oldValue && oldValue.removeListener(this.updateHTML);
            newValue.addListener(this.updateHTML);
            this.updateHTML();
         },
         factory: function() { return SimpleValue.create(); }
      }
   ],

   listeners:
   [
     {
       model_: 'Method',
       name: 'updateHTML',
       code: function() {
         var c = this.value.get();
         if (!c) return;

         var html = "";
         this.children = [];

         var self = this;
         c.forEach(function(m) {
           var v = MessageView.create({});
           self.addChild(v);

           // This is done to actually get the email bodies.
           EMailDAO.find(m.id, {
             put: function(m2) {
               v.value.set(m2);
             }
           });

           html += v.toHTML();
         });

        this.$.innerHTML = html;

        this.initChildren();
       }
     }
  ],

   methods: {
     toHTML: function() {
       return '<div id="' + this.id + '"></div>';
     },
   }
});

var Conversation = FOAM({
  model_: 'Model',
  name: 'Conversation',

  tableProperties: [
    'recipients',
    'subject',
    'timestamp',
  ],

  ids: [ 'id' ],

  properties: [
    {
      name: 'id',
    },
    {
      name: 'recipients',
      tableWidth: '100',
    },
    {
      model_: 'StringProperty',
      name: 'subject',
      shortName: 's',
      mode: 'read-write',
      required: true,
      displayWidth: 100,
      tableWidth: '45%',
      view: 'TextFieldView',
      tableFormatter: function(s, self, view) {
        var sanitizedSubject = view.strToHTML(s);
        if (self.isUnread) {
          return '<b>' + sanitizedSubject + '</b>';
        } else {
          return sanitizedSubject;
        }
      },
    },
    {
      name: 'timestamp',
      model_: 'DateProperty',
      tableWidth: '75',
    },
    {
      name: 'emails',
      view: 'EMailsView',
    },
    {
      name: 'isUnread',
    },
    {
       model_: 'StringArrayProperty',
       name: 'labels',
       view: 'LabelView',
       help: 'Email labels.',
       postSet: function(oldValue, newValue) {
         if (!newValue || !newValue.length) return;
         var self = this;
         this.isUnread = false;
         EMailLabelDAO.find(EQ(EMailLabel.DISPLAY_NAME, '^u'), {put: function(unreadLabel) {
           newValue.forEach(function(label) {
             if (label == unreadLabel.id) {
               self.isUnread = true;
             }
           });
         }});
       },
    },
  ],

  listeners: [
    {
      // For some reason, when isAnimated is true, nothing renders.
      //isAnimated: true,
      name: 'update',
      code: function() {
        if (!this.emails || this.emails.length === 0) return;
        // TODO the primary email should be the most recent email that matches the query
        // that we haven't yet given this model.
        var primaryEmail = this.emails[0];

        this.subject = primaryEmail.subject;

        var allSenders = [];
        var seenSenders = {};
        for (var i = 0, m; m = this.emails[i]; i++) {
          // TODO this needs work:
          // 1. bold unread
          // 2. strip last names when more than one name
          // 3. limit to 3 senders (first sender followed by last two i think)
          // 4. dont dedupe senders that have an unread and a read message. They should show twice.
          if (!seenSenders[m.from]) {
            allSenders.push(EMail.FROM.tableFormatter(m.from));
            seenSenders[m.from] = true;
          }
        }
        this.recipients = allSenders.join(', ');
        if (this.emails.length > 1) {
          this.recipients += ' (' + this.emails.length + ')';
        }
        this.timestamp = primaryEmail.timestamp;

        // Concat all of the labels together.
        var m = {};
        this.emails.forEach(function(e) { e.labels.forEach(function(l) { m[l] = 1; }); });
        this.labels = Object.keys(m);
      }
    }
  ],

  methods: {
    put: function(email) {
      if (!this.emails) this.emails = [];
      this.emails.put(email);
      this.id = email.convId;
      this.update();
    },
    remove: function(email) {
      if (!this.emails) this.emails = [];
      for ( var i = 0; i < this.emails.length; i++ ) {
        if ( email.id === this.emails[i].id ) {
          this.emails.splice(i--, 1);
        }
      }
      this.update();
    }
  },

  actions: [
    {
       model_: 'ConversationAction',
       delegate: EMail.REPLY,
       applyOnAll: false,
    },
    {
       model_: 'ConversationAction',
       delegate: EMail.REPLY_ALL,
       applyOnAll: false,
    },
    {
       model_: 'ConversationAction',
       delegate: EMail.FORWARD,
       applyOnAll: false,
    },
    {
       model_: 'ConversationAction',
       delegate: EMail.STAR,
       applyOnAll: false,
    },
    {
       model_: 'ConversationAction',
       delegate: EMail.ARCHIVE,
    },
    {
       model_: 'ConversationAction',
       delegate: EMail.SPAM,
    },
    {
       model_: 'ConversationAction',
       delegate: EMail.TRASH,
    },
    {
      model_: 'ConversationAction',
      delegate: EMail.OPEN,
    }
  ]
});
