/**
 *
 */
package com.sap.cxaiaskproductaddon.controllers.util;

import de.hybris.platform.servicelayer.config.ConfigurationService;

import java.io.IOException;
import java.net.URI;
import java.security.KeyManagementException;
import java.security.KeyStoreException;
import java.security.NoSuchAlgorithmException;
import java.util.concurrent.TimeUnit;

import javax.annotation.PostConstruct;
import javax.annotation.Resource;
import javax.net.ssl.SSLContext;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import org.apache.commons.lang3.StringUtils;
import org.apache.http.client.HttpClient;
import org.apache.http.client.config.RequestConfig;
import org.apache.http.conn.ssl.NoopHostnameVerifier;
import org.apache.http.conn.ssl.SSLConnectionSocketFactory;
import org.apache.http.conn.ssl.TrustSelfSignedStrategy;
import org.apache.http.impl.client.HttpClients;
import org.apache.http.impl.conn.PoolingHttpClientConnectionManager;
import org.apache.http.ssl.SSLContextBuilder;
import org.apache.log4j.Logger;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.client.HttpComponentsClientHttpRequestFactory;
import org.springframework.util.StreamUtils;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.client.HttpStatusCodeException;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.util.UriComponentsBuilder;

import com.sap.cxaiaskproductaddon.service.AcceleratorOccUrlService;


/**
 * Proxy controller to forward requests from storefront to external OCC system. Enable by setting
 * cxaiaskproductaddon.occ.proxy.enabled=true (if there is no public OCC url).
 */
@RestController
@RequestMapping("/acc-occ-proxy")
public class OccProxyController
{
	private static final Logger LOGGER = Logger.getLogger(OccProxyController.class);

	@Resource(name = "configurationService")
	private ConfigurationService configurationService;

	@Resource(name = "acceleratorOccUrlService")
	private AcceleratorOccUrlService acceleratorOccUrlService;

	private final RestTemplate restClient = new RestTemplate();

	@PostConstruct
	protected void init()
	{
		final var config = configurationService.getConfiguration();
		final int readTimeout = config.getInt("cxaiaskproductaddon.acc-occ-proxy.httpclient.read-timeout-ms", 3 * 60 * 1000);
		final int connectTimeout = config.getInt("cxaiaskproductaddon.acc-occ-proxy.httpclient.connect-timeout-ms", 5000);
		final int maxTotalConnections = config.getInt("cxaiaskproductaddon.acc-occ-proxy.httpclient.max-total-connections", 10);
		final int maxPerRouteConnections = config.getInt("cxaiaskproductaddon.acc-occ-proxy.httpclient.max-per-route-connections",
				maxTotalConnections);
		final int evictIdleConnectionsSec = config
				.getInt("cxaiaskproductaddon.acc-occ-proxy.httpclient.evict-idle-connections-seconds", 300);

		//for debug with self-signed certs
		final boolean disableSslValidation = config
				.getBoolean("cxaiaskproductaddon.acc-occ-proxy.httpclient.disable-ssl-validation", false);

		final PoolingHttpClientConnectionManager connectionManager;

		if (disableSslValidation)
		{
			LOGGER.warn("SSL certificate validation is DISABLED - this should only be used in development environments!");
			try
			{
				final SSLContext sslContext = SSLContextBuilder.create().loadTrustMaterial(new TrustSelfSignedStrategy()).build();
				final SSLConnectionSocketFactory sslSocketFactory = new SSLConnectionSocketFactory(sslContext,
						NoopHostnameVerifier.INSTANCE);
				connectionManager = new PoolingHttpClientConnectionManager(
						org.apache.http.config.RegistryBuilder.<org.apache.http.conn.socket.ConnectionSocketFactory> create()
								.register("https", sslSocketFactory)
								.register("http", org.apache.http.conn.socket.PlainConnectionSocketFactory.INSTANCE).build(),
						null, null, null, 5, TimeUnit.MINUTES);
			}
			catch (NoSuchAlgorithmException | KeyManagementException | KeyStoreException e)
			{
				LOGGER.error("Failed to configure SSL context", e);
				throw new IllegalStateException("Failed to configure SSL context", e);
			}
		}
		else
		{
			connectionManager = new PoolingHttpClientConnectionManager(5, TimeUnit.MINUTES);
		}

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
		this.restClient.setRequestFactory(requestFactory);
	}

	protected boolean checkApiPath(final String path, final HttpMethod method)
	{
		if (!path.contains("/cxai/"))
		{
			return false;
		}

		return true;
	}

	//not using RequestBody and ResponseEntity to avoid Jackson processing of binary data [accelerator default config]
	@RequestMapping("/**")
	public void handleRequest(final HttpMethod method, @RequestHeader final HttpHeaders headers, final HttpServletRequest request,
			final HttpServletResponse response) throws IOException
	{
		final String requestSubpath = request.getRequestURI().replaceFirst(".*/acc-occ-proxy", "");
		if (!checkApiPath(requestSubpath, method))
		{
			LOGGER.warn(method + " " + requestSubpath + " is not allowed");
			response.setStatus(HttpStatus.NOT_FOUND.value());
			return;
		}

		String targetSystemUrl = acceleratorOccUrlService.getFullOccUrl();
		final byte[] body = StreamUtils.copyToByteArray(request.getInputStream());

		if (StringUtils.isEmpty(targetSystemUrl))
		{
			//set this to current server base + context path
			targetSystemUrl = request.getScheme() + "://" + request.getServerName() + ":" + request.getServerPort()
					+ request.getContextPath() + "/";
		}

		try
		{
			final HttpHeaders filteredHeaders = cleanRequestHeaders(headers);

			final URI uri = UriComponentsBuilder.fromUriString(targetSystemUrl) //
					.path(requestSubpath) //
					.replaceQuery(request.getQueryString()) //
					.build(true).toUri();

			LOGGER.info("Forwarding OCC " + method + " request to " + uri);
			final HttpEntity<?> httpEntity = new HttpEntity<>(body.length > 0 ? body : null, filteredHeaders);
			final var result = this.restClient.exchange(uri, method, httpEntity, byte[].class);

			// write response directly - bypass accelerator jackson converters
			response.setStatus(result.getStatusCode().value());

			final HttpHeaders cleanHeaders = cleanResponseHeaders(result.getHeaders());

			cleanHeaders.forEach((name, values) -> {
				values.forEach(value -> response.addHeader(name, value));
			});

			if (result.getBody() != null && result.getBody().length > 0)
			{
				StreamUtils.copy(result.getBody(), response.getOutputStream());
			}
		}
		catch (final HttpStatusCodeException e)
		{
			handleErrorResponse(e, response);
		}
	}


	protected void handleErrorResponse(final HttpStatusCodeException e, final HttpServletResponse response) throws IOException
	{
		//return external occ response without modifications
		response.setStatus(e.getRawStatusCode());

		final HttpHeaders cleanHeaders = cleanResponseHeaders(e.getResponseHeaders());
		cleanHeaders.forEach((name, values) -> {
			values.forEach(value -> response.addHeader(name, value));
		});

		final byte[] errorBody = e.getResponseBodyAsByteArray();
		if (errorBody != null && errorBody.length > 0)
		{
			StreamUtils.copy(errorBody, response.getOutputStream());
		}
	}

	protected void removeHopByHopHeaders(final HttpHeaders headers)
	{
		// Remove hop-by-hop headers as per RFC 2616 Section 13.5.1
		// These headers are specific to a single transport-level connection and must not be forwarded
		headers.remove(HttpHeaders.CONNECTION);
		headers.remove(HttpHeaders.TRANSFER_ENCODING);
		headers.remove(HttpHeaders.PROXY_AUTHENTICATE);
		headers.remove(HttpHeaders.PROXY_AUTHORIZATION);
		headers.remove("Keep-Alive");
		headers.remove("TE");
		headers.remove("Trailer");
		headers.remove("Upgrade");
	}

	protected HttpHeaders cleanRequestHeaders(final HttpHeaders headers)
	{
		final HttpHeaders filtered = new HttpHeaders();
		filtered.putAll(headers);

		this.removeHopByHopHeaders(filtered);

		return filtered;
	}

	protected HttpHeaders cleanResponseHeaders(final HttpHeaders responseHeaders)
	{
		//remove cors headers from external service, because this is a local request from frontend side
		//also remove Content-Length to let Spring recalculate it based on actual response body
		final var filtered = new HttpHeaders();
		responseHeaders.forEach((headerName, headerValues) -> {
			final String lowerCaseHeaderName = headerName.toLowerCase();
			if (!lowerCaseHeaderName.startsWith("access-control-"))
			{
				filtered.put(headerName, headerValues);
			}
		});

		this.removeHopByHopHeaders(filtered);
		filtered.remove(HttpHeaders.CONTENT_ENCODING);

		return filtered;
	}
}
