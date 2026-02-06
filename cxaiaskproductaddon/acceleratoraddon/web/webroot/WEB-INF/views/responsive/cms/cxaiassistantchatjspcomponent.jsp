<%@ page trimDirectiveWhitespaces="true" %>
<%@ taglib prefix="c" uri="http://java.sun.com/jsp/jstl/core"%>
<%@ taglib prefix="spring" uri="http://www.springframework.org/tags" %>
<%@ taglib prefix="fn" uri="http://java.sun.com/jsp/jstl/functions" %>
<%@ taglib prefix="form" uri="http://www.springframework.org/tags/form" %>
<%@ taglib prefix="ycommerce" uri="http://hybris.com/tld/ycommercetags"%>
<%@ taglib prefix="product" tagdir="/WEB-INF/tags/responsive/product" %>

<spring:htmlEscape defaultHtmlEscape="true" />

<script type="text/javascript">
    /*<![CDATA[*/
    document.addEventListener('DOMContentLoaded', function() {
        const translations = {
            inputPlaceholder: "<spring:theme code='cxaiAssistant.inputPlaceholder' text='{empty}' htmlEscape='false' />",
            title: "<spring:theme code='cxaiAssistant.title' text='{empty}' htmlEscape='false' />",
            searchBoxChatInvite: "<spring:theme code='cxaiAssistant.searchBoxChatInvite' text='{empty}' htmlEscape='false' />",
            newSession: "<spring:theme code='cxaiAssistant.newSession' text='{empty}' htmlEscape='false' />",
            close: "<spring:theme code='cxaiAssistant.close' text='{empty}' htmlEscape='false' />",
            maximize: "<spring:theme code='cxaiAssistant.maximize' text='{empty}' htmlEscape='false' />",
            restore: "<spring:theme code='cxaiAssistant.restore' text='{empty}' htmlEscape='false' />",
            copyProduct: "<spring:theme code='cxaiAssistant.copyProduct' text='{empty}' htmlEscape='false' />",
            welcomeMessage: "<spring:theme code='cxaiAssistant.welcomeMessage' text='{empty}' htmlEscape='false' />",
            "welcomeMessage_${siteUid}": "<spring:theme code='cxaiAssistant.welcomeMessage_${siteUid}' text='{empty}' htmlEscape='false' />",
        };

        //remove all keys with <empty> values
        Object.keys(translations).forEach(key => {
            if (translations[key] === '{empty}') {
                delete translations[key];
            }
        });

        ACC.cxaiassistant.i18n['cxaiAssistant'] = translations;
    });
    /*]]>*/
</script>

<script type="module" src="${contextPath}/_ui/addons/cxaiaskproductaddon/responsive/common/js/angular-polyfills.js"></script>
<script type="module" src="${contextPath}/_ui/addons/cxaiaskproductaddon/responsive/common/js/cxai-components.js?v=${scriptVersion}" ></script>
<c:if test="${importFontAwesome}">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css" integrity="sha512-DTOQO9RWCH3ppGqcWaEA1BIZOC6xxalwEsw9c2QQeAIftl+Vegovlnee1c9QX4TctnWMn13TZye+giMm8e2LwA==" crossorigin="anonymous" referrerpolicy="no-referrer" />
</c:if>

<cxai-assistant-chat
  base-url="${occUrl}"
  media-base-url="${mediaBaseUrl}"
  site="${siteUid}"
  site-name="${siteName}"
  occ-token="${occToken}"
></cxai-assistant-chat>
