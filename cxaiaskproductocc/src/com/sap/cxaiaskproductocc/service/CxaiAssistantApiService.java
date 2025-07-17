/**
 *
 */
package com.sap.cxaiaskproductocc.service;

import de.hybris.platform.servicelayer.config.ConfigurationService;

import java.net.URI;
import java.util.Map;

import org.apache.commons.lang3.StringUtils;
import org.apache.log4j.Logger;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.springframework.web.client.HttpStatusCodeException;
import org.springframework.web.util.UriComponentsBuilder;

import com.sap.cxai.CxaiConfigData;
import com.sap.cxai.askproduct.ConsumedDestinationData;
import com.sap.cxaiaskproductocc.exception.MissingCxaiConfigException;


/**
 *
 */
public class CxaiAssistantApiService extends BaseCxaiApiService implements CxaiApiService
{
	private static final Logger LOGGER = Logger.getLogger(CxaiAssistantApiService.class);

	public CxaiAssistantApiService(final ConfigurationService configurationService)
	{
		super(configurationService);
	}

	@Override
	public ResponseEntity<String> handleRequest(final CxaiConfigData config, final String requestSubpath, final String queryString,
			final Map<String, Object> body, final HttpMethod method, final HttpHeaders headers)
	{
		if (config == null || config.getTenantUrl() == null)
		{
			throw new MissingCxaiConfigException();
		}

		final String assistantApiPath = configurationService.getConfiguration().getString("cxai.assistant.api.path",
				"/shopping-assistant/api/v1");

		//TODO: add optional assistantDestination to config and fallback here if not defined
		String targetSystemUrl = config.getTenantUrl().replaceAll("/vision/api/v\\d", assistantApiPath);
		String tokenUrl = config.getAuthUrl();
		String clientId = config.getClientId();
		String clientSecret = config.getClientSecret();
		final ConsumedDestinationData assistantDestination = config.getAssistantDestination();

		if (assistantDestination != null && assistantDestination.getUrl() != null)
		{
			targetSystemUrl = assistantDestination.getUrl();
			if (targetSystemUrl.indexOf("/api/") < 0)
			{
				targetSystemUrl = targetSystemUrl + assistantApiPath;
			}

			tokenUrl = assistantDestination.getAuthUrl();
			clientId = assistantDestination.getClientId();
			clientSecret = assistantDestination.getClientSecret();
		}

		try
		{
			final String fetchedToken = this.getAuthToken(tokenUrl, clientId, clientSecret);
			this.addOccUserAuthTokenIfNeeded(requestSubpath, headers);
			headers.setBearerAuth(fetchedToken);

			final URI uri = UriComponentsBuilder.fromUriString(targetSystemUrl) //
					.path(requestSubpath) //
					.query(queryString) //
					.build(true).toUri();

			LOGGER.info("Forwarding request to " + uri);
			final HttpEntity<Map<String, Object>> httpEntity = new HttpEntity<>(body, headers);
			final var result = restTemplate.exchange(uri, method, httpEntity, String.class);

			return new ResponseEntity<>(result.getBody(), cleanHeaders(result.getHeaders()), result.getStatusCode());
		}
		catch (final HttpStatusCodeException e)
		{
			return handleErrorResponse(e, clientId);
		}
	}

	protected void addOccUserAuthTokenIfNeeded(final String requestSubpath, final HttpHeaders headers)
	{
		if (requestSubpath.equals("/chat_session") || requestSubpath.equals("/combined_chat_session"))
		{
			final String userAuthToken = headers.getFirst(HttpHeaders.AUTHORIZATION);
			if (StringUtils.isNotEmpty(userAuthToken))
			{
				headers.set("User-Authorization-Token", userAuthToken);
			}
		}
	}
}
