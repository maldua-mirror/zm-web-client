/*
 * ***** BEGIN LICENSE BLOCK *****
 * Version: ZPL 1.1
 * 
 * The contents of this file are subject to the Zimbra Public License
 * Version 1.1 ("License"); you may not use this file except in
 * compliance with the License. You may obtain a copy of the License at
 * http://www.zimbra.com/license
 * 
 * Software distributed under the License is distributed on an "AS IS"
 * basis, WITHOUT WARRANTY OF ANY KIND, either express or implied. See
 * the License for the specific language governing rights and limitations
 * under the License.
 * 
 * The Original Code is: Zimbra Collaboration Suite.
 * 
 * The Initial Developer of the Original Code is Zimbra, Inc.
 * Portions created by Zimbra are Copyright (C) 2005 Zimbra, Inc.
 * All Rights Reserved.
 * 
 * Contributor(s):
 * 
 * ***** END LICENSE BLOCK *****
 */

function ZmTag(id, name, color, parent, tree, numUnread) {

	ZmOrganizer.call(this, ZmOrganizer.TAG, id, name, parent, tree, numUnread);
	color = color || ZmTag.DEFAULT_COLOR;
	this.color = color;
}

ZmTag.prototype = new ZmOrganizer;
ZmTag.prototype.constructor = ZmTag;

ZmTag.prototype.toString = 
function() {
	return "ZmTag";
}

// tag colors - these are the server values
ZmTag.C_ORANGE	= 0;
ZmTag.C_BLUE	= 1;
ZmTag.C_CYAN	= 2;
ZmTag.C_GREEN	= 3;
ZmTag.C_PURPLE	= 4;
ZmTag.C_RED		= 5;
ZmTag.C_YELLOW	= 6;
ZmTag.MAX_COLOR	= ZmTag.C_YELLOW;
ZmTag.DEFAULT_COLOR = ZmTag.C_ORANGE;

// color names
ZmTag.COLOR_TEXT = new Object();
ZmTag.COLOR_TEXT[ZmTag.C_ORANGE]	= ZmMsg.orange;
ZmTag.COLOR_TEXT[ZmTag.C_BLUE]		= ZmMsg.blue;
ZmTag.COLOR_TEXT[ZmTag.C_CYAN]		= ZmMsg.cyan;
ZmTag.COLOR_TEXT[ZmTag.C_GREEN]		= ZmMsg.green;
ZmTag.COLOR_TEXT[ZmTag.C_PURPLE]	= ZmMsg.purple;
ZmTag.COLOR_TEXT[ZmTag.C_RED]		= ZmMsg.red;
ZmTag.COLOR_TEXT[ZmTag.C_YELLOW]	= ZmMsg.yellow;

// color icons
ZmTag.COLOR_ICON = new Object();
ZmTag.COLOR_ICON[ZmTag.C_ORANGE]	= "TagOrange";
ZmTag.COLOR_ICON[ZmTag.C_BLUE]		= "TagBlue";
ZmTag.COLOR_ICON[ZmTag.C_CYAN]		= "TagCyan";
ZmTag.COLOR_ICON[ZmTag.C_GREEN]		= "TagGreen";
ZmTag.COLOR_ICON[ZmTag.C_PURPLE]	= "TagPurple";
ZmTag.COLOR_ICON[ZmTag.C_RED]		= "TagRed";
ZmTag.COLOR_ICON[ZmTag.C_YELLOW]	= "TagYellow";

// color mini icons
ZmTag.COLOR_MINI_ICON = new Object();
ZmTag.COLOR_MINI_ICON[ZmTag.C_ORANGE]	= "MiniTagOrange";
ZmTag.COLOR_MINI_ICON[ZmTag.C_BLUE]		= "MiniTagBlue";
ZmTag.COLOR_MINI_ICON[ZmTag.C_CYAN]		= "MiniTagCyan";
ZmTag.COLOR_MINI_ICON[ZmTag.C_GREEN]	= "MiniTagGreen";
ZmTag.COLOR_MINI_ICON[ZmTag.C_PURPLE]	= "MiniTagPurple";
ZmTag.COLOR_MINI_ICON[ZmTag.C_RED]		= "MiniTagRed";
ZmTag.COLOR_MINI_ICON[ZmTag.C_YELLOW]	= "MiniTagYellow";

// system tags
ZmTag.ID_ROOT = ZmOrganizer.ID_ROOT;
ZmTag.ID_UNREAD		= 32;
ZmTag.ID_FLAGGED	= 33;
ZmTag.ID_FROM_ME	= 34;
ZmTag.ID_REPLIED	= 35;
ZmTag.ID_FORWARDED	= 36;
ZmTag.ID_ATTACHED	= 37;
ZmTag.FIRST_USER_ID	= 64;

ZmTag.sortCompare = 
function(tagA, tagB) {
	if (tagA.name.toLowerCase() > tagB.name.toLowerCase()) return 1;
	if (tagA.name.toLowerCase() < tagB.name.toLowerCase()) return -1;
	return 0;
}

ZmTag.checkName =
function(name) {
	var msg = ZmOrganizer.checkName(name);
	if (msg) return msg;

	if (name.indexOf('\\') == 0)
		return AjxStringUtil.resolve(ZmMsg.errorInvalidName, name);

	return null;
}

ZmTag.prototype.create =
function(name, color) {
	color = ZmTag.checkColor(color);
	var soapDoc = AjxSoapDoc.create("CreateTagRequest", "urn:zimbraMail");
	var tagNode = soapDoc.set("tag");
	tagNode.setAttribute("name", name);
	tagNode.setAttribute("color", color);
	var resp = this.tree._appCtxt.getAppController().sendRequest(soapDoc).firstChild;
}

ZmTag.prototype.notifyCreate =
function(obj) {
	var child = ZmTag.createFromJs(this, obj, this.tree, true);
	this._eventNotify(ZmEvent.E_CREATE, child);
}

ZmTag.prototype.notifyModify =
function(obj) {
	if (!obj) return;
	
	var fields = ZmOrganizer.prototype._getCommonFields.call(this, obj);
	if (obj.color) {
		var color = ZmTag.checkColor(obj.color);
		if (this.color != color) {
			this.color = color;
			fields[ZmOrganizer.F_COLOR] = true;
		}
	}
	this._eventNotify(ZmEvent.E_MODIFY, this, {fields: fields});
}

ZmTag.prototype.setColor =
function(color) {
	var color = ZmTag.checkColor(color);
	if (this.color == color) return;
	var success = this._organizerAction("color", {color: color});
	if (success) {
		this.color = color;
		var fields = new Object();
		fields[ZmOrganizer.F_COLOR] = true;
		this._eventNotify(ZmEvent.E_MODIFY, this, {fields: fields});
	}
}

/**
* Tags come from back end as a flat list, and we manually create a root tag, so all tags
* have the root as parent. If tags ever have a tree structure, then this should do what
* ZmFolder does (recursively create children).
*/
ZmTag.createFromJs =
function(parent, obj, tree, sorted) {
	if (obj.id < ZmTag.FIRST_USER_ID)
		return;
	var tag = new ZmTag(obj.id, obj.name, ZmTag.checkColor(obj.color), parent, tree, obj.u);
	var index = sorted ? ZmOrganizer.getSortIndex(tag, ZmTag.sortCompare) : null;
	parent.children.add(tag, index);

	return tag;
}

ZmTag.checkColor =
function(color) {
	return ((color != null) && (color >= 0 && color <= ZmTag.MAX_COLOR)) ? color : ZmTag.DEFAULT_COLOR;
}


ZmTag.prototype.getIcon = 
function() {
	return ZmTag.COLOR_ICON[this.color];
}
