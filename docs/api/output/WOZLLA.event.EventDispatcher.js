Ext.data.JsonP.WOZLLA_event_EventDispatcher({"tagname":"class","name":"WOZLLA.event.EventDispatcher","autodetected":{},"files":[{"filename":"WOZLLA.0.5.1.js","href":"WOZLLA.0.5.1.html#WOZLLA-event-EventDispatcher"}],"members":[{"name":"addListener","tagname":"method","owner":"WOZLLA.event.EventDispatcher","id":"method-addListener","meta":{}},{"name":"clearAllListeners","tagname":"method","owner":"WOZLLA.event.EventDispatcher","id":"method-clearAllListeners","meta":{}},{"name":"clearListeners","tagname":"method","owner":"WOZLLA.event.EventDispatcher","id":"method-clearListeners","meta":{}},{"name":"dispatch","tagname":"method","owner":"WOZLLA.event.EventDispatcher","id":"method-dispatch","meta":{}},{"name":"getListenerCount","tagname":"method","owner":"WOZLLA.event.EventDispatcher","id":"method-getListenerCount","meta":{}},{"name":"hasListener","tagname":"method","owner":"WOZLLA.event.EventDispatcher","id":"method-hasListener","meta":{}},{"name":"removeListener","tagname":"method","owner":"WOZLLA.event.EventDispatcher","id":"method-removeListener","meta":{}},{"name":"setBubbleParent","tagname":"method","owner":"WOZLLA.event.EventDispatcher","id":"method-setBubbleParent","meta":{}}],"alternateClassNames":[],"aliases":{},"id":"class-WOZLLA.event.EventDispatcher","component":false,"superclasses":[],"subclasses":["WOZLLA.Component","WOZLLA.GameObject","WOZLLA.assets.Asset"],"mixedInto":[],"mixins":[],"parentMixins":[],"requires":[],"uses":[],"html":"<div><pre class=\"hierarchy\"><h4>Subclasses</h4><div class='dependency'><a href='#!/api/WOZLLA.Component' rel='WOZLLA.Component' class='docClass'>WOZLLA.Component</a></div><div class='dependency'><a href='#!/api/WOZLLA.GameObject' rel='WOZLLA.GameObject' class='docClass'>WOZLLA.GameObject</a></div><div class='dependency'><a href='#!/api/WOZLLA.assets.Asset' rel='WOZLLA.assets.Asset' class='docClass'>WOZLLA.assets.Asset</a></div><h4>Files</h4><div class='dependency'><a href='source/WOZLLA.0.5.1.html#WOZLLA-event-EventDispatcher' target='_blank'>WOZLLA.0.5.1.js</a></div></pre><div class='doc-contents'><p>Base class for bubblable event system</p>\n</div><div class='members'><div class='members-section'><div class='definedBy'>Defined By</div><h3 class='members-title icon-method'>Methods</h3><div class='subsection'><div id='method-addListener' class='member first-child not-inherited'><a href='#' class='side expandable'><span>&nbsp;</span></a><div class='title'><div class='meta'><span class='defined-in' rel='WOZLLA.event.EventDispatcher'>WOZLLA.event.EventDispatcher</span><br/><a href='source/WOZLLA.0.5.1.html#WOZLLA-event-EventDispatcher-method-addListener' target='_blank' class='view-source'>view source</a></div><a href='#!/api/WOZLLA.event.EventDispatcher-method-addListener' class='name expandable'>addListener</a>( <span class='pre'>type, useCapture</span> )<span class=\"signature\"></span></div><div class='description'><div class='short'> ...</div><div class='long'>\n<h3 class=\"pa\">Parameters</h3><ul><li><span class='pre'>type</span> : string<div class='sub-desc'>\n</div></li><li><span class='pre'>useCapture</span> : boolean<div class='sub-desc'><p>true to check capture phase, false to check bubble and target phases.</p>\n</div></li></ul></div></div></div><div id='method-clearAllListeners' class='member  not-inherited'><a href='#' class='side expandable'><span>&nbsp;</span></a><div class='title'><div class='meta'><span class='defined-in' rel='WOZLLA.event.EventDispatcher'>WOZLLA.event.EventDispatcher</span><br/><a href='source/WOZLLA.0.5.1.html#WOZLLA-event-EventDispatcher-method-clearAllListeners' target='_blank' class='view-source'>view source</a></div><a href='#!/api/WOZLLA.event.EventDispatcher-method-clearAllListeners' class='name expandable'>clearAllListeners</a>( <span class='pre'></span> )<span class=\"signature\"></span></div><div class='description'><div class='short'>clear all listeners ...</div><div class='long'><p>clear all listeners</p>\n</div></div></div><div id='method-clearListeners' class='member  not-inherited'><a href='#' class='side expandable'><span>&nbsp;</span></a><div class='title'><div class='meta'><span class='defined-in' rel='WOZLLA.event.EventDispatcher'>WOZLLA.event.EventDispatcher</span><br/><a href='source/WOZLLA.0.5.1.html#WOZLLA-event-EventDispatcher-method-clearListeners' target='_blank' class='view-source'>view source</a></div><a href='#!/api/WOZLLA.event.EventDispatcher-method-clearListeners' class='name expandable'>clearListeners</a>( <span class='pre'>type, useCapture</span> )<span class=\"signature\"></span></div><div class='description'><div class='short'> ...</div><div class='long'>\n<h3 class=\"pa\">Parameters</h3><ul><li><span class='pre'>type</span> : string<div class='sub-desc'>\n</div></li><li><span class='pre'>useCapture</span> : boolean<div class='sub-desc'><p>true to check capture phase, false to check bubble and target phases.</p>\n</div></li></ul></div></div></div><div id='method-dispatch' class='member  not-inherited'><a href='#' class='side expandable'><span>&nbsp;</span></a><div class='title'><div class='meta'><span class='defined-in' rel='WOZLLA.event.EventDispatcher'>WOZLLA.event.EventDispatcher</span><br/><a href='source/WOZLLA.0.5.1.html#WOZLLA-event-EventDispatcher-method-dispatch' target='_blank' class='view-source'>view source</a></div><a href='#!/api/WOZLLA.event.EventDispatcher-method-dispatch' class='name expandable'>dispatch</a>( <span class='pre'>event</span> )<span class=\"signature\"></span></div><div class='description'><div class='short'>an event ...</div><div class='long'><p>an event</p>\n<h3 class=\"pa\">Parameters</h3><ul><li><span class='pre'>event</span> : <a href=\"#!/api/WOZLLA.event.Event\" rel=\"WOZLLA.event.Event\" class=\"docClass\">WOZLLA.event.Event</a><div class='sub-desc'>\n</div></li></ul></div></div></div><div id='method-getListenerCount' class='member  not-inherited'><a href='#' class='side expandable'><span>&nbsp;</span></a><div class='title'><div class='meta'><span class='defined-in' rel='WOZLLA.event.EventDispatcher'>WOZLLA.event.EventDispatcher</span><br/><a href='source/WOZLLA.0.5.1.html#WOZLLA-event-EventDispatcher-method-getListenerCount' target='_blank' class='view-source'>view source</a></div><a href='#!/api/WOZLLA.event.EventDispatcher-method-getListenerCount' class='name expandable'>getListenerCount</a>( <span class='pre'>type, useCapture</span> ) : number<span class=\"signature\"></span></div><div class='description'><div class='short'> ...</div><div class='long'>\n<h3 class=\"pa\">Parameters</h3><ul><li><span class='pre'>type</span> : string<div class='sub-desc'>\n</div></li><li><span class='pre'>useCapture</span> : boolean<div class='sub-desc'><p>true to check capture phase, false to check bubble and target phases.</p>\n</div></li></ul><h3 class='pa'>Returns</h3><ul><li><span class='pre'>number</span><div class='sub-desc'>\n</div></li></ul></div></div></div><div id='method-hasListener' class='member  not-inherited'><a href='#' class='side expandable'><span>&nbsp;</span></a><div class='title'><div class='meta'><span class='defined-in' rel='WOZLLA.event.EventDispatcher'>WOZLLA.event.EventDispatcher</span><br/><a href='source/WOZLLA.0.5.1.html#WOZLLA-event-EventDispatcher-method-hasListener' target='_blank' class='view-source'>view source</a></div><a href='#!/api/WOZLLA.event.EventDispatcher-method-hasListener' class='name expandable'>hasListener</a>( <span class='pre'>type, useCapture</span> )<span class=\"signature\"></span></div><div class='description'><div class='short'> ...</div><div class='long'>\n<h3 class=\"pa\">Parameters</h3><ul><li><span class='pre'>type</span> : string<div class='sub-desc'>\n</div></li><li><span class='pre'>useCapture</span> : boolean<div class='sub-desc'><p>true to check capture phase, false to check bubble and target phases.</p>\n</div></li></ul></div></div></div><div id='method-removeListener' class='member  not-inherited'><a href='#' class='side expandable'><span>&nbsp;</span></a><div class='title'><div class='meta'><span class='defined-in' rel='WOZLLA.event.EventDispatcher'>WOZLLA.event.EventDispatcher</span><br/><a href='source/WOZLLA.0.5.1.html#WOZLLA-event-EventDispatcher-method-removeListener' target='_blank' class='view-source'>view source</a></div><a href='#!/api/WOZLLA.event.EventDispatcher-method-removeListener' class='name expandable'>removeListener</a>( <span class='pre'>type, useCapture</span> )<span class=\"signature\"></span></div><div class='description'><div class='short'> ...</div><div class='long'>\n<h3 class=\"pa\">Parameters</h3><ul><li><span class='pre'>type</span> : string<div class='sub-desc'>\n</div></li><li><span class='pre'>useCapture</span> : boolean<div class='sub-desc'><p>true to check capture phase, false to check bubble and target phases.</p>\n</div></li></ul></div></div></div><div id='method-setBubbleParent' class='member  not-inherited'><a href='#' class='side expandable'><span>&nbsp;</span></a><div class='title'><div class='meta'><span class='defined-in' rel='WOZLLA.event.EventDispatcher'>WOZLLA.event.EventDispatcher</span><br/><a href='source/WOZLLA.0.5.1.html#WOZLLA-event-EventDispatcher-method-setBubbleParent' target='_blank' class='view-source'>view source</a></div><a href='#!/api/WOZLLA.event.EventDispatcher-method-setBubbleParent' class='name expandable'>setBubbleParent</a>( <span class='pre'>bubbleParent</span> )<span class=\"signature\"></span></div><div class='description'><div class='short'>set bubble parent of this dispatcher ...</div><div class='long'><p>set bubble parent of this dispatcher</p>\n<h3 class=\"pa\">Parameters</h3><ul><li><span class='pre'>bubbleParent</span> : <a href=\"#!/api/WOZLLA.event.EventDispatcher\" rel=\"WOZLLA.event.EventDispatcher\" class=\"docClass\">WOZLLA.event.EventDispatcher</a><div class='sub-desc'>\n</div></li></ul></div></div></div></div></div></div></div>","meta":{}});