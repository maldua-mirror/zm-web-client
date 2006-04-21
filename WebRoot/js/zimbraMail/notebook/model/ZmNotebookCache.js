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
 * The Original Code is: Zimbra Collaboration Suite Web Client
 * 
 * The Initial Developer of the Original Code is Zimbra, Inc.
 * Portions created by Zimbra are Copyright (C) 2006 Zimbra, Inc.
 * All Rights Reserved.
 * 
 * Contributor(s):
 * 
 * ***** END LICENSE BLOCK *****
 */

function ZmNotebookCache(appCtxt) {
	this._appCtxt = appCtxt;
	this.clearCache();
	this._changeListener = new AjxListener(this, this._handleChange);
}

//
// Constants
//

ZmNotebookCache._SPECIAL = {};
ZmNotebookCache._SPECIAL[ZmNotebook.PAGE_INDEX] = [
	"<H2>{{MSG wikiUserPages}}</H2>",
	"<P>",
		"{{TOC}}"
	/***
	"<H2>{{MSG|wikiSpecialPages}}</H2>",
	"<P>",
		"{{TOC|name='_*_'}}"
	/***/
].join("");
ZmNotebookCache._SPECIAL[ZmNotebook.PAGE_CHROME] = [
	"<DIV style='padding:0.5em'>",
		"<H1>{{NAME}}</H1>",
		"<DIV>{{CONTENT}}</DIV>",
	"</DIV>"
].join("");

//
// Data
//

ZmNotebookCache.prototype._appCtxt;

ZmNotebookCache.prototype._idMap;
ZmNotebookCache.prototype._foldersMap;
ZmNotebookCache.prototype._creatorsMap;

ZmNotebookCache.prototype._changeListener;

//
// Public methods
//

// cache management

ZmNotebookCache.prototype.fillCache = function(folderId, callback, errorCallback) {
	var tree = this._appCtxt.getTree(ZmOrganizer.NOTEBOOK);
	var notebook = tree.getById(folderId);
	var path = notebook.getSearchPath();
	var search = 'in:"'+path+'"';

	var soapDoc = AjxSoapDoc.create("SearchRequest", "urn:zimbraMail");
	soapDoc.setMethodAttribute("types", "wiki");
	var queryNode = soapDoc.set("query", search);
		
	var handleResponse = callback ? new AjxCallback(this, this._fillCacheResponse, [folderId, callback]) : null;
	var params = {
		soapDoc: soapDoc,
		asyncMode: Boolean(handleResponse),
		callback: handleResponse,
		errorCallback: errorCallback,
		noBusyOverlay: false
	};
	
	var appController = this._appCtxt.getAppController();
	var response = appController.sendRequest(params);
	
	if (!params.asyncMode) {
		this._fillCacheResponse(folderId, null, response);
	}
};

ZmNotebookCache.prototype.putPage = function(page) {
	if (page.id) { 
		this._idMap[page.id] = page; 
	}
	var folderId = page.folderId || ZmPage.DEFAULT_FOLDER;
	this.getPagesInFolder(folderId)[page.name] = page;
	/*** REVISIT ***/
	var remoteFolderId = page.remoteFolderId;
	if (remoteFolderId) {
		this.getPagesInFolder(remoteFolderId)[page.name] = page;
	}
	/***/
	if (page.creator) {
		this.getPagesByCreator(page.creator)[page.name] = page;
	}
	
	page.addChangeListener(this._changeListener);
};
ZmNotebookCache.prototype.removePage = function(page) {
	if (page.id) { 
		delete this._idMap[page.id]; 
	}
	delete this.getPagesInFolder(page.folderId)[page.name];
	/*** REVISIT ***/
	var remoteFolderId = page.remoteFolderId;
	if (remoteFolderId) {
		delete this.getPagesInFolder(remoteFolderId)[page.name];
	}
	/***/
	if (page.creator) {
		delete this.getPagesByCreator(page.creator)[page.name];
	}
	
	page.removeChangeListener(this._changeListener);
};

ZmNotebookCache.prototype.clearCache = function() {
	this._idMap = {};
	this._foldersMap = {};
	this._creatorsMap = {};
};

// query methods

ZmNotebookCache.prototype.getIds = function() {
	return this._idMap;
};
ZmNotebookCache.prototype.getFolders = function() {
	return this._foldersMap;
};
ZmNotebookCache.prototype.getCreators = function() {
	return this._creatorsMap;
};

ZmNotebookCache.prototype.getPageById = function(id) {
	return this._idMap[id];
};
ZmNotebookCache.prototype.getPageByName = function(folderId, name, recurseUp) {
	var page = this.getPagesInFolder(folderId)[name];
	if (page != null) return page;
	
	if (recurseUp == true) {
		var notebookTree = this._appCtxt.getTree(ZmOrganizer.NOTEBOOK);
		var parent = notebookTree.getById(folderId).parent;
		while (parent != null) {
			var folderMap = this.getPagesInFolder(parent.id);
			if (folderMap && folderMap[name]) {
				// create a proxy page but DO NOT insert it into the parent
				// folderMap -- that way it won't show up in the TOC for the parent
				return this.makeProxyPage(folderMap[name], folderId);
			}
			parent = parent.parent;
		}
	}
	
	if (name in ZmNotebookCache._SPECIAL) {
		return this._generateSpecialPage(folderId, name);
	}
	
	return null;
};

ZmNotebookCache.prototype.getPagesInFolder = function(folderId) {
	folderId = folderId || ZmPage.DEFAULT_FOLDER;
	if (!this._foldersMap[folderId]) {
		this._foldersMap[folderId] = {};
		this.fillCache(folderId);
	}
	return this._foldersMap[folderId];
};


// make a proxy of a page in a different folder
ZmNotebookCache.prototype.makeProxyPage = function(page, folderId) {
	// force the page to get it's content
	// this way we can set the proxy's id to null, but still have the correct content in the proxy
	page.getContent();

	var specialNote = AjxUtil.createProxy(page);
	specialNote.id = null;
	specialNote.folderId = folderId;
	specialNote.version = 0;
	
	return specialNote;
}


ZmNotebookCache.prototype.getPagesByCreator = function(creator) {
	if (!this._creatorsMap[creator]) {
		this._creatorsMap[creator] = {};
	}
	return this._creatorsMap[creator];
};

// Protected methods

ZmNotebookCache.prototype._fillCacheResponse = 
function(folderId, callback, response) {
	if (response && (response.SearchResponse || response._data.SearchResponse)) {
		var searchResponse = response.SearchResponse || response._data.SearchResponse;
		var words = searchResponse.w || [];
		for (var i = 0; i < words.length; i++) {
			var word = words[i];
			var page = this.getPageById(word.id);
			if (!page) {
				page = new ZmPage(this._appCtxt);
				page.set(word);
				/*** REVISIT ***/
				if (folderId != page.folderId) {
					page.remoteFolderId = page.folderId;
					page.folderId = folderId;
				}
				/***/
				this.putPage(page);
			}
			else {
				page.set(word);
			}
		}
	}
	
	if (callback) {
		callback.run();
	}
};

ZmNotebookCache.prototype._handleChange = function(event) {
	debugger;
};

ZmNotebookCache.prototype._generateSpecialPage = function(folderId, name) {
	var page = new ZmPage(this._appCtxt);
	page.name = name;
	page.fragment = "";
	page.setContent(ZmNotebookCache._SPECIAL[name]);
	page.folderId = folderId;
	page.creator = "[auto]"; // i18n
	page.createDate = new Date();
	page.modifier = page.creator;
	page.modifyDate = new Date(page.createDate.getTime());
	//page.version = 0;
	return page;
};