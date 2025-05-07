/**
 *
 */
package com.sap.cxaiaskproductocc.service;



import de.hybris.platform.servicelayer.config.ConfigurationService;

import java.util.Collections;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

import org.apache.log4j.Logger;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.http.client.ClientHttpRequestFactory;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.HttpStatusCodeException;
import org.springframework.web.client.RestTemplate;

import com.sap.cxaiaskproductocc.logging.PayloadLoggingInterceptor;
import com.sap.cxaiaskproductocc.model.ExpirableToken;


/**
 *
 */
public class BaseCxaiApiService
{
	private static final Logger LOGGER = Logger.getLogger(CxaiAssistantApiService.class);

	protected final Map<String, ExpirableToken> tokenMap = new ConcurrentHashMap<>();
	protected final RestTemplate restTemplate;
	protected final ConfigurationService configurationService;

	/**
	 *
	 */
	public BaseCxaiApiService(final ConfigurationService configurationService)
	{
		super();
		this.restTemplate = new RestTemplate(getClientHttpRequestFactory());
		this.configurationService = configurationService;
		this.restTemplate.setInterceptors(Collections.singletonList(new PayloadLoggingInterceptor()));

	}

	protected ClientHttpRequestFactory getClientHttpRequestFactory()
	{
		//avoid "retry in streaming mode" error due to PayloadLoggingInterceptor
		final SimpleClientHttpRequestFactory requestFactory = new SimpleClientHttpRequestFactory();
		requestFactory.setOutputStreaming(false);
		return requestFactory;
	}

	protected String getAuthToken(final String tokenUrl, final String clientId, final String clientSecret)
	{
		final long currentTime = System.currentTimeMillis();
		final String urlId = clientId;
		ExpirableToken token = this.tokenMap.get(urlId);

		if (token != null && !token.isExpired())
		{
			LOGGER.debug("Reusing token for " + urlId);
			return token.getValue();
		}

		synchronized (this.tokenMap)
		{
			token = this.tokenMap.get(urlId);

			if (token != null && !token.isExpired())
			{
				return token.getValue();
			}

			this.tokenMap.remove(urlId);
			final HttpHeaders authTokenHeaders = new HttpHeaders();
			authTokenHeaders.setContentType(MediaType.APPLICATION_FORM_URLENCODED);
			authTokenHeaders.setBasicAuth(clientId, clientSecret);

			final MultiValueMap<String, String> tokenRequest = new LinkedMultiValueMap<>();
			tokenRequest.add("grant_type", "client_credentials");

			try
			{
				final HttpEntity<MultiValueMap<String, String>> authTokenEntity = new HttpEntity<>(tokenRequest, authTokenHeaders);
				final ResponseEntity<Map> authTokenResponse = restTemplate.exchange(tokenUrl, HttpMethod.POST, authTokenEntity,
						Map.class);

				final String tokenValue = (String) authTokenResponse.getBody().get("access_token");
				final Integer tokenExpiresIn = (Integer) authTokenResponse.getBody().get("expires_in");
				token = new ExpirableToken(tokenValue, tokenExpiresIn == null ? -1 : tokenExpiresIn.longValue());
				this.tokenMap.put(urlId, token);
				LOGGER.info("Fetched token for " + urlId + " expires in " + tokenExpiresIn);
				LOGGER.debug(token.getValue());
				return token.getValue();
			}
			catch (final HttpStatusCodeException ex)
			{
				LOGGER.error("Cannot fetch token for " + urlId + " from " + tokenUrl);
				throw ex;
			}
		}
	}

	protected ResponseEntity<String> handleErrorResponse(final HttpStatusCodeException e, final String clientId)
	{
		if (e.getStatusCode() == HttpStatus.UNAUTHORIZED)
		{
			synchronized (tokenMap)
			{
				this.tokenMap.remove(clientId);
				LOGGER.info("Invalidated token for " + clientId + " because of 401");
			}
		}

		//return external api response without modifications
		return ResponseEntity.status(e.getStatusCode())//
				.headers(cleanHeaders(e.getResponseHeaders()))//
				.body(e.getResponseBodyAsString());
	}

	protected HttpHeaders cleanHeaders(final HttpHeaders responseHeaders)
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
