package com.sap.cxaiaskproductocc.restriction;

import de.hybris.platform.cms2.model.restrictions.AbstractRestrictionModel;
import de.hybris.platform.cms2.servicelayer.data.RestrictionData;
import de.hybris.platform.cms2.servicelayer.services.evaluator.CMSRestrictionEvaluator;

import org.apache.commons.lang3.StringUtils;
import org.apache.log4j.Logger;

import com.sap.cxai.service.CxaiConfigService;


public class AskProductRestrictionEvaluator implements CMSRestrictionEvaluator<AbstractRestrictionModel>
{
	static final Logger LOGGER = Logger.getLogger(AskProductRestrictionEvaluator.class);

	private final CxaiConfigService cxaiConfigService;

	public AskProductRestrictionEvaluator(final CxaiConfigService cxaiConfigService)
	{
		this.cxaiConfigService = cxaiConfigService;
	}

	@Override
	public boolean evaluate(final AbstractRestrictionModel gigyaComponentRestrictionModel, final RestrictionData restrictionData)
	{
		final var config = AssistantRestrictionEvaluator.getCxaiConfigNoException(cxaiConfigService);
		if (config == null)
		{
			LOGGER.debug("AskProduct restriction: hidden because no config");
			return false;
		}

		if (!config.isActive())
		{
			LOGGER.debug("AskProduct restriction: hidden because config inactive");
			return false;
		}

		if (config.getAskProductDestination() == null
				|| !StringUtils.startsWith(config.getAskProductDestination().getUrl(), "http"))
		{
			LOGGER.debug("AskProduct restriction: hidden because no valid askProduct destination");
			return false;
		}

		if (!StringUtils.startsWith(config.getAskProductDestination().getAuthUrl(), "http")
				|| StringUtils.isEmpty(config.getAskProductDestination().getClientId()))
		{
			LOGGER.debug("AskProduct restriction: hidden because no valid auth");
			return false;
		}

		return true;
	}
}
