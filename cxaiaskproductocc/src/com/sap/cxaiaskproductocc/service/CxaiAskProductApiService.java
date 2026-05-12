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

import org.apache.commons.lang3.StringUtils;
import org.apache.log4j.Logger;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.springframework.web.client.HttpStatusCodeException;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.util.UriComponentsBuilder;

import com.sap.cxai.CxaiConfigData;
import com.sap.cxaiaskproductocc.exception.MissingCxaiConfigException;


/**
 *
 */
public class CxaiAskProductApiService extends BaseCxaiApiService
{
	private static final Logger LOGGER = Logger.getLogger(CxaiAskProductApiService.class);
	private final ProductService productService;
	private static final String USE_BASE_PRODUCT_CODE_FOR_ATP_CONFIG_KEY = "cxai.ask-product.use-base-product-code";

	public CxaiAskProductApiService(final ConfigurationService configurationService, final ProductService productService)
	{
		super(configurationService);
		this.productService = productService;
	}

	protected String getAtpProductCode(final String productCode)
	{
		final boolean useBaseProductCodeForAtp = configurationService.getConfiguration()
				.getBoolean(USE_BASE_PRODUCT_CODE_FOR_ATP_CONFIG_KEY, false);
		if (!useBaseProductCodeForAtp)
		{
			return productCode;
		}

		ProductModel product = productService.getProductForCode(productCode);
		while (product instanceof VariantProductModel)
		{
			product = ((VariantProductModel) product).getBaseProduct();
		}

		if (LOGGER.isDebugEnabled() && !StringUtils.equals(product.getCode(), productCode))
		{
			LOGGER.debug("Using base product code for ATP " + productCode + " -> " + product.getCode() + " because of "
					+ USE_BASE_PRODUCT_CODE_FOR_ATP_CONFIG_KEY);
		}

		return product.getCode();
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
		final long startTime = System.currentTimeMillis();

		try
		{
			final RestTemplate restTemplate = this.getRestClient(config.getAskProductDestination());
			final HttpHeaders filteredHeaders = cleanRequestHeaders(headers);

			final String askProductPath = configurationService.getConfiguration().getString("cxai.ask-product.api.path",
					"/products/v1/about/ask");
			final URI uri = UriComponentsBuilder.fromUriString(targetSystemUrl) //
					.path(askProductPath) //
					.build(true).toUri();

			final String productCode = (String) body.get("productCode");
			body.put("productCode", getAtpProductCode(productCode));
			body.put("catalogVersion", config.getCatalogVersion());
			body.put("catalogID", config.getCatalogId());

			LOGGER.info("Forwarding " + method + " request to " + uri);
			//Copy headers from incoming request to new HttpEntity
			final HttpEntity<Map<String, Object>> httpEntity = new HttpEntity<>(body, filteredHeaders);

			final var result = restTemplate.exchange(uri, method, httpEntity, String.class);

			return new ResponseEntity<>(result.getBody(), cleanResponseHeaders(result.getHeaders()), result.getStatusCode());
		}
		catch (final HttpStatusCodeException e)
		{
			return handleErrorResponse(e);
		}
		finally
		{
			logResponseTime(startTime, method, requestSubpath);
		}
	}
}
