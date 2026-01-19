package com.sap.cxaiaskproductaddon.controllers.cms;



import de.hybris.platform.addonsupport.controllers.cms.GenericCMSAddOnComponentController;
import de.hybris.platform.cms2.model.contents.components.AbstractCMSComponentModel;
import de.hybris.platform.servicelayer.config.ConfigurationService;

import javax.annotation.Resource;
import javax.servlet.http.HttpServletRequest;

import org.apache.commons.lang3.StringUtils;
import org.apache.log4j.Logger;
import org.springframework.ui.Model;

import com.sap.cxaiaskproductaddon.constants.CxaiaskproductaddonConstants;


public class BaseCxaiJspComponentController extends GenericCMSAddOnComponentController
{
	private static final Logger LOG = Logger.getLogger(BaseCxaiJspComponentController.class);

	private static final String IMPORT_FONT_AWESOME_PROPERTY = CxaiaskproductaddonConstants.EXTENSIONNAME + ".importFontAwesome";
	private static final String COMPONENT_VERSION_PROPERTY = CxaiaskproductaddonConstants.EXTENSIONNAME + ".script.version";
	private static final String OCC_PREFIX_PROPERTY = CxaiaskproductaddonConstants.EXTENSIONNAME + ".occ.prefix";
	private static final String OCC_BASEURL_PROPERTY = CxaiaskproductaddonConstants.EXTENSIONNAME + ".occ.baseUrl";

	@Resource(name = "configurationService")
	private ConfigurationService configurationService;

	@Override
	protected void fillModel(final HttpServletRequest request, final Model model, final AbstractCMSComponentModel component)
	{
		super.fillModel(request, model, component);

		String occPrefix = "/occ/v2";
		occPrefix = configurationService.getConfiguration().getString("ext.cxaiaskproductoccaddon.extension.webmodule.webroot",
				occPrefix);
		occPrefix = configurationService.getConfiguration().getString("ext.siteonecommercewebservices.extension.webmodule.webroot",
				occPrefix);
		occPrefix = configurationService.getConfiguration().getString("ext.commercewebservices.extension.webmodule.webroot",
				occPrefix);

		occPrefix = configurationService.getConfiguration().getString(OCC_PREFIX_PROPERTY, occPrefix);

		String occBaseUrl = ""; //means same domain as storefront
		if (isInsideCcv2())
		{
			occBaseUrl = configurationService.getConfiguration().getString("ccv2.services.api.url.0", occBaseUrl);
		}

		occBaseUrl = configurationService.getConfiguration().getString(OCC_BASEURL_PROPERTY, occBaseUrl);


		if (occBaseUrl.endsWith("/"))
		{
			occBaseUrl = occBaseUrl.substring(0, occBaseUrl.length() - 1);
		}

		if (!occPrefix.startsWith("/"))
		{
			occPrefix = "/" + occPrefix;
		}

		final String scriptVersion = configurationService.getConfiguration().getString(COMPONENT_VERSION_PROPERTY, "1.0");
		final boolean importFontAwesome = configurationService.getConfiguration().getBoolean(IMPORT_FONT_AWESOME_PROPERTY,
				false);
		final String occUrl = (occBaseUrl + occPrefix);
		model.addAttribute("backendUrl", occBaseUrl);
		model.addAttribute("occUrl", occUrl);
		model.addAttribute("scriptVersion", scriptVersion);
		model.addAttribute("importFontAwesome", importFontAwesome);
	}

	protected boolean isInsideCcv2()
	{
		return StringUtils.isNotEmpty(configurationService.getConfiguration().getString("modelt.environment.code"));
	}

	@Override
	protected String getAddonUiExtensionName(final AbstractCMSComponentModel component)
	{
		return CxaiaskproductaddonConstants.EXTENSIONNAME;
	}
}
