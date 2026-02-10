/**
 *
 */
package com.sap.cxaiaskproductocc.populator;

import de.hybris.platform.apiregistryservices.model.ConsumedDestinationModel;
import de.hybris.platform.converters.Populator;
import de.hybris.platform.servicelayer.config.ConfigurationService;
import de.hybris.platform.servicelayer.dto.converter.ConversionException;
import de.hybris.platform.servicelayer.dto.converter.Converter;

import org.apache.commons.configuration2.Configuration;
import org.apache.commons.lang3.StringUtils;
import org.apache.log4j.Logger;

import com.sap.cxai.CxaiConfigData;
import com.sap.cxai.askproduct.ConsumedDestinationData;
import com.sap.cxai.model.CxaiConfigModel;


public class CxaiConfigAskProductPopulator implements Populator<CxaiConfigModel, CxaiConfigData>
{
	static final Logger LOGGER = Logger.getLogger(CxaiConfigAskProductPopulator.class);

	private final Converter<ConsumedDestinationModel, ConsumedDestinationData> consumedDestinationConverter;
	private final Configuration config;

	public CxaiConfigAskProductPopulator(
			final Converter<ConsumedDestinationModel, ConsumedDestinationData> consumedDestinationConverter,
			final ConfigurationService configurationService)
	{
		super();
		this.consumedDestinationConverter = consumedDestinationConverter;
		this.config = configurationService.getConfiguration();
	}

	@Override
	public void populate(final CxaiConfigModel source, final CxaiConfigData target) throws ConversionException
	{
		if (source.getAskProductDestination() != null)
		{
			target.setAskProductDestination(consumedDestinationConverter.convert(source.getAskProductDestination()));
		}
		else
		{
			target.setAskProductDestination(new ConsumedDestinationData());
		}

		target.setAskProductContextMessageWindow(source.getAskProductContextMessageWindow());
		target.setAskProductContextCharacterLimit(source.getAskProductContextCharacterLimit());

		//if no data in db, check properties as fallback
		final ConsumedDestinationData data = target.getAskProductDestination();
		if (StringUtils.isEmpty(data.getAuthUrl()))
		{
			data.setAuthUrl(getAskProductProperty("authUrl"));
		}
		if (StringUtils.isEmpty(data.getClientId()))
		{
			data.setClientId(getAskProductProperty("clientId"));
		}
		if (StringUtils.isEmpty(data.getClientSecret()))
		{
			data.setClientSecret(getAskProductProperty("clientSecret"));
		}
		if (StringUtils.isEmpty(data.getUrl()))
		{
			data.setUrl(getAskProductProperty("url"));
		}
	}

	private String getAskProductProperty(final String key)
	{
		LOGGER.debug("Fallback to properties for ask-product config value: " + key);
		final String propertyValue = config.getString("cxai.ask-product." + key);
		return propertyValue;
	}
}
