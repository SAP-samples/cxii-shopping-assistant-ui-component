/*
 * Copyright (c) 2023 SAP SE or an SAP affiliate company. All rights reserved.
 */
package com.sap.cxaiaskproductocc.logging;

import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.io.InputStream;

import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatusCode;
import org.springframework.http.client.ClientHttpResponse;


/**
 * Class to keep response body after it is logged
 */
public class ClientHttpResponseWrapper implements ClientHttpResponse
{

	private final ClientHttpResponse originalResponse;
	private byte[] responseBody;
	private boolean closed = false;

	public ClientHttpResponseWrapper(final ClientHttpResponse originalResponse, final byte[] responseBody)
	{
		super();
		this.originalResponse = originalResponse;
		this.responseBody = responseBody;
	}

	public HttpHeaders getHeaders()
	{
		return originalResponse.getHeaders();
	}

	public InputStream getBody() throws IOException
	{
		if (closed)
		{
			throw new IllegalStateException("closed");
		}
		return new ByteArrayInputStream(responseBody);
	}

	public HttpStatusCode getStatusCode() throws IOException
	{
		return originalResponse.getStatusCode();
	}

	public int getRawStatusCode() throws IOException
	{
		return originalResponse.getRawStatusCode();
	}

	public String getStatusText() throws IOException
	{
		return originalResponse.getStatusText();
	}

	public void close()
	{
		originalResponse.close();
		this.closed = true;
		this.responseBody = null;
	}
}