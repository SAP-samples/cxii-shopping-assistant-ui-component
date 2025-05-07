/**
 *
 */
package com.sap.cxaiaskproductocc.populator;

import de.hybris.platform.apiregistryservices.model.AbstractCredentialModel;
import de.hybris.platform.apiregistryservices.model.ConsumedDestinationModel;
import de.hybris.platform.apiregistryservices.model.ConsumedOAuthCredentialModel;
import de.hybris.platform.converters.Populator;
import de.hybris.platform.servicelayer.dto.converter.ConversionException;

import org.apache.log4j.Logger;

import com.sap.cxai.askproduct.ConsumedDestinationData;


/**
 *
 */
public class ConsumedDestinationPopulator implements Populator<ConsumedDestinationModel, ConsumedDestinationData>
{
	static final Logger LOGGER = Logger.getLogger(ConsumedDestinationPopulator.class);

	@Override
	public void populate(final ConsumedDestinationModel consumedDestination, final ConsumedDestinationData target)
			throws ConversionException
	{
		target.setUrl(consumedDestination.getUrl());
		final AbstractCredentialModel abstractCredential = consumedDestination.getCredential();

		if (abstractCredential instanceof ConsumedOAuthCredentialModel)
		{
			final ConsumedOAuthCredentialModel credential = (ConsumedOAuthCredentialModel) abstractCredential;

			final String authUrl = credential.getOAuthUrl();
			final String clientId = credential.getClientId();
			final String clientSecret = credential.getClientSecret();

			target.setAuthUrl(authUrl);
			target.setClientId(clientId);
			target.setClientSecret(clientSecret);
		}
		else
		{
			LOGGER.warn("Unsupported credential type: " + abstractCredential);
		}
	}

}
