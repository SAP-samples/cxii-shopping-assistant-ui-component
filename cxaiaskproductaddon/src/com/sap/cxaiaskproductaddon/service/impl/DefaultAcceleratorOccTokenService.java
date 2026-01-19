package com.sap.cxaiaskproductaddon.service.impl;

import de.hybris.platform.core.model.user.CustomerModel;
import de.hybris.platform.core.model.user.UserModel;
import de.hybris.platform.servicelayer.config.ConfigurationService;
import de.hybris.platform.servicelayer.user.UserService;

import java.util.Arrays;
import java.util.Collections;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

import org.apache.log4j.Logger;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.oauth2.common.OAuth2AccessToken;
import org.springframework.security.oauth2.provider.OAuth2Authentication;
import org.springframework.security.oauth2.provider.OAuth2Request;
import org.springframework.security.oauth2.provider.token.AuthorizationServerTokenServices;

import com.sap.cxaiaskproductaddon.service.AcceleratorOccTokenService;


public class DefaultAcceleratorOccTokenService implements AcceleratorOccTokenService
{
	private static final Logger LOG = Logger.getLogger(DefaultAcceleratorOccTokenService.class);

	private final UserService userService;
	private final AuthorizationServerTokenServices oauthTokenServices;
	private final ConfigurationService configurationService;

	private static final String ROLE_CUSTOMERGROUP = "ROLE_CUSTOMERGROUP";
	private static final String ROLE_CLIENT = "ROLE_CLIENT";

	public DefaultAcceleratorOccTokenService(final UserService userService,
			final AuthorizationServerTokenServices oauthTokenServices, final ConfigurationService configurationService)
	{
		super();
		this.userService = userService;
		this.oauthTokenServices = oauthTokenServices;
		this.configurationService = configurationService;
	}

	protected String getOccClientId()
	{
		return configurationService.getConfiguration().getString("occ.oauth.clientId", "mobile_android");
	}

	protected String getOccResourceId()
	{
		return configurationService.getConfiguration().getString("occ.oauth.resource", "hybris");
	}

	protected OAuth2Authentication createOauth2Authentication(final UserModel user)
	{
		final String clientId = getOccClientId();
		final String resourceId = getOccResourceId();

		// Create user authentication
		final List<GrantedAuthority> userAuthorities = Collections.singletonList(new SimpleGrantedAuthority(ROLE_CUSTOMERGROUP));
		final Map<String, String> details = new HashMap<>();
		details.put("grant_type", "password");
		details.put("client_id", clientId);
		details.put("username", user.getUid());

		final UsernamePasswordAuthenticationToken userAuth = new UsernamePasswordAuthenticationToken( //
				user.getUid(), // principal (uid)
				null, // credentials
				userAuthorities);
		userAuth.setDetails(details);

		// Create OAuth2Request (storedRequest)
		final Map<String, String> requestParameters = details;

		final Set<GrantedAuthority> clientAuthorities = Collections.singleton(new SimpleGrantedAuthority(ROLE_CLIENT));

		final Set<String> scope = new HashSet<>(Arrays.asList("basic", "openid"));
		final Set<String> resourceIds = Collections.singleton(resourceId);

		final OAuth2Request oauth2Request = new OAuth2Request(requestParameters, clientId, // clientId
				clientAuthorities, true, // approved
				scope, resourceIds, null, // redirectUri
				Collections.emptySet(), // responseTypes
				Collections.emptyMap() // extensions
		);

		return new OAuth2Authentication(oauth2Request, userAuth);
	}

	@Override
	public String getOccTokenForCurrentUser()
	{
		final UserModel user = userService.getCurrentUser();
		if (!(user instanceof CustomerModel) || userService.isAnonymousUser(user))
		{
			return null;
		}

		// Create OAuth2Authentication
		final OAuth2Authentication oauth2Authentication = this.createOauth2Authentication(user);

		// Return existing, or create new access token
		final OAuth2AccessToken token = oauthTokenServices.createAccessToken(oauth2Authentication);
		return token.getValue();
	}
}
