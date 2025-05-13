/**
 *
 */
package com.sap.cxaiaskproductocc.model;

/**
 * @author wiesia
 *
 */
public class ExpirableToken
{
	public ExpirableToken(final String value, final long expiresInSeconds)
	{
		super();
		this.value = value;
		this.expiration = expiresInSeconds > 0 ? System.currentTimeMillis() + (expiresInSeconds - 5) * 1000 : Long.MAX_VALUE;
	}

	private final String value;
	private final long expiration;

	public String getValue()
	{
		return value;
	}

	public long getExpiration()
	{
		return expiration;
	}

	public boolean isExpired()
	{
		return System.currentTimeMillis() > expiration;
	}

}
