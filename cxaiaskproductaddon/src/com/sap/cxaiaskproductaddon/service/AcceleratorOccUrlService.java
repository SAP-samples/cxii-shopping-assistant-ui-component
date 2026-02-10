/**
 *
 */
package com.sap.cxaiaskproductaddon.service;

import jakarta.servlet.http.HttpServletRequest;


/**
 * Return URLs for OCC, media, etc.
 */
public interface AcceleratorOccUrlService
{
	/** base URL for OCC, this can be another (internal) aspect, or public URL */
	String getOccBaseUrl();

	String getOccPrefix();

	/** base + prefix */
	String getFullOccUrl();

	/**
	 * OCC url for frontend components: same as getFullOccUrl() by default - (requires public OCC with valid CORS config),
	 * or /acc-occ-proxy if cxaiaskproductaddon.occ.proxy.enabled=true
	 */
	String getFullOccUrlForFrontend(HttpServletRequest request);

	/** baseUrl for media urls */
	String getMediaBaseUrl();

}
