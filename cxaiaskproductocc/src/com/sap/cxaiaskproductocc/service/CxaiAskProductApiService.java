/**
 *
 */
package com.sap.cxaiaskproductocc.service;

import de.hybris.platform.core.model.product.ProductModel;
import de.hybris.platform.product.ProductService;
import de.hybris.platform.servicelayer.config.ConfigurationService;
import de.hybris.platform.variants.model.VariantProductModel;

import java.net.URI;
import java.util.Map;

import org.apache.log4j.Logger;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.springframework.web.client.HttpStatusCodeException;
import org.springframework.web.util.UriComponentsBuilder;

import com.sap.cxai.CxaiConfigData;
import com.sap.cxaiaskproductocc.exception.MissingCxaiConfigException;


/**
 *
 */
public class CxaiAskProductApiService extends BaseCxaiApiService implements CxaiApiService
{
	private static final Logger LOGGER = Logger.getLogger(CxaiAskProductApiService.class);
	private final ProductService productService;

	public CxaiAskProductApiService(final ConfigurationService configurationService, final ProductService productService)
	{
		super(configurationService);
		this.productService = productService;
	}

	@Override
	public ResponseEntity<String> handleRequest(final CxaiConfigData config, final String requestSubpath, final String queryString,
			final Map<String, Object> body, final HttpMethod method, final HttpHeaders headers)
	{
		if (config == null || config.getAskProductDestination() == null)
		{
			throw new MissingCxaiConfigException();
		}

		final String targetSystemUrl = config.getAskProductDestination().getUrl();
		final String tokenUrl = config.getAskProductDestination().getAuthUrl();
		final String clientId = config.getAskProductDestination().getClientId();
		final String clientSecret = config.getAskProductDestination().getClientSecret();

		try
		{
			final String fetchedToken = this.getAuthToken(tokenUrl, clientId, clientSecret);
			headers.setBearerAuth(fetchedToken);

			final String askProductPath = configurationService.getConfiguration().getString("cxai.ask-product.api.path",
					"/products/v1/about/ask");
			final URI uri = UriComponentsBuilder.fromUriString(targetSystemUrl) //
					.path(askProductPath) //
					.build(true).toUri();

			final String productCode = (String) body.get("productCode");
			body.put("productCode", productCode);
			body.put("catalogVersion", config.getCatalogVersion());
			body.put("catalogID", config.getCatalogId());

			LOGGER.info("Forwarding request to " + uri);
			//Copy headers from incoming request to new HttpEntity
			final HttpEntity<Map<String, Object>> httpEntity = new HttpEntity<>(body, headers);

			return restTemplate.exchange(uri, HttpMethod.POST, httpEntity, String.class);
		}
		catch (final HttpStatusCodeException e)
		{
			return handleErrorResponse(e, clientId);
		}
	}
}
