/*
 * ----------------------------------------------------------------
 * --- WARNING: THIS FILE IS GENERATED AND WILL BE OVERWRITTEN! ---
 * --- Generated at Oct 1, 2024, 4:19:32 PM                     ---
 * ----------------------------------------------------------------
 */
package com.sap.cxaiaskproductocc.jalo.restrictions;

import de.hybris.platform.cms2.jalo.restrictions.AbstractRestriction;
import de.hybris.platform.directpersistence.annotation.SLDSafe;
import de.hybris.platform.jalo.SessionContext;

import java.util.Collections;
import java.util.HashMap;
import java.util.Map;


/**
 * Generated class for type AssistantRestriction.
 */
@SLDSafe
@SuppressWarnings(
{ "unused", "cast" })
public class AssistantRestriction extends AbstractRestriction
{
	protected static final Map<String, AttributeMode> DEFAULT_INITIAL_ATTRIBUTES;
	static
	{
		final Map<String, AttributeMode> tmp = new HashMap<String, AttributeMode>(AbstractRestriction.DEFAULT_INITIAL_ATTRIBUTES);
		DEFAULT_INITIAL_ATTRIBUTES = Collections.unmodifiableMap(tmp);
	}

	@Override
	protected Map<String, AttributeMode> getDefaultAttributeModes()
	{
		return DEFAULT_INITIAL_ATTRIBUTES;
	}

	@Override
	public String getDescription(final SessionContext sessionContext)
	{
		return null;
	}
}
