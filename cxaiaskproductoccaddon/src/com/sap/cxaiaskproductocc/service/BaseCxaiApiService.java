/**
 *
 */
package com.sap.cxaiaskproductocc.service;



import de.hybris.platform.servicelayer.config.ConfigurationService;

import java.nio.charset.StandardCharsets;
import java.util.Collections;
import java.util.concurrent.ExecutionException;
import java.util.concurrent.TimeUnit;

import org.apache.http.client.HttpClient;
import org.apache.http.client.config.RequestConfig;
import org.apache.http.impl.client.HttpClients;
import org.apache.http.impl.conn.PoolingHttpClientConnectionManager;
import org.apache.log4j.Logger;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.springframework.http.client.ClientHttpRequestFactory;
import org.springframework.http.client.HttpComponentsClientHttpRequestFactory;
import org.springframework.security.oauth2.client.OAuth2RestTemplate;
import org.springframework.security.oauth2.client.token.grant.client.ClientCredentialsResourceDetails;
import org.springframework.web.client.HttpStatusCodeException;
import org.springframework.web.client.RestTemplate;

import com.google.common.cache.Cache;
import com.google.common.cache.CacheBuilder;
import com.google.common.hash.Hashing;
import com.sap.cxai.askproduct.ConsumedDestinationData;
import com.sap.cxaiaskproductocc.logging.PayloadLoggingInterceptor;


/**
 *
 */
public abstract class BaseCxaiApiService implements CxaiApiService
{
	private static final Logger LOGGER = Logger.getLogger(BaseCxaiApiService.class);
	private static final Logger PAYLOAD_INTERCEPTOR_LOGGER = Logger.getLogger(PayloadLoggingInterceptor.class);

	protected final ConfigurationService configurationService;

	private final String occPrefix;
	private final long longResponseWarningThresholdMs;
	private final ClientHttpRequestFactory requestFactory;

	// in practice this can only be evicted if credentials / logging level are changed during runtime
	private final Cache<String, RestTemplate> restTemplateCache = CacheBuilder.newBuilder() //
			.maximumSize(10) //
			.expireAfterAccess(24, TimeUnit.HOURS) //
			.build();

	/**
	 *
	 */
	public BaseCxaiApiService(final ConfigurationService configurationService)
	{
		super();
		this.configurationService = configurationService;

		this.occPrefix = configurationService.getConfiguration().getString("ext.commercewebservices.extension.webmodule.webroot",
				"/occ/v2");

		this.longResponseWarningThresholdMs = configurationService.getConfiguration()
				.getInt("cxai.long-response-warning-threshold-ms", 45000);

		this.requestFactory = createClientHttpRequestFactory();
	}

	@Override
	public String getOccPrefix()
	{
		return occPrefix;
	}

	protected void logResponseTime(final long startTime, final HttpMethod method, final String requestSubpath)
	{
		final long duration = System.currentTimeMillis() - startTime;

		if (duration > this.longResponseWarningThresholdMs)
		{
			LOGGER.warn("Long CXAI response time: " + duration + "ms: " + method + " " + requestSubpath);
		}
		else if (LOGGER.isDebugEnabled())
		{
			LOGGER.debug("CXAI response time: " + duration + "ms: " + method + " " + requestSubpath);
		}
	}

	protected RestTemplate getRestClient(final ConsumedDestinationData data)
	{
		final boolean payloadInterceptorEnabled = PAYLOAD_INTERCEPTOR_LOGGER.isDebugEnabled();
		final long clientSecretHash = Hashing.murmur3_128().hashString(data.getClientSecret(), StandardCharsets.UTF_8).asLong();

		final String cacheKey = data.getClientId() + (payloadInterceptorEnabled ? "_logged_" : "_") + clientSecretHash;

		try
		{
			return restTemplateCache.get(cacheKey, () -> {
				LOGGER.debug("Creating new OAuth2RestTemplate for: " + data.getClientId() + " logging: " + payloadInterceptorEnabled);

				final ClientCredentialsResourceDetails resourceDetails = new ClientCredentialsResourceDetails();
				resourceDetails.setAccessTokenUri(data.getAuthUrl());
				resourceDetails.setClientId(data.getClientId());
				resourceDetails.setClientSecret(data.getClientSecret());

				final OAuth2RestTemplate oAuth2RestTemplate = new OAuth2RestTemplate(resourceDetails);
				oAuth2RestTemplate.setRequestFactory(getClientHttpRequestFactory());

				if (payloadInterceptorEnabled)
				{
					oAuth2RestTemplate.setInterceptors(Collections.singletonList(new PayloadLoggingInterceptor()));
				}

				return oAuth2RestTemplate;
			});
		}
		catch (final ExecutionException e)
		{
			throw new RuntimeException("Could not create OAuth2RestTemplate", e);
		}
	}

	private ClientHttpRequestFactory getClientHttpRequestFactory()
	{
		return this.requestFactory;
	}

	protected ClientHttpRequestFactory createClientHttpRequestFactory()
	{
		final var config = configurationService.getConfiguration();
		final int readTimeout = config.getInt("cxai.httpclient.read-timeout-ms", 3 * 60 * 1000);
		final int connectTimeout = config.getInt("cxai.httpclient.connect-timeout-ms", 5000);
		final int maxTotalConnections = config.getInt("cxai.httpclient.max-total-connections", 50);
		final int maxPerRouteConnections = config.getInt("cxai.httpclient.max-per-route-connections", maxTotalConnections);
		final int evictIdleConnectionsSec = config.getInt("cxai.httpclient.evict-idle-connections-seconds", 300);

		final PoolingHttpClientConnectionManager connectionManager = new PoolingHttpClientConnectionManager(5, TimeUnit.MINUTES);
		connectionManager.setMaxTotal(maxTotalConnections);
		connectionManager.setDefaultMaxPerRoute(maxPerRouteConnections);
		connectionManager.setValidateAfterInactivity(60_000);

		final RequestConfig requestConfig = RequestConfig.custom() //
				.setConnectTimeout(connectTimeout) //
				.setSocketTimeout(readTimeout) //
				.setConnectionRequestTimeout(1000) //
				.build();

		final HttpClient httpClient = HttpClients.custom() //
				.setConnectionManager(connectionManager) //
				.setDefaultRequestConfig(requestConfig) //
				.evictExpiredConnections() //
				.evictIdleConnections(evictIdleConnectionsSec, TimeUnit.SECONDS) //
				.build();

		final HttpComponentsClientHttpRequestFactory requestFactory = new HttpComponentsClientHttpRequestFactory(httpClient);
		return requestFactory;
	}

	protected ResponseEntity<String> handleErrorResponse(final HttpStatusCodeException e)
	{
		//return external api response without modifications
		return ResponseEntity.status(e.getStatusCode())//
				.headers(cleanResponseHeaders(e.getResponseHeaders()))//
				.body(e.getResponseBodyAsString());
	}

	protected HttpHeaders cleanRequestHeaders(final HttpHeaders headers)
	{
		//handled by oauth resttemplate
		headers.remove(HttpHeaders.AUTHORIZATION);
		headers.remove(HttpHeaders.HOST);
		return headers;
	}

	protected HttpHeaders cleanResponseHeaders(final HttpHeaders responseHeaders)
	{
		//remove cors headers from external service, because cors is handled by commerce
		final var filteredHeaders = new HttpHeaders();
		responseHeaders.forEach((headerName, headerValues) -> {
			if (!headerName.toLowerCase().startsWith("access-control-"))
			{
				filteredHeaders.put(headerName, headerValues);
			}
		});

		return filteredHeaders;
	}

}
