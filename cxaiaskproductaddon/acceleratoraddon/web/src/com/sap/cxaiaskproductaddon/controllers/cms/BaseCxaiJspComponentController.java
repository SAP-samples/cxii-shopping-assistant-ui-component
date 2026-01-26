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
import com.sap.cxaiaskproductaddon.service.AcceleratorOccUrlService;


public class BaseCxaiJspComponentController extends GenericCMSAddOnComponentController
{
	private static final Logger LOG = Logger.getLogger(BaseCxaiJspComponentController.class);

	private static final String IMPORT_FONT_AWESOME_PROPERTY = CxaiaskproductaddonConstants.EXTENSIONNAME + ".importFontAwesome";
	private static final String COMPONENT_VERSION_PROPERTY = CxaiaskproductaddonConstants.EXTENSIONNAME + ".script.version";
	private static final String OCC_PREFIX_PROPERTY = CxaiaskproductaddonConstants.EXTENSIONNAME + ".occ.prefix";
	private static final String OCC_BASEURL_PROPERTY = CxaiaskproductaddonConstants.EXTENSIONNAME + ".occ.baseUrl";

	@Resource(name = "configurationService")
	private ConfigurationService configurationService;
	@Resource(name = "acceleratorOccUrlService")
	private AcceleratorOccUrlService acceleratorOccUrlService;

	@Override
	protected void fillModel(final HttpServletRequest request, final Model model, final AbstractCMSComponentModel component)
	{
		super.fillModel(request, model, component);

		final String scriptVersion = configurationService.getConfiguration().getString(COMPONENT_VERSION_PROPERTY, "1.0");
		final boolean importFontAwesome = configurationService.getConfiguration().getBoolean(IMPORT_FONT_AWESOME_PROPERTY, false);

		model.addAttribute("mediaBaseUrl", acceleratorOccUrlService.getMediaBaseUrl());
		model.addAttribute("occUrl", acceleratorOccUrlService.getFullOccUrlForFrontend(request));
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
