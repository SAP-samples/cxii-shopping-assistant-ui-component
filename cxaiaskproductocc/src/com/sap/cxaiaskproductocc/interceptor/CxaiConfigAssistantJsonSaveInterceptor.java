package com.sap.cxaiaskproductocc.interceptor;

import de.hybris.platform.core.model.CxaiAssistantConfigModel;
import de.hybris.platform.servicelayer.interceptor.InterceptorContext;
import de.hybris.platform.servicelayer.interceptor.InterceptorException;
import de.hybris.platform.servicelayer.interceptor.ValidateInterceptor;

import org.apache.commons.lang3.StringUtils;
import org.apache.log4j.Logger;

import com.google.gson.Gson;
import com.google.gson.GsonBuilder;
import com.google.gson.JsonElement;
import com.google.gson.JsonParser;
import com.google.gson.JsonSyntaxException;
import com.google.gson.stream.MalformedJsonException;
import com.sap.cxai.model.CxaiConfigModel;


public class CxaiConfigAssistantJsonSaveInterceptor implements ValidateInterceptor<CxaiConfigModel>
{
	private static final Logger LOGGER = Logger.getLogger(CxaiConfigAssistantJsonSaveInterceptor.class);
	private final Gson gson = new Gson();
	private final Gson prettyGson = new GsonBuilder().setPrettyPrinting().create();

	@Override
	public void onValidate(final CxaiConfigModel model, final InterceptorContext ctx) throws InterceptorException
	{
		final String payload = StringUtils.trim(model.getAssistantProductFiltersJson());

		if (StringUtils.isEmpty(payload))
		{
			model.setAssistantProductFiltersJson("");
			return;
		}

		try
		{
			String cleanedPayload = stripTrailingCommas(payload);
			if (cleanedPayload.charAt(0) == '{')
			{
				cleanedPayload = "[" + cleanedPayload + "]";
			}

			final JsonElement sourceObject = JsonParser.parseString(cleanedPayload).getAsJsonArray();
			model.setAssistantProductFiltersJson(this.prettyGson.toJson(sourceObject));
		}
		catch (final JsonSyntaxException ex)
		{
			LOGGER.error("Invalid json", ex);
			String message = ex.getMessage();
			if (ex.getCause() instanceof MalformedJsonException)
			{
				message = ex.getCause().getMessage();
			}

			throw new InterceptorException("Invalid JSON: " + message, ex);
		}

	}

	public static final String stripTrailingCommas(final String jsonString)
	{
		return jsonString.replaceAll(",(\\s*(?:[}\\]]|$))", "$1");
	}

	protected boolean isModified(final CxaiAssistantConfigModel model, final InterceptorContext ctx, final String attribute)
	{
		return ctx.getDirtyAttributes(model).containsKey(attribute);
	}

}
