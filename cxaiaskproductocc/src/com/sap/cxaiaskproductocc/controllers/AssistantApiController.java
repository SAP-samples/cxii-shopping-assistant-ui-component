package com.sap.cxaiaskproductocc.controllers;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Map;

import javax.servlet.http.HttpServletRequest;

import org.apache.log4j.Logger;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.annotation.Secured;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.sap.cxai.CxaiConfigData;
import com.sap.cxai.service.CxaiConfigService;
import com.sap.cxaiaskproductocc.exception.MissingCxaiConfigException;
import com.sap.cxaiaskproductocc.model.AllowlistEntry;
import com.sap.cxaiaskproductocc.service.CxaiApiService;
import com.sap.cxaiaskproductocc.service.CxaiAssistantApiService;


@RestController
@RequestMapping("/{baseSiteId}/cxai/assistant")
@Secured({ "ROLE_CUSTOMERGROUP", "ROLE_CUSTOMERMANAGERGROUP", "ROLE_TRUSTED_CLIENT" })
public class AssistantApiController
{
	private static final Logger LOGGER = Logger.getLogger(AssistantApiController.class);

	private final List<AllowlistEntry> apiAllowlist;
	private final CxaiApiService cxaiAssistantApiService;
	private final CxaiConfigService cxaiConfigService;

	public AssistantApiController(final CxaiAssistantApiService cxaiAssistantApiService, final CxaiConfigService cxaiConfigService)
	{
		this.apiAllowlist = new ArrayList<>();
		this.cxaiAssistantApiService = cxaiAssistantApiService;
		this.cxaiConfigService = cxaiConfigService;
		apiAllowlist.add(new AllowlistEntry("/sessions$", HttpMethod.DELETE));
		apiAllowlist.add(new AllowlistEntry("/chat_session$", HttpMethod.POST));
		//send 1st message and create session
		apiAllowlist.add(new AllowlistEntry("/chat$", HttpMethod.POST));
		apiAllowlist.add(new AllowlistEntry("/chat_session/[^/]+$", HttpMethod.GET));
	}

	protected boolean checkApiPath(final String path, final HttpMethod method)
	{
		for (final AllowlistEntry entry : this.apiAllowlist)
		{
			if (entry.pattern.matcher(path).matches())
			{
				return entry.methods.contains(method);
			}
		}

		return false;
	}

	@RequestMapping("/**")
	public ResponseEntity<?> handleRequest(@RequestBody(required = false) final Map<String, Object> body, final HttpMethod method,
			@RequestHeader final HttpHeaders headers, final HttpServletRequest request)
	{
		final String occPrefix = this.cxaiAssistantApiService.getOccPrefix();
		final String requestSubpath = request.getRequestURI().replaceFirst(occPrefix + "/[^/]+/cxai/assistant", "");

		if (!checkApiPath(requestSubpath, method))
		{
			LOGGER.warn(method + " " + requestSubpath + " is not allowed");
			return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
		}

		try
		{
			final CxaiConfigData config = cxaiConfigService.getConfigForCurrentSite().orElse(null);
			return this.cxaiAssistantApiService.handleRequest(config, requestSubpath, request.getQueryString(), body, method,
					headers);
		}
		catch (final MissingCxaiConfigException ex)
		{
			return ResponseEntity.status(HttpStatus.NOT_FOUND)
					.body(Collections.singletonMap("error", "No configuration found for current site"));
		}
	}

}
