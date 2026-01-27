package com.sap.cxaiaskproductaddon.service.impl;

import de.hybris.platform.servicelayer.config.ConfigurationService;

import javax.servlet.http.HttpServletRequest;

import org.apache.commons.lang3.StringUtils;

import com.sap.cxaiaskproductaddon.constants.CxaiaskproductaddonConstants;
import com.sap.cxaiaskproductaddon.service.AcceleratorOccUrlService;


public class DefaultAcceleratorOccUrlService implements AcceleratorOccUrlService
{
	private final ConfigurationService configurationService;
	private static final String OCC_PREFIX_PROPERTY = CxaiaskproductaddonConstants.EXTENSIONNAME + ".occ.prefix";
	private static final String OCC_BASEURL_PROPERTY = CxaiaskproductaddonConstants.EXTENSIONNAME + ".occ.baseUrl";
	private static final String OCC_PROXY_PROPERTY = CxaiaskproductaddonConstants.EXTENSIONNAME + ".occ.proxy.enabled";

	private static final String MEDIA_BASEURL_PROPERTY = CxaiaskproductaddonConstants.EXTENSIONNAME + ".media.baseUrl";

	public DefaultAcceleratorOccUrlService(final ConfigurationService configurationService)
	{
		super();
		this.configurationService = configurationService;
	}

	@Override
	public String getOccBaseUrl()
	{
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

		return occBaseUrl;
	}

	@Override
	public String getOccPrefix()
	{
		String occPrefix = "/occ/v2";

		//only if occ addon is loaded
		occPrefix = configurationService.getConfiguration().getString("ext.cxaiaskproductoccaddon.extension.webmodule.webroot",
				occPrefix);
		//if OCC extensions are loaded - they should not be used together with occ addons
		occPrefix = configurationService.getConfiguration().getString("ext.commercewebservices.extension.webmodule.webroot",
				occPrefix);

		occPrefix = configurationService.getConfiguration().getString(OCC_PREFIX_PROPERTY, occPrefix);
		if (!occPrefix.startsWith("/"))
		{
			occPrefix = "/" + occPrefix;
		}

		return occPrefix;
	}

	@Override
	public String getMediaBaseUrl()
	{
		return configurationService.getConfiguration().getString(MEDIA_BASEURL_PROPERTY, "");
	}

	@Override
	public String getFullOccUrl()
	{
		return getOccBaseUrl() + getOccPrefix();
	}

	@Override
	public String getFullOccUrlForFrontend(final HttpServletRequest request)
	{
		if (isOccProxyEnabled())
		{
			return request.getContextPath() + "/acc-occ-proxy";
		}
		else
		{
			return getFullOccUrl();
		}
	}

	protected boolean isOccProxyEnabled()
	{
		return configurationService.getConfiguration().getBoolean(OCC_PROXY_PROPERTY, false);
	}

	protected boolean isInsideCcv2()
	{
		return StringUtils.isNotEmpty(configurationService.getConfiguration().getString("modelt.environment.code"));
	}
}
