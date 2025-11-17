package com.sap.cxaiaskproductocc.restriction;

import de.hybris.platform.cms2.model.restrictions.AbstractRestrictionModel;
import de.hybris.platform.cms2.servicelayer.data.RestrictionData;
import de.hybris.platform.cms2.servicelayer.services.evaluator.CMSRestrictionEvaluator;

import org.apache.commons.lang3.StringUtils;
import org.apache.log4j.Logger;

import com.sap.cxai.CxaiConfigData;
import com.sap.cxai.service.CxaiConfigService;


public class AssistantRestrictionEvaluator implements CMSRestrictionEvaluator<AbstractRestrictionModel>
{
	static final Logger LOGGER = Logger.getLogger(AssistantRestrictionEvaluator.class);

	private final CxaiConfigService cxaiConfigService;

	public AssistantRestrictionEvaluator(final CxaiConfigService cxaiConfigService)
	{
		this.cxaiConfigService = cxaiConfigService;
	}

	@Override
	public boolean evaluate(final AbstractRestrictionModel gigyaComponentRestrictionModel, final RestrictionData restrictionData)
	{
		final var config = getCxaiConfigNoException(cxaiConfigService);
		if (config == null)
		{
			LOGGER.debug("Assistant restriction: hidden because no config");
			return false;
		}

		if (!config.isActive())
		{
			LOGGER.debug("Assistant restriction: hidden because config inactive");
			return false;
		}

		if (StringUtils.isBlank(config.getAssistantConfigId()))
		{
			LOGGER.debug("Assistant restriction: hidden because no valid configuration");
			return false;
		}

		return true;
	}

	public static CxaiConfigData getCxaiConfigNoException(final CxaiConfigService cxaiConfigService)
	{
		try
		{
			return cxaiConfigService.getConfigForCurrentSite().orElse(null);
		}
		catch (final Exception ex)
		{
			LOGGER.warn("Error getting CxaiConfig: " + ex.getMessage());
			LOGGER.debug("Stacktrace", ex);
			return null;
		}
	}
}
