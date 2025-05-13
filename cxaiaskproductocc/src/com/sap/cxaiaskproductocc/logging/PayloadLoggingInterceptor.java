package com.sap.cxaiaskproductocc.logging;

import java.io.IOException;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.util.stream.Collectors;

import org.apache.commons.lang3.StringUtils;
import org.apache.log4j.Logger;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpRequest;
import org.springframework.http.MediaType;
import org.springframework.http.client.ClientHttpRequestExecution;
import org.springframework.http.client.ClientHttpRequestInterceptor;
import org.springframework.http.client.ClientHttpResponse;
import org.springframework.util.StreamUtils;


public class PayloadLoggingInterceptor implements ClientHttpRequestInterceptor
{
	static final Logger LOGGER = Logger.getLogger(PayloadLoggingInterceptor.class);

	@Override
	public ClientHttpResponse intercept(final HttpRequest request, final byte[] body, final ClientHttpRequestExecution execution)
			throws IOException
	{
		logRequest(request, body);
		final ClientHttpResponse response = execution.execute(request, body);
		final ClientHttpResponse reusableResponse = logResponse(response);
		return reusableResponse;
	}

	private void logRequest(final HttpRequest request, final byte[] body) throws IOException
	{
		if (LOGGER.isDebugEnabled())
		{
			LOGGER.debug("-- Request --");
			LOGGER.debug("URI: " + request.getMethod() + " " + request.getURI());
			logHeaders(request.getHeaders());
			logBody(request, body);
			LOGGER.debug("--------------");
		}
	}

	private ClientHttpResponse wrapResponseForLogging(final ClientHttpResponse response) throws IOException
	{
		// Capture the response body
		final InputStream responseBodyStream = response.getBody();
		final byte[] responseBodyBytes = StreamUtils.copyToByteArray(responseBodyStream);

		// Create a new reusable InputStream from the captured bytes
		return new ClientHttpResponseWrapper(response, responseBodyBytes);
	}

	private void logBody(final ClientHttpResponse response) throws IOException
	{
		LOGGER.debug("Body: " + StreamUtils.copyToString(response.getBody(), StandardCharsets.UTF_8));
	}

	private boolean isLoggableBody(final HttpHeaders headers)
	{
		final MediaType contentType = headers.getContentType();
		return MediaType.APPLICATION_JSON.isCompatibleWith(contentType) || MediaType.APPLICATION_XML.isCompatibleWith(contentType)
				|| MediaType.APPLICATION_FORM_URLENCODED.isCompatibleWith(contentType)
				|| MediaType.TEXT_PLAIN.isCompatibleWith(contentType);
	}

	private void logBody(final HttpRequest request, final byte[] body)
	{
		if (body != null && body.length > 0 && isLoggableBody(request.getHeaders()))
		{
			LOGGER.debug("Body: " + new String(body, StandardCharsets.UTF_8));
		}
	}

	private ClientHttpResponse logResponse(final ClientHttpResponse response) throws IOException
	{
		ClientHttpResponse returnResponse = response;
		if (LOGGER.isDebugEnabled())
		{

			LOGGER.debug("-- Response --");
			LOGGER.debug("Status: " + response.getRawStatusCode());
			logHeaders(response.getHeaders());

			try
			{

				if (response.getBody() != null)
				{
					if (isLoggableBody(response.getHeaders()))
					{
						returnResponse = wrapResponseForLogging(response);
						logBody(returnResponse);
					}
					else
					{
						LOGGER.debug("Body: <" + response.getHeaders().getContentType() + ">");
					}
				}
			}
			catch (final IOException e)
			{
				LOGGER.error("Error while reading response body: " + e.getMessage());
				LOGGER.trace("Exception", e);
			}

			LOGGER.debug("--------------");
		}

		return returnResponse;
	}

	private void logHeaders(final HttpHeaders headers)
	{
		if (LOGGER.isTraceEnabled())
		{
			LOGGER.trace("Headers:");
			headers.forEach((name, values) -> {
				if (HttpHeaders.AUTHORIZATION.equals(name))
				{
					final String shortValue = values.stream() //
							.map(value -> value.length() > 10 ? StringUtils.left(value, 10) + "..." : value) //
							.collect(Collectors.joining(","));

					LOGGER.trace(name + ": " + shortValue); //
				}
				else
				{
					LOGGER.trace(name + ": " + StringUtils.join(values, ','));
				}
			});
		}
	}
}
