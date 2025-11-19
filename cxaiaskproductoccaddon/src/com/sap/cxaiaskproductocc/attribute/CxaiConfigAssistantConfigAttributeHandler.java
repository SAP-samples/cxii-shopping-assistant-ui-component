/*
 * Copyright (c) 2023 SAP SE or an SAP affiliate company. All rights reserved.
 */
package com.sap.cxaiaskproductocc.attribute;

import de.hybris.platform.core.model.CxaiAssistantConfigModel;
import de.hybris.platform.servicelayer.model.attribute.DynamicAttributeHandler;
import de.hybris.platform.servicelayer.search.FlexibleSearchService;

import org.apache.commons.lang3.StringUtils;

import com.sap.cxai.model.CxaiConfigModel;


/**
 *
 */
public class CxaiConfigAssistantConfigAttributeHandler
		implements DynamicAttributeHandler<CxaiAssistantConfigModel, CxaiConfigModel>
{

	private final FlexibleSearchService flexibleSearchService;

	public CxaiConfigAssistantConfigAttributeHandler(final FlexibleSearchService flexibleSearchService)
	{
		super();
		this.flexibleSearchService = flexibleSearchService;
	}

	@Override
	public CxaiAssistantConfigModel get(final CxaiConfigModel model)
	{
		final String id = model.getAssistantConfigId();
		if (StringUtils.isEmpty(id))
		{
			return null;
		}

		final CxaiAssistantConfigModel ex = new CxaiAssistantConfigModel();
		ex.setConfigId(id);

		final var result = flexibleSearchService.getModelsByExample(ex);

		if (result.size() == 1)
		{
			return result.get(0);
		}
		else if (result.size() > 1)
		{
			throw new IllegalStateException("Too many results for " + id);
		}

		return null;
	}

	@Override
	public void set(final CxaiConfigModel model, final CxaiAssistantConfigModel config)
	{
		if (config != null && config.getConfigId() != null)
		{
			model.setAssistantConfigId(config.getConfigId());
		}
		else
		{
			model.setAssistantConfigId(null);
		}
	}

}
