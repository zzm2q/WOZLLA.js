Ext.data.JsonP.WOZLLA_Behaviour({"tagname":"class","name":"WOZLLA.Behaviour","autodetected":{},"files":[{"filename":"WOZLLA.0.5.1.js","href":"WOZLLA.0.5.1.html#WOZLLA-Behaviour"}],"extends":"WOZLLA.Component","abstract":true,"members":[{"name":"enabled","tagname":"property","owner":"WOZLLA.Behaviour","id":"property-enabled","meta":{}},{"name":"gameObject","tagname":"property","owner":"WOZLLA.Component","id":"property-gameObject","meta":{"readonly":true}},{"name":"transform","tagname":"property","owner":"WOZLLA.Component","id":"property-transform","meta":{}},{"name":"addListener","tagname":"method","owner":"WOZLLA.event.EventDispatcher","id":"method-addListener","meta":{}},{"name":"clearAllListeners","tagname":"method","owner":"WOZLLA.event.EventDispatcher","id":"method-clearAllListeners","meta":{}},{"name":"clearListeners","tagname":"method","owner":"WOZLLA.event.EventDispatcher","id":"method-clearListeners","meta":{}},{"name":"create","tagname":"method","owner":"WOZLLA.Component","id":"method-create","meta":{}},{"name":"destroy","tagname":"method","owner":"WOZLLA.Component","id":"method-destroy","meta":{}},{"name":"dispatch","tagname":"method","owner":"WOZLLA.event.EventDispatcher","id":"method-dispatch","meta":{}},{"name":"getListenerCount","tagname":"method","owner":"WOZLLA.event.EventDispatcher","id":"method-getListenerCount","meta":{}},{"name":"hasListener","tagname":"method","owner":"WOZLLA.event.EventDispatcher","id":"method-hasListener","meta":{}},{"name":"init","tagname":"method","owner":"WOZLLA.Component","id":"method-init","meta":{}},{"name":"removeListener","tagname":"method","owner":"WOZLLA.event.EventDispatcher","id":"method-removeListener","meta":{}},{"name":"setBubbleParent","tagname":"method","owner":"WOZLLA.event.EventDispatcher","id":"method-setBubbleParent","meta":{}},{"name":"update","tagname":"method","owner":"WOZLLA.Behaviour","id":"method-update","meta":{}}],"alternateClassNames":[],"aliases":{},"id":"class-WOZLLA.Behaviour","short_doc":"Abstract base class for all behaviours, the update function would be call\nby WOZLLA engine every frame when the gameO...","component":false,"superclasses":["WOZLLA.event.EventDispatcher","WOZLLA.Component"],"subclasses":[],"mixedInto":[],"mixins":[],"parentMixins":[],"requires":[],"uses":[],"html":"<div><pre class=\"hierarchy\"><h4>Hierarchy</h4><div class='subclass first-child'><a href='#!/api/WOZLLA.event.EventDispatcher' rel='WOZLLA.event.EventDispatcher' class='docClass'>WOZLLA.event.EventDispatcher</a><div class='subclass '><a href='#!/api/WOZLLA.Component' rel='WOZLLA.Component' class='docClass'>WOZLLA.Component</a><div class='subclass '><strong>WOZLLA.Behaviour</strong></div></div></div><h4>Files</h4><div class='dependency'><a href='source/WOZLLA.0.5.1.html#WOZLLA-Behaviour' target='_blank'>WOZLLA.0.5.1.js</a></div></pre><div class='doc-contents'><p>Abstract base class for all behaviours, the <a href=\"#!/api/WOZLLA.Behaviour-method-update\" rel=\"WOZLLA.Behaviour-method-update\" class=\"docClass\">update</a> function would be call\nby WOZLLA engine every frame when the gameObject is actived and the property enabled of this behaviour is true</p>\n</div><div class='members'><div class='members-section'><div class='definedBy'>Defined By</div><h3 class='members-title icon-property'>Properties</h3><div class='subsection'><div id='property-enabled' class='member first-child not-inherited'><a href='#' class='side expandable'><span>&nbsp;</span></a><div class='title'><div class='meta'><span class='defined-in' rel='WOZLLA.Behaviour'>WOZLLA.Behaviour</span><br/><a href='source/WOZLLA.0.5.1.html#WOZLLA-Behaviour-property-enabled' target='_blank' class='view-source'>view source</a></div><a href='#!/api/WOZLLA.Behaviour-property-enabled' class='name expandable'>enabled</a> : boolean<span class=\"signature\"></span></div><div class='description'><div class='short'>enabled or disabled this behaviour ...</div><div class='long'><p>enabled or disabled this behaviour</p>\n<p>Defaults to: <code>true</code></p></div></div></div><div id='property-gameObject' class='member  inherited'><a href='#' class='side expandable'><span>&nbsp;</span></a><div class='title'><div class='meta'><a href='#!/api/WOZLLA.Component' rel='WOZLLA.Component' class='defined-in docClass'>WOZLLA.Component</a><br/><a href='source/WOZLLA.0.5.1.html#WOZLLA-Component-property-gameObject' target='_blank' class='view-source'>view source</a></div><a href='#!/api/WOZLLA.Component-property-gameObject' class='name expandable'>gameObject</a> : <a href=\"#!/api/WOZLLA.GameObject\" rel=\"WOZLLA.GameObject\" class=\"docClass\">WOZLLA.GameObject</a><span class=\"signature\"><span class='readonly' >readonly</span></span></div><div class='description'><div class='short'><p>get the GameObject of this component belongs to.</p>\n</div><div class='long'><p>get the GameObject of this component belongs to.</p>\n</div></div></div><div id='property-transform' class='member  inherited'><a href='#' class='side expandable'><span>&nbsp;</span></a><div class='title'><div class='meta'><a href='#!/api/WOZLLA.Component' rel='WOZLLA.Component' class='defined-in docClass'>WOZLLA.Component</a><br/><a href='source/WOZLLA.0.5.1.html#WOZLLA-Component-property-transform' target='_blank' class='view-source'>view source</a></div><a href='#!/api/WOZLLA.Component-property-transform' class='name expandable'>transform</a> : <a href=\"#!/api/WOZLLA.Transform\" rel=\"WOZLLA.Transform\" class=\"docClass\">WOZLLA.Transform</a><span class=\"signature\"></span></div><div class='description'><div class='short'><p>get transform of the gameObject of this component</p>\n</div><div class='long'><p>get transform of the gameObject of this component</p>\n</div></div></div></div></div><div class='members-section'><div class='definedBy'>Defined By</div><h3 class='members-title icon-method'>Methods</h3><div class='subsection'><div id='method-addListener' class='member first-child inherited'><a href='#' class='side expandable'><span>&nbsp;</span></a><div class='title'><div class='meta'><a href='#!/api/WOZLLA.event.EventDispatcher' rel='WOZLLA.event.EventDispatcher' class='defined-in docClass'>WOZLLA.event.EventDispatcher</a><br/><a href='source/WOZLLA.0.5.1.html#WOZLLA-event-EventDispatcher-method-addListener' target='_blank' class='view-source'>view source</a></div><a href='#!/api/WOZLLA.event.EventDispatcher-method-addListener' class='name expandable'>addListener</a>( <span class='pre'>type, useCapture</span> )<span class=\"signature\"></span></div><div class='description'><div class='short'> ...</div><div class='long'>\n<h3 class=\"pa\">Parameters</h3><ul><li><span class='pre'>type</span> : string<div class='sub-desc'>\n</div></li><li><span class='pre'>useCapture</span> : boolean<div class='sub-desc'><p>true to check capture phase, false to check bubble and target phases.</p>\n</div></li></ul></div></div></div><div id='method-clearAllListeners' class='member  inherited'><a href='#' class='side expandable'><span>&nbsp;</span></a><div class='title'><div class='meta'><a href='#!/api/WOZLLA.event.EventDispatcher' rel='WOZLLA.event.EventDispatcher' class='defined-in docClass'>WOZLLA.event.EventDispatcher</a><br/><a href='source/WOZLLA.0.5.1.html#WOZLLA-event-EventDispatcher-method-clearAllListeners' target='_blank' class='view-source'>view source</a></div><a href='#!/api/WOZLLA.event.EventDispatcher-method-clearAllListeners' class='name expandable'>clearAllListeners</a>( <span class='pre'></span> )<span class=\"signature\"></span></div><div class='description'><div class='short'>clear all listeners ...</div><div class='long'><p>clear all listeners</p>\n</div></div></div><div id='method-clearListeners' class='member  inherited'><a href='#' class='side expandable'><span>&nbsp;</span></a><div class='title'><div class='meta'><a href='#!/api/WOZLLA.event.EventDispatcher' rel='WOZLLA.event.EventDispatcher' class='defined-in docClass'>WOZLLA.event.EventDispatcher</a><br/><a href='source/WOZLLA.0.5.1.html#WOZLLA-event-EventDispatcher-method-clearListeners' target='_blank' class='view-source'>view source</a></div><a href='#!/api/WOZLLA.event.EventDispatcher-method-clearListeners' class='name expandable'>clearListeners</a>( <span class='pre'>type, useCapture</span> )<span class=\"signature\"></span></div><div class='description'><div class='short'> ...</div><div class='long'>\n<h3 class=\"pa\">Parameters</h3><ul><li><span class='pre'>type</span> : string<div class='sub-desc'>\n</div></li><li><span class='pre'>useCapture</span> : boolean<div class='sub-desc'><p>true to check capture phase, false to check bubble and target phases.</p>\n</div></li></ul></div></div></div><div id='method-create' class='member  inherited'><a href='#' class='side expandable'><span>&nbsp;</span></a><div class='title'><div class='meta'><a href='#!/api/WOZLLA.Component' rel='WOZLLA.Component' class='defined-in docClass'>WOZLLA.Component</a><br/><a href='source/WOZLLA.0.5.1.html#WOZLLA-Component-method-create' target='_blank' class='view-source'>view source</a></div><a href='#!/api/WOZLLA.Component-method-create' class='name expandable'>create</a>( <span class='pre'>name</span> ) : <a href=\"#!/api/WOZLLA.Component\" rel=\"WOZLLA.Component\" class=\"docClass\">WOZLLA.Component</a><span class=\"signature\"></span></div><div class='description'><div class='short'>create component by it's registed name. ...</div><div class='long'><p>create component by it's registed name.</p>\n<h3 class=\"pa\">Parameters</h3><ul><li><span class='pre'>name</span> : Object<div class='sub-desc'><p>the component name</p>\n</div></li></ul><h3 class='pa'>Returns</h3><ul><li><span class='pre'><a href=\"#!/api/WOZLLA.Component\" rel=\"WOZLLA.Component\" class=\"docClass\">WOZLLA.Component</a></span><div class='sub-desc'>\n</div></li></ul></div></div></div><div id='method-destroy' class='member  inherited'><a href='#' class='side expandable'><span>&nbsp;</span></a><div class='title'><div class='meta'><a href='#!/api/WOZLLA.Component' rel='WOZLLA.Component' class='defined-in docClass'>WOZLLA.Component</a><br/><a href='source/WOZLLA.0.5.1.html#WOZLLA-Component-method-destroy' target='_blank' class='view-source'>view source</a></div><a href='#!/api/WOZLLA.Component-method-destroy' class='name expandable'>destroy</a>( <span class='pre'></span> )<span class=\"signature\"></span></div><div class='description'><div class='short'>destroy this component ...</div><div class='long'><p>destroy this component</p>\n</div></div></div><div id='method-dispatch' class='member  inherited'><a href='#' class='side expandable'><span>&nbsp;</span></a><div class='title'><div class='meta'><a href='#!/api/WOZLLA.event.EventDispatcher' rel='WOZLLA.event.EventDispatcher' class='defined-in docClass'>WOZLLA.event.EventDispatcher</a><br/><a href='source/WOZLLA.0.5.1.html#WOZLLA-event-EventDispatcher-method-dispatch' target='_blank' class='view-source'>view source</a></div><a href='#!/api/WOZLLA.event.EventDispatcher-method-dispatch' class='name expandable'>dispatch</a>( <span class='pre'>event</span> )<span class=\"signature\"></span></div><div class='description'><div class='short'>an event ...</div><div class='long'><p>an event</p>\n<h3 class=\"pa\">Parameters</h3><ul><li><span class='pre'>event</span> : <a href=\"#!/api/WOZLLA.event.Event\" rel=\"WOZLLA.event.Event\" class=\"docClass\">WOZLLA.event.Event</a><div class='sub-desc'>\n</div></li></ul></div></div></div><div id='method-getListenerCount' class='member  inherited'><a href='#' class='side expandable'><span>&nbsp;</span></a><div class='title'><div class='meta'><a href='#!/api/WOZLLA.event.EventDispatcher' rel='WOZLLA.event.EventDispatcher' class='defined-in docClass'>WOZLLA.event.EventDispatcher</a><br/><a href='source/WOZLLA.0.5.1.html#WOZLLA-event-EventDispatcher-method-getListenerCount' target='_blank' class='view-source'>view source</a></div><a href='#!/api/WOZLLA.event.EventDispatcher-method-getListenerCount' class='name expandable'>getListenerCount</a>( <span class='pre'>type, useCapture</span> ) : number<span class=\"signature\"></span></div><div class='description'><div class='short'> ...</div><div class='long'>\n<h3 class=\"pa\">Parameters</h3><ul><li><span class='pre'>type</span> : string<div class='sub-desc'>\n</div></li><li><span class='pre'>useCapture</span> : boolean<div class='sub-desc'><p>true to check capture phase, false to check bubble and target phases.</p>\n</div></li></ul><h3 class='pa'>Returns</h3><ul><li><span class='pre'>number</span><div class='sub-desc'>\n</div></li></ul></div></div></div><div id='method-hasListener' class='member  inherited'><a href='#' class='side expandable'><span>&nbsp;</span></a><div class='title'><div class='meta'><a href='#!/api/WOZLLA.event.EventDispatcher' rel='WOZLLA.event.EventDispatcher' class='defined-in docClass'>WOZLLA.event.EventDispatcher</a><br/><a href='source/WOZLLA.0.5.1.html#WOZLLA-event-EventDispatcher-method-hasListener' target='_blank' class='view-source'>view source</a></div><a href='#!/api/WOZLLA.event.EventDispatcher-method-hasListener' class='name expandable'>hasListener</a>( <span class='pre'>type, useCapture</span> )<span class=\"signature\"></span></div><div class='description'><div class='short'> ...</div><div class='long'>\n<h3 class=\"pa\">Parameters</h3><ul><li><span class='pre'>type</span> : string<div class='sub-desc'>\n</div></li><li><span class='pre'>useCapture</span> : boolean<div class='sub-desc'><p>true to check capture phase, false to check bubble and target phases.</p>\n</div></li></ul></div></div></div><div id='method-init' class='member  inherited'><a href='#' class='side expandable'><span>&nbsp;</span></a><div class='title'><div class='meta'><a href='#!/api/WOZLLA.Component' rel='WOZLLA.Component' class='defined-in docClass'>WOZLLA.Component</a><br/><a href='source/WOZLLA.0.5.1.html#WOZLLA-Component-method-init' target='_blank' class='view-source'>view source</a></div><a href='#!/api/WOZLLA.Component-method-init' class='name expandable'>init</a>( <span class='pre'></span> )<span class=\"signature\"></span></div><div class='description'><div class='short'>init this component ...</div><div class='long'><p>init this component</p>\n</div></div></div><div id='method-removeListener' class='member  inherited'><a href='#' class='side expandable'><span>&nbsp;</span></a><div class='title'><div class='meta'><a href='#!/api/WOZLLA.event.EventDispatcher' rel='WOZLLA.event.EventDispatcher' class='defined-in docClass'>WOZLLA.event.EventDispatcher</a><br/><a href='source/WOZLLA.0.5.1.html#WOZLLA-event-EventDispatcher-method-removeListener' target='_blank' class='view-source'>view source</a></div><a href='#!/api/WOZLLA.event.EventDispatcher-method-removeListener' class='name expandable'>removeListener</a>( <span class='pre'>type, useCapture</span> )<span class=\"signature\"></span></div><div class='description'><div class='short'> ...</div><div class='long'>\n<h3 class=\"pa\">Parameters</h3><ul><li><span class='pre'>type</span> : string<div class='sub-desc'>\n</div></li><li><span class='pre'>useCapture</span> : boolean<div class='sub-desc'><p>true to check capture phase, false to check bubble and target phases.</p>\n</div></li></ul></div></div></div><div id='method-setBubbleParent' class='member  inherited'><a href='#' class='side expandable'><span>&nbsp;</span></a><div class='title'><div class='meta'><a href='#!/api/WOZLLA.event.EventDispatcher' rel='WOZLLA.event.EventDispatcher' class='defined-in docClass'>WOZLLA.event.EventDispatcher</a><br/><a href='source/WOZLLA.0.5.1.html#WOZLLA-event-EventDispatcher-method-setBubbleParent' target='_blank' class='view-source'>view source</a></div><a href='#!/api/WOZLLA.event.EventDispatcher-method-setBubbleParent' class='name expandable'>setBubbleParent</a>( <span class='pre'>bubbleParent</span> )<span class=\"signature\"></span></div><div class='description'><div class='short'>set bubble parent of this dispatcher ...</div><div class='long'><p>set bubble parent of this dispatcher</p>\n<h3 class=\"pa\">Parameters</h3><ul><li><span class='pre'>bubbleParent</span> : <a href=\"#!/api/WOZLLA.event.EventDispatcher\" rel=\"WOZLLA.event.EventDispatcher\" class=\"docClass\">WOZLLA.event.EventDispatcher</a><div class='sub-desc'>\n</div></li></ul></div></div></div><div id='method-update' class='member  not-inherited'><a href='#' class='side expandable'><span>&nbsp;</span></a><div class='title'><div class='meta'><span class='defined-in' rel='WOZLLA.Behaviour'>WOZLLA.Behaviour</span><br/><a href='source/WOZLLA.0.5.1.html#WOZLLA-Behaviour-method-update' target='_blank' class='view-source'>view source</a></div><a href='#!/api/WOZLLA.Behaviour-method-update' class='name expandable'>update</a>( <span class='pre'></span> )<span class=\"signature\"></span></div><div class='description'><div class='short'>call by Engine every frame ...</div><div class='long'><p>call by Engine every frame</p>\n</div></div></div></div></div></div></div>","meta":{"abstract":true}});