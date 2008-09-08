/*
 * ***** BEGIN LICENSE BLOCK *****
 * 
 * Zimbra Collaboration Suite Web Client
 * Copyright (C) 2007 Zimbra, Inc.
 * 
 * The contents of this file are subject to the Yahoo! Public License
 * Version 1.0 ("License"); you may not use this file except in
 * compliance with the License.  You may obtain a copy of the License at
 * http://www.zimbra.com/license.
 * 
 * Software distributed under the License is distributed on an "AS IS"
 * basis, WITHOUT WARRANTY OF ANY KIND, either express or implied.
 * 
 * ***** END LICENSE BLOCK *****
 */

/**
 * Creates an account object containing meta info about the account
 * @constructor
 * @class
 * An account object is created primarily if a user has added subaccounts that
 * he would like to manage (i.e. family mailbox).
 *
 * @author Parag Shah
 *
 * @param id			[string]*		unique ID for this account
 * @param name			[string]*		email address
 * @param visible		[boolean]*		if true, make this account available in the overview (child accounts)
 */
ZmZimbraAccount = function(id, name, visible, list) {

	ZmAccount.call(this, ZmAccount.ZIMBRA, id, name, list);
	this.visible = (visible !== false);

	this.settings = null;
	this.trees = {};
	this.loaded = false;
	this.acl = new ZmAccessControlList();
};

ZmZimbraAccount.prototype = new ZmAccount;
ZmZimbraAccount.prototype.constructor = ZmZimbraAccount;

ZmZimbraAccount.prototype.toString =
function() {
	return "ZmZimbraAccount";
};


//
// Constants
//

ZmAccount.ZIMBRA			= "Zimbra";
ZmZimbraAccount.DEFAULT_ID	= "main";


//
// Public methods
//

ZmZimbraAccount.prototype.setName =
function(name) {
	var identity = this.getIdentity();
	// TODO: If no identity and name is set, should create one!
	if (!identity) return;
	identity.name = name;
};

ZmZimbraAccount.prototype.getName =
function() {
	var identity = this.getIdentity();
	var name = (!identity)
		? this.settings.get(ZmSetting.DISPLAY_NAME)
		: identity.name;

	if (!name) {
		name = this.getDisplayName();
	}
	return identity.isDefault && name == ZmIdentity.DEFAULT_NAME ? ZmMsg.accountDefault : name;
}

ZmZimbraAccount.prototype.setEmail =
function(email) {} // IGNORE

ZmZimbraAccount.prototype.getEmail =
function() {
	return this.name;
};

ZmZimbraAccount.prototype.getDisplayName =
function() {
	if (!this.displayName) {
		var dispName = this.isMain
			? this.settings.get(ZmSetting.DISPLAY_NAME)
			: this._displayName;
		this.displayName = (this._accountName || dispName || this.name);
	}
	return this.displayName;
};

ZmZimbraAccount.prototype.getIdentity =
function() {
	if (this.isMain || appCtxt.isOffline) {
		return appCtxt.getIdentityCollection().defaultIdentity;
	}

	if (!this.dummyIdentity) {
		this.dummyIdentity = new ZmIdentity(this.name);
	}
	return this.dummyIdentity;
};

ZmZimbraAccount.prototype.getToolTip =
function() {
	if (this.status || this.lastSync) {
		var lastSyncDate = (this.lastSync && this.lastSync != 0)
			? (new Date(parseInt(this.lastSync))) : null;

		var params = {
			lastSync: (lastSyncDate ? (AjxDateUtil.computeWordyDateStr(new Date(), lastSyncDate)) : null),
			status: this.getStatusMessage()
		};

		return AjxTemplate.expand("share.App#ZimbraAccountTooltip", params);
	}
	return "";
};

ZmZimbraAccount.prototype.isOfflineInitialSync =
function() {
	return (appCtxt.isOffline && (!this.lastSync || (this.lastSync && this.lastSync == 0)));
};

ZmZimbraAccount.prototype.updateState =
function(acctInfo) {
	this.lastSync = acctInfo.lastsync;
	if (this.status != acctInfo.status) {
		this.status = acctInfo.status;
		if (this.isMain || this.visible) {
			appCtxt.getOverviewController().updateAccountIcon(this, this.getStatusIcon());

			// update tooltip for offline, single account
			if (!appCtxt.multiAccounts) {
				var avm = appCtxt.getAppViewMgr();
				var tt = this.getToolTip();
				var sep = "<hr size=1>";
				var userInfo = avm.getCurrentViewComponent(ZmAppViewMgr.C_USER_INFO);
				if (userInfo) {
					if (!this._origUserInfoTT) {
						this._origUserInfoTT = userInfo.getToolTipContent() + sep;
					}
					userInfo.setToolTipContent(this._origUserInfoTT + tt);
				}
				var quotaInfo = avm.getCurrentViewComponent(ZmAppViewMgr.C_QUOTA_INFO);
				if (quotaInfo) {
					if (!this._origQuotaInfoTT) {
						this._origQuotaInfoTT = quotaInfo.getToolTipContent() + sep;
					}
					quotaInfo.setToolTipContent(this._origQuotaInfoTT + tt);
				}
			}
		}
	}

	if (this.visible && acctInfo.unread != this.unread) {
		this.unread = acctInfo.unread;
		if (appCtxt.multiAccounts && appCtxt.getActiveAccount() != this) {
			appCtxt.getOverviewController().updateAccountTitle(this.itemId, this.getTitle());
		}
	}
};

ZmZimbraAccount.prototype.getTitle =
function() {
	return (appCtxt.getActiveAccount() != this && this.unread && this.unread != 0)
		? (["<b>", this.getDisplayName(), " (", this.unread, ")</b>"].join(""))
		: this.getDisplayName();
};

ZmZimbraAccount.prototype.getStatusIcon =
function() {
	switch (this.status) {
		case "unknown":		return "ImgOffline";
		case "offline":		return "ImgImAway";
		case "online":		return "ImgImAvailable";
		case "running":		return "DwtWait16Icon";
		case "authfail":	return "ImgImDnd";
		case "error":		return "ImgCritical";
	}
	return "";
};

ZmZimbraAccount.prototype.getStatusMessage =
function() {
	switch (this.status) {
		case "unknown":		return ZmMsg.unknown;
		case "offline":		return ZmMsg.imStatusOffline;
		case "online":		return ZmMsg.imStatusOnline;
		case "running":		return ZmMsg.running;
		case "authfail":	return ZmMsg.authFailure;
		case "error":		return ZmMsg.error;
	}
	return "";
};

ZmZimbraAccount.createFromDom =
function(node) {
	var acct = new ZmZimbraAccount();
	acct._loadFromDom(node);
	return acct;
};

ZmZimbraAccount.prototype.load =
function(callback) {
	if (!this.loaded) {
		// create new ZmSetting for this account
		this.settings = new ZmSettings();

		// check "{APP}_ENABLED" state against main account's settings
		var mainAcct = appCtxt.getMainAccount();

		// for all *loaded* apps, add their app-specific settings
		for (var i = 0; i < ZmApp.APPS.length; i++) {
			var appName = ZmApp.APPS[i];
			var setting = ZmApp.SETTING[appName];
			if (setting && appCtxt.get(setting, null, mainAcct)) {
				var app = appCtxt.getApp(appName);
				if (app) {
					app._registerSettings(this.settings);
				}
			}
		}

		var command = new ZmBatchCommand(null, this.name);

		// load user settings retrieved from server now
		var loadCallback = new AjxCallback(this, this._handleLoadSettings);
		this.settings.loadUserSettings(loadCallback, null, this.name, null, command);

		// get folder info for this account
		var folderDoc = AjxSoapDoc.create("GetFolderRequest", "urn:zimbraMail");
		var method = folderDoc.getMethod();
		method.setAttribute("visible", "1");
		var folderCallback = new AjxCallback(this, this._handleLoadFolders);
		command.addNewRequestParams(folderDoc, folderCallback);

		// get tag info for this account
		var tagDoc = AjxSoapDoc.create("GetTagRequest", "urn:zimbraMail");
		var tagCallback = new AjxCallback(this, this._handleLoadTags);
		command.addNewRequestParams(tagDoc, tagCallback);

		var respCallback = new AjxCallback(this, this._handleLoadUserInfo, callback);
		var errCallback = new AjxCallback(this, this._handleErrorLoad);
		command.run(respCallback, errCallback);
	} else {
		// always reload account-specific shortcuts
		this.settings.loadShortcuts();

		if (callback) {	callback.run(); }
	}
};

/**
 * Removes any account-specific data stored globally
 */
ZmZimbraAccount.prototype.unload =
function() {
	// unset account-specific shortcuts
	this.settings.loadShortcuts(true);
};

ZmZimbraAccount.prototype.save =
function(callback, errorCallback, batchCmd) {
	return (this.getIdentity().save(callback, errorCallback, batchCmd));
};

/**
 * Saves implicit prefs. Because it's done onunload, the save is sync.
 */
ZmZimbraAccount.prototype.saveImplicitPrefs =
function() {
	// HACK: in multi-account, hanging noop gets dropped and somehow the auth token changes
	ZmCsfeCommand._curAuthToken = ZmCsfeCommand.getAuthToken();

	var list = [];
	for (var id in ZmSetting.CHANGED_IMPLICIT) {
		var setting = this.settings.getSetting(id);
		if (setting.getValue(null, true) != setting.origValue) {
			list.push(setting);
		}
	}
	if (list && list.length) {
		this.settings.save(list, null, null, this.name);
	}
};


//
// Protected methods
//

ZmZimbraAccount.prototype._handleLoadSettings =
function(result) {
	DBG.println(AjxDebug.DBG1, "Account settings successfully loaded for " + this.name);

	// initialize identities/data-sources/signatures for this account
	var obj = result.getResponse().GetInfoResponse;
	appCtxt.getIdentityCollection(this).initialize(obj.identities);
	appCtxt.getDataSourceCollection(this).initialize(obj.dataSources);
	appCtxt.getSignatureCollection(this).initialize(obj.signatures);
};

ZmZimbraAccount.prototype._handleLoadFolders =
function(result) {
	var resp = result.getResponse().GetFolderResponse;
	var folders = resp ? resp.folder[0] : null;
	if (folders) {
		appCtxt.getRequestMgr()._loadTree(ZmOrganizer.FOLDER, null, resp.folder[0], "folder", this);
	}
};

ZmZimbraAccount.prototype._handleLoadTags =
function(result) {
	var resp = result.getResponse().GetTagResponse;
	var tags = (resp && resp.tag) ? resp.tag[0] : null;
	appCtxt.getRequestMgr()._loadTree(ZmOrganizer.TAG, null, resp, null, this);
};

ZmZimbraAccount.prototype._handleLoadUserInfo =
function(callback) {
	this.loaded = true;

	if (callback) {
		callback.run();
	}
};

ZmZimbraAccount.prototype._handleErrorLoad =
function(ev) {
	DBG.println(AjxDebug.DBG1, "------- ERROR loading account settings for " + this.name);
};

ZmZimbraAccount.prototype._loadFromDom =
function(node) {
	this.id = node.id;
	this.name = node.name;
	this.visible = node.visible;

	var data = (node.attrs && node.attrs._attrs) ? node.attrs._attrs : null;
	this._displayName = data ? data.displayName : this.email;
	this._accountName = data ? data.zimbraPrefLabel : null;
};
