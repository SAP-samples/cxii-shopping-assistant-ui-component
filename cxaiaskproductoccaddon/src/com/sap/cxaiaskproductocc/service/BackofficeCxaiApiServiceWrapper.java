/**
 *
 */
package com.sap.cxaiaskproductocc.service;

import de.hybris.platform.commerceservices.impersonation.ImpersonationService;

import java.util.Map;
import java.util.Objects;

import org.apache.log4j.Logger;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;

import com.sap.cxai.CxaiConfigData;
import com.sap.cxai.model.CxaiConfigModel;
import com.sap.cxai.service.CxaiConfigService;


public class BackofficeCxaiApiServiceWrapper
{
	private static final Logger LOGGER = Logger.getLogger(BackofficeCxaiApiServiceWrapper.class);

	private final CxaiApiService wrappedCxaiApiService;
	private final CxaiConfigService cxaiConfigService;

	private final ImpersonationService impersonationService;
	private final String BASE_PATH = "/../v2/config";

	public BackofficeCxaiApiServiceWrapper(final CxaiAssistantApiService wrappedCxaiApiService,
			final ImpersonationService impersonationService, final CxaiConfigService cxaiConfigService)
	{
		super();
		this.wrappedCxaiApiService = wrappedCxaiApiService;
		this.cxaiConfigService = cxaiConfigService;
		this.impersonationService = impersonationService;
	}


	public String getRemoteConfig(final CxaiConfigModel cxaiConfig, final String configId)
	{
		return this.sendRequest(cxaiConfig, BASE_PATH + "/" + configId, null, HttpMethod.GET).getBody();
	}

	public String createRemoteConfig(final CxaiConfigModel cxaiConfig, final Map<String, Object> payload)
	{
		return this.sendRequest(cxaiConfig, BASE_PATH, payload, HttpMethod.POST).getBody();
	}

	public String updateRemoteConfig(final CxaiConfigModel cxaiConfig, final String configId, final Map<String, Object> payload)
	{
		return this.sendRequest(cxaiConfig, BASE_PATH + "/" + configId, payload, HttpMethod.PUT).getBody();
	}

	public String deleteRemoteConfig(final CxaiConfigModel cxaiConfig, final String configId)
	{
		return this.sendRequest(cxaiConfig, BASE_PATH + "/" + configId, null, HttpMethod.DELETE).getBody();
	}

	protected ResponseEntity<String> sendRequest(final CxaiConfigModel cxaiConfig, final String requestSubpath,
			final Map<String, Object> body, final HttpMethod method)
	{
		Objects.requireNonNull(cxaiConfig);
		final CxaiConfigData config = cxaiConfigService.getConfigForCode(cxaiConfig.getCode());
		final var headers = new HttpHeaders();
		return this.wrappedCxaiApiService.handleRequest(config, requestSubpath, null, body, method, headers);
	}

}
