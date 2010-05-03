<%--
 * ***** BEGIN LICENSE BLOCK *****
 * Zimbra Collaboration Suite Web Client
 * Copyright (C) 2007, 2008, 2009, 2010 Zimbra, Inc.
 * 
 * The contents of this file are subject to the Zimbra Public License
 * Version 1.3 ("License"); you may not use this file except in
 * compliance with the License.  You may obtain a copy of the License at
 * http://www.zimbra.com/license.
 * 
 * Software distributed under the License is distributed on an "AS IS"
 * basis, WITHOUT WARRANTY OF ANY KIND, either express or implied.
 * ***** END LICENSE BLOCK *****
--%>
<%@ tag body-content="empty" %>
<%@ attribute name="context" rtexprvalue="true" required="true" type="com.zimbra.cs.taglib.tag.SearchContext" %>
<%@ taglib prefix="c" uri="http://java.sun.com/jsp/jstl/core" %>
<%@ taglib prefix="fn" uri="http://java.sun.com/jsp/jstl/functions" %>
<%@ taglib prefix="fmt" uri="com.zimbra.i18n" %>
<%@ taglib prefix="mo" uri="com.zimbra.mobileclient" %>
<%@ taglib prefix="zm" uri="com.zimbra.zm" %>
<%@ taglib prefix="app" uri="com.zimbra.htmlclient" %>
<mo:handleError>
    <zm:getMailbox var="mailbox"/>
    <zm:getUserAgent var="ua" session="true"/>
    <c:if test="${!context.isGALSearch}">
    <c:set var="contactId" value="${context.currentItem.id}"/>
    <c:if test="${not empty contactId}"><zm:getContact id="${contactId}" var="contact"/></c:if>
    </c:if>
    <mo:searchTitle var="title" context="${context}"/>
</mo:handleError>
<c:set var="context_url" value="${requestScope.baseURL!=null?requestScope.baseURL:'zmain'}"/>
<zm:currentResultUrl var="actionUrl" value="${context_url}" context="${context}"/>
<c:set var="title" value="${zm:truncate(context.shortBackTo,20,true)}" scope="request"/>
<form id="zForm" action="${fn:escapeXml(actionUrl)}" method="post" onsubmit="return submitForm(this);">
    <input type="hidden" name="crumb" value="${fn:escapeXml(mailbox.accountInfo.crumb)}"/>
    <input type="hidden" name="doContactAction" value="1"/>
    <input name="moreActions" type="hidden" value="<fmt:message key="actionGo"/>"/>
    <c:if test="${ua.isiPad == false}">
        <mo:toolbar context="${context}" urlTarget="${context_url}" isTop="true" mailbox="${mailbox}"/>
    </c:if>
    <div class="wrap-dlist" id="wrap-dlist-view">
    <div class="tbl dlist" id="dlist-view">
    <c:forEach items="${context.searchResult.hits}" var="hit" varStatus="status">
        <c:set var="chit" value="${hit.contactHit}"/>
        <zm:currentResultUrl var="contactUrl" value="${context_url}" action="view" id="${chit.id}"
                             index="${status.index}" context="${context}"/>
        <c:if test="${context.isGALSearch}">
            <c:url value="${contactUrl}" var="contactUrl">
                <c:param name="email" value="${chit.email}"/>
            </c:url>
        </c:if>
        <div class="tr list-row" id="cn${chit.id}">
            <c:set value=",${hit.id}," var="stringToCheck"/>
            <c:set var="class" value="Contact${chit.isGroup ? 'Group' : ''}"/>
            <span class="td f">
                    <c:if test="${!context.isGALSearch}">
                    <input class="chk" type="checkbox" ${requestScope.select ne 'none' && (fn:contains(requestScope._selectedIds,stringToCheck) || requestScope.select eq 'all') ? 'checked="checked"' : ''}
                           name="id" value="${chit.id}"/></c:if>
            <span class="SmlIcnHldr ${class}">&nbsp;</span>
            </span>
            <span class="td m">
            <span onclick='return zClickLink("a${chit.id}");'>
            <a id="a${chit.id}" href="${contactUrl}">
                <div>
                    <strong>${zm:truncate(fn:escapeXml(empty chit.fileAsStr ? (context.isGALSearch ? chit.fullName : '<None>') : chit.fileAsStr),23, true)}</strong>
                </div>
            </a>
            </span>
            <div class="Email">
                <c:set var="nmail" value="st=newmail"/>
                <c:url var="murl" value="?${nmail}">
                    <c:param name="to" value="${chit.email}"/>
                </c:url>
                <c:choose>
                    <c:when test="${ua.isiPad == false}">
                        <a href="${fn:escapeXml(murl)}">${fn:escapeXml(chit.email)}</a>
                    </c:when>
                    <c:otherwise>
                        <a id="newmail" href="${fn:escapeXml(murl)}"><span onclick="return zClickLink('newmail', null, this)">${fn:escapeXml(chit.email)}</span></a>
                    </c:otherwise>
                </c:choose>
            </div>
            </span>
            <span class="td l">
                <c:if test="${chit.isFlagged}">
                    <span class="SmlIcnHldr Flag">&nbsp;</span>
                </c:if>
                <c:if test="${chit.hasTags}">
                    <mo:miniTagImage ids="${chit.tagIds}"/>
                </c:if>
            </span>
        </div>
    </c:forEach>
    </div></div>        
    <c:if test="${empty context || empty context.searchResult or context.searchResult.size eq 0}">
        <div class='tbl'>
                <div class="tr">
                    <div class="td zo_noresults">
                        <fmt:message key="noResultsFound"/>
                     </div>
                </div>
            </div>
    </c:if>
    <c:if test="${ua.isiPad == false}">
        <mo:toolbar context="${context}" urlTarget="${context_url}" isTop="false" mailbox="${mailbox}"/>
    </c:if>
</form>
