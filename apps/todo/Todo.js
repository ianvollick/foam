(function () {
	'use strict';
	// Necessary JSHint options. MODEL is not a constructor, just a global function.
	// (It creates a trampoline that returns quickly, and will build the model when first used.)
	/* jshint newcap: false */
	MODEL({
		name: 'TodoDAO',
		extendsModel: 'ProxyDAO',
		methods: {
			put: function(issue, s) {
				// If the user tried to put an empty text, remove the entry instead.
				if (!issue.text) this.remove(issue.id, { remove: s && s.put });
				else this.SUPER(issue, s);
			}
		}
	});

	MODEL({
		name: 'Todo',
		properties: [
			'id',
			{ name: 'completed', model_: 'BooleanProperty' },
			{ name: 'text', preSet: function (_, text) { return text.trim(); } }
		],
		templates: [ function toDetailHTML() {/*
			<li id="{{{this.id}}}">
				<div class="view">
					$$completed{className: 'toggle'}
					$$text{mode: 'read-only', tagName: 'label'}
					<button class="destroy" id="<%= this.on('click', function() { this.parent.dao.remove(this.obj); }) %>"></button>
				</div>
				$$text{className: 'edit'}
			</li>
			<%
				var toEdit    = function() { DOM.setClass(this.$, 'editing'); this.textView.focus(); }.bind(this);
				var toDisplay = function() { DOM.setClass(this.$, 'editing', false); }.bind(this);
				this.on('dblclick', toEdit, this.id);
				this.on('blur',	toDisplay, this.textView.id);
				this.textView.subscribe(this.textView.ESCAPE, toDisplay);
				this.setClass('completed', function() { return this.obj.completed; }.bind(this), this.id);
			%> */} ]
	});

	MODEL({
		name: 'Controller',
		properties: [
			{
				name: 'input',
				setter: function(text) {
					// This is a fake property that adds the todo when its value gets saved.
					if (!text) return;
					this.dao.put(Todo.create({text: text}));
					this.propertyChange('input', text, '');
				},
				view: { model_: 'TextFieldView', placeholder: 'What needs to be done?' }
			},
			{ name: 'dao' },
			{ name: 'filteredDAO',    model_: 'DAOProperty', view: { model_: 'DAOListView' } },
			{ name: 'completedCount', model_: 'IntProperty' },
			{ name: 'activeCount',    model_: 'IntProperty', postSet: function(_, c) { this.toggle = !c; }},
			{ name: 'toggle',         model_: 'BooleanProperty', postSet: function(_, n) {
				if ( n == this.activeCount > 0 ) {
					this.dao.update(SET(Todo.COMPLETED, n));
				}
			}},
			{
				name: 'query',
				postSet: function(_, q) { this.filteredDAO = this.dao.where(q); },
				defaultValue: TRUE,
				view: { model_: 'ChoiceListView', choices: [ [ TRUE, 'All' ], [ NOT(Todo.COMPLETED), 'Active' ], [ Todo.COMPLETED, 'Completed' ] ] }
			}
		],
		actions: [
			{
				name: 'clear',
				labelFn:   function() { return 'Clear completed (' + this.completedCount + ')'; },
				isEnabled: function() { return this.completedCount; },
				action:    function() { this.dao.where(Todo.COMPLETED).removeAll(); }
			}
		],
		listeners: [
			{
				name: 'onDAOUpdate',
				isAnimated: true,
				code: function() {
					this.dao.select(GROUP_BY(Todo.COMPLETED, COUNT()))(function (q) {
						this.completedCount = q.groups[true];
						this.activeCount    = q.groups[false];
					}.bind(this));
				}
			}
		],
		methods: {
			init: function() {
				this.SUPER();
				this.filteredDAO = this.dao = TodoDAO.create({
					delegate: EasyDAO.create({model: Todo, seqNo: true, daoType: 'StorageDAO', name: 'todos-foam'}) });
				this.dao.listen(this.onDAOUpdate);
				this.onDAOUpdate();
			}
		},
		templates: [ function toDetailHTML() {/*
			<section id="todoapp">
				<header id="header">
					<h1>todos</h1>
					$$input{id: 'new-todo'}
				</header>
				<section id="main">
					$$toggle{id: 'toggle-all', showLabel: false}
					$$filteredDAO{tagName: 'ul', id: 'todo-list'}
				</section>
				<footer id="footer">
					<span id="todo-count">
						<strong>$$activeCount{mode: 'read-only'}</strong> item<%# this.obj.activeCount == 1 ? '' : 's' %> left
					</span>
					$$query{id: 'filters'}
					$$clear{id: 'clear-completed'}
				</footer>
			</section>
			<footer id="info">
				<p>Double-click to edit a todo</p>
				<p>Created by <a href="mailto:kgr@chromium.org">Kevin Greer</a></p>
				{{{FOAM_POWERED}}}
				<p>Part of <a href="http://todomvc.com">TodoMVC</a></p>
			</footer>
			<%
				var f = function() { return this.completedCount + this.activeCount == 0; }.bind(this.data);
				this.setClass('hidden', f, 'main');
				this.setClass('hidden', f, 'footer');
				Events.link(this.X.memento, this.queryView.label$);
			%> */ } ]
	});
})();
// vim: noexpandtab ts=2 sts=2 sw=2
