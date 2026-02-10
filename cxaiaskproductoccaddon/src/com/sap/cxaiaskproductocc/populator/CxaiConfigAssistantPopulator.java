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
import org.apache.log4j.Logger;

import com.sap.cxai.CxaiConfigData;
import com.sap.cxai.askproduct.ConsumedDestinationData;
import com.sap.cxai.model.CxaiConfigModel;


public class CxaiConfigAssistantPopulator implements Populator<CxaiConfigModel, CxaiConfigData>
{
	static final Logger LOGGER = Logger.getLogger(CxaiConfigAssistantPopulator.class);

	private final Converter<ConsumedDestinationModel, ConsumedDestinationData> consumedDestinationConverter;
	private final Configuration config;

	public CxaiConfigAssistantPopulator(
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
		if (source.getAssistantDestination() != null)
		{
			target.setAssistantDestination(consumedDestinationConverter.convert(source.getAssistantDestination()));
		}

		target.setAssistantProductFiltersJson(source.getAssistantProductFiltersJson());
		target.setAssistantConfigId(source.getAssistantConfigId());
	}
}
