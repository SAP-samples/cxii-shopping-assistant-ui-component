/**
 *
 */
package com.sap.cxaiaskproductocc.service;

import java.util.Map;

import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;

import com.sap.cxai.CxaiConfigData;


/**
 *
 */
public interface CxaiApiService
{

	ResponseEntity<String> handleRequest(final CxaiConfigData config, String requestSubpath, String queryString,
			Map<String, Object> body, HttpMethod method, HttpHeaders headers);

	String getOccPrefix();
}
