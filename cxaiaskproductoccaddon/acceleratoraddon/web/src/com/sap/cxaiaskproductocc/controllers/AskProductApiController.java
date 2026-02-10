package com.sap.cxaiaskproductocc.controllers;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Map;

import jakarta.servlet.http.HttpServletRequest;

import org.apache.log4j.Logger;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.sap.cxai.CxaiConfigData;
import com.sap.cxai.service.CxaiConfigService;
import com.sap.cxaiaskproductocc.exception.MissingCxaiConfigException;
import com.sap.cxaiaskproductocc.model.AllowlistEntry;
import com.sap.cxaiaskproductocc.service.CxaiApiService;
import com.sap.cxaiaskproductocc.service.CxaiAskProductApiService;


@RestController
@RequestMapping("/{baseSiteId}/cxai/ask-product")
public class AskProductApiController
{
	private static final Logger LOGGER = Logger.getLogger(AskProductApiController.class);

	private final List<AllowlistEntry> apiAllowlist = new ArrayList<>();
	private final CxaiApiService cxaiAskProductApiService;
	private final CxaiConfigService cxaiConfigService;

	public AskProductApiController(final CxaiAskProductApiService cxaiAskProductApiService,
			final CxaiConfigService cxaiConfigService)
	{
		this.cxaiAskProductApiService = cxaiAskProductApiService;
		this.cxaiConfigService = cxaiConfigService;
		//this will be directed to atp subpath in service anyway, but we only allow POST to root in this controller
		apiAllowlist.add(new AllowlistEntry("/?$", HttpMethod.POST));
	}

	protected boolean checkApiPath(final String path, final HttpMethod method)
	{
		if (!this.cxaiAskProductApiService.isAllowApiAccess())
		{
			return false;
		}

		for (final AllowlistEntry entry : this.apiAllowlist)
		{
			if (entry.pattern.matcher(path).matches())
			{
				return entry.methods.contains(method);
			}
		}

		return false;
	}

	@PostMapping
	public ResponseEntity<?> handleRequest(@RequestBody(required = false)
	final Map<String, Object> body, final HttpMethod method, @RequestHeader
	final HttpHeaders headers, final HttpServletRequest request)
	{
		final String requestSubpath = request.getRequestURI().replaceFirst(".+/[^/]+/cxai/ask-product", "");

		if (!checkApiPath(requestSubpath, method))
		{
			LOGGER.warn(method + " " + requestSubpath + " is not allowed");
			return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
		}

		try
		{
			final CxaiConfigData config = cxaiConfigService.getConfigForCurrentSite().orElse(null);
			return this.cxaiAskProductApiService.handleRequest(config, requestSubpath, request.getQueryString(), body,
					HttpMethod.POST, headers);
		}
		catch (final MissingCxaiConfigException ex)
		{
			return ResponseEntity.status(HttpStatus.NOT_FOUND)
					.body(Collections.singletonMap("error", "No configuration found for current site"));
		}
	}
}
