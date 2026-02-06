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
            inputPlaceholder: "<spring:theme code='askProduct.inputPlaceholder' text='{empty}' htmlEscape='false' />",
            welcomeMessage: "<spring:theme code='askProduct.welcomeMessage' text='{empty}' htmlEscape='false' />",
            noAnswerMessage: "<spring:theme code='askProduct.noAnswerMessage' text='{empty}' htmlEscape='false' />",
            send: "<spring:theme code='askProduct.send' text='{empty}' htmlEscape='false' />",
            clearChat: "<spring:theme code='askProduct.clearChat' text='{empty}' htmlEscape='false' />",
        };

        //remove all keys with <empty> values
        Object.keys(translations).forEach(key => {
            if (translations[key] === '{empty}') {
                delete translations[key];
            }
        });

        ACC.cxaiaskproduct.i18n['askProduct'] = translations;
        <%-- ACC.cxaiaskproduct.config = { } //set this to disable fetching config from occ endpoint --%>
    });
    /*]]>*/
</script>

<script type="module" src="${contextPath}/_ui/addons/cxaiaskproductaddon/responsive/common/js/angular-polyfills.js"></script>
<script type="module" src="${contextPath}/_ui/addons/cxaiaskproductaddon/responsive/common/js/cxai-components.js?v=${scriptVersion}" ></script>

<cxai-ask-product-chat
  base-url="${occUrl}"
  product-code="${product.code}"
  site="${siteUid}"
></cxai-ask-product-chat>
