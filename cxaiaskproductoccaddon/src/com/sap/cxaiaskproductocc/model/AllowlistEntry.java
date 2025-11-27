/**
 *
 */
package com.sap.cxaiaskproductocc.model;

import java.util.Collections;
import java.util.Set;
import java.util.regex.Pattern;

import org.springframework.http.HttpMethod;


/**
 *
 */
public class AllowlistEntry
{
	public final Pattern pattern;
	public final Set<HttpMethod> methods;

	public AllowlistEntry(final String pattern, final Set<HttpMethod> methods)
	{
		super();
		this.pattern = Pattern.compile(pattern);
		this.methods = methods;
	}

	public AllowlistEntry(final String pattern, final HttpMethod method)
	{
		this(pattern, Collections.singleton(method));
	}
}
