package com.sap.cxaiaskproductocc.interceptor;

import java.io.IOException;
import java.util.Map;

import org.apache.commons.lang3.StringUtils;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpRequest;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.http.client.ClientHttpRequestExecution;
import org.springframework.http.client.ClientHttpRequestFactory;
import org.springframework.http.client.ClientHttpRequestInterceptor;
import org.springframework.http.client.ClientHttpResponse;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;


public class OAuth2ClientCredentialsInterceptor implements ClientHttpRequestInterceptor
{
	private static final Logger LOGGER = LoggerFactory.getLogger(OAuth2ClientCredentialsInterceptor.class);

	private final String tokenUrl;
	private final String clientId;
	private final String clientSecret;

	private final RestTemplate tokenTemplate;
	private final int clockSkewSeconds = 30;
	private volatile String accessToken;
	private volatile long tokenExpiryTime;
	private final Object tokenLock = new Object();

	public OAuth2ClientCredentialsInterceptor(final String tokenUrl, final String clientId, final String clientSecret,
			final ClientHttpRequestFactory requestFactory)
	{
		this.tokenUrl = tokenUrl;
		this.clientId = clientId;
		this.clientSecret = clientSecret;
		this.tokenTemplate = new RestTemplate(requestFactory);
	}

	@Override
	public ClientHttpResponse intercept(final HttpRequest request, final byte[] body, final ClientHttpRequestExecution execution)
			throws IOException
	{
		final String token = getAccessToken();
		if (token != null)
		{
			request.getHeaders().setBearerAuth(token);
		}

		return execution.execute(request, body);
	}

	private String getAccessToken()
	{
		if (accessToken != null && System.currentTimeMillis() < tokenExpiryTime)
		{
			LOGGER.debug("Reusing token " + tokenUrl + " clientId=" + clientId);
			return accessToken;
		}

		synchronized (tokenLock)
		{
			if (accessToken != null && System.currentTimeMillis() < tokenExpiryTime)
			{
				return accessToken;
			}

			try
			{
				final HttpHeaders headers = new HttpHeaders();
				headers.setContentType(MediaType.APPLICATION_FORM_URLENCODED);
				headers.setBasicAuth(clientId, clientSecret);

				final MultiValueMap<String, String> body = new LinkedMultiValueMap<>();
				body.add("grant_type", "client_credentials");

				final HttpEntity<MultiValueMap<String, String>> request = new HttpEntity<>(body, headers);

				LOGGER.info("Fetching new token from " + tokenUrl + ", clientId=" + clientId);
				final ResponseEntity<Map> response = tokenTemplate.postForEntity(tokenUrl, request, Map.class);

				if (response.getStatusCode().is2xxSuccessful())
				{
					final Map<String, Object> tokenResponse = response.getBody();
					accessToken = (String) tokenResponse.get("access_token");
					final Integer expiresIn = (Integer) tokenResponse.get("expires_in");
					final int expirtesInOrDefault = expiresIn == null ? 24 * 60 * 60 : expiresIn.intValue();
					tokenExpiryTime = System.currentTimeMillis() + (expiresIn - clockSkewSeconds) * 1000L;

					LOGGER.info("Token " + clientId + " expires in " + expirtesInOrDefault);
					return accessToken;
				}
			}
			catch (final RestClientException e)
			{
				LOGGER.error("Failed to obtain OAuth2 token from " + tokenUrl + " clientId=" + clientId + "/"
						+ StringUtils.left(clientSecret, 3), e);
				accessToken = null;
				tokenExpiryTime = 0;
			}
			return null;
		}
	}
}
