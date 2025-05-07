package com.sap.cxaiaskproductocc.interceptor;

import de.hybris.platform.catalog.CatalogService;
import de.hybris.platform.catalog.model.CatalogModel;
import de.hybris.platform.core.PK;
import de.hybris.platform.core.model.CxaiAssistantConfigModel;
import de.hybris.platform.servicelayer.interceptor.InterceptorContext;
import de.hybris.platform.servicelayer.interceptor.InterceptorException;
import de.hybris.platform.servicelayer.interceptor.LoadInterceptor;
import de.hybris.platform.servicelayer.interceptor.PrepareInterceptor;
import de.hybris.platform.servicelayer.interceptor.RemoveInterceptor;

import java.text.MessageFormat;
import java.util.Collections;
import java.util.Date;
import java.util.HashMap;
import java.util.HashSet;
import java.util.Map;
import java.util.Objects;
import java.util.Set;

import org.apache.commons.lang3.StringUtils;
import org.apache.log4j.Logger;

import com.google.gson.Gson;
import com.google.gson.GsonBuilder;
import com.google.gson.JsonSyntaxException;
import com.google.gson.stream.MalformedJsonException;
import com.sap.cxai.model.CxaiConfigModel;
import com.sap.cxaiaskproductocc.service.BackofficeCxaiApiServiceWrapper;


public class CxaiAssistantConfigSaveInterceptor implements PrepareInterceptor<CxaiAssistantConfigModel>,
		RemoveInterceptor<CxaiAssistantConfigModel>, LoadInterceptor<CxaiAssistantConfigModel>
{
	private static final Logger LOGGER = Logger.getLogger(CxaiAssistantConfigSaveInterceptor.class);
	private final BackofficeCxaiApiServiceWrapper cxaiAssistantApiService;
	private final CatalogService catalogService;
	private final Gson gson = new Gson();
	private final Gson prettyGson = new GsonBuilder().setPrettyPrinting().create();

	//except agent_id / config_id which is synced only on creation
	private final Map<String, String> synchAttributes = new HashMap<>();
	private final Set<PK> currentlyLoading = new HashSet<>();

	public static final String CATALOG_ID = "catalog_id";

	public CxaiAssistantConfigSaveInterceptor(final BackofficeCxaiApiServiceWrapper cxaiAssistantApiService,
			final CatalogService catalogService)
	{
		super();
		this.cxaiAssistantApiService = cxaiAssistantApiService;
		this.catalogService = catalogService;

		this.synchAttributes.put(CxaiAssistantConfigModel.NAME, "agent_name");
		this.synchAttributes.put(CxaiAssistantConfigModel.DESCRIPTION, "agent_description");
		this.synchAttributes.put(CxaiAssistantConfigModel.ACTIVE, "is_active");
		this.synchAttributes.put(CxaiAssistantConfigModel.INITIALMESSAGE, "initial_message");
		//productCatalog is synced manually because it is more complex
		this.synchAttributes.put(CxaiAssistantConfigModel.PRODUCTCATALOGVERSION, "catalog_version");
		this.synchAttributes.put(CxaiAssistantConfigModel.DEFAULTLANGUAGE, "global_settings.default_language?");
	}

	protected void saveRefreshTime(final CxaiAssistantConfigModel model)
	{
		model.setSynchTimestamp(new Date());
	}

	protected boolean shouldLoadRemoteData(final CxaiAssistantConfigModel model)
	{
		return model.getSynchTimestamp() == null;
	}

	@Override
	public void onLoad(final CxaiAssistantConfigModel model, final InterceptorContext ctx) throws InterceptorException
	{
		if (!shouldLoadRemoteData(model))
		{
			LOGGER.trace("onLoad " + model.getPk() + " skipped because of synchTimestamp");
			return;
		}

		if (StringUtils.isNotBlank(model.getConfigId()))
		{
			try
			{
				final var result = this.cxaiAssistantApiService.getRemoteConfig(getCxaiConfig(model), model.getConfigId());
				final var jsonResponse = parseJson(result);
				this.saveRefreshTime(model);

				try
				{
					this.synchJsonToModel(jsonResponse, model);
					model.setValid(true);
				}
				catch (final Exception ex)
				{
					LOGGER.error("Error synching json to model: " + ex.getMessage());
					LOGGER.debug(ex);
					model.setValid(false);
				}
			}
			catch (final Exception ex)
			{
				final String message = "Error loading config " + model.getConfigId();
				LOGGER.error(message, ex);
				model.setJson("<" + message + ">");
				model.setValid(false);
			}

			if (ctx.isModified(model))
			{
				try
				{
					//this is to disable onSave interceptor to not PUT data that is already fresh
					this.currentlyLoading.add(model.getPk());
					ctx.getModelService().save(model);
				}
				finally
				{
					this.currentlyLoading.remove(model.getPk());
				}
			}
		}
	}

	protected Map parseJsonNoHandleException(final String json)
	{
		return gson.fromJson(json, Map.class);
	}

	protected Map parseJson(final String json) throws InterceptorException
	{
		try
		{
			return parseJsonNoHandleException(json);
		}
		catch (final JsonSyntaxException ex)
		{
			String message = ex.getMessage();
			if (ex.getCause() != null && ex.getCause() instanceof MalformedJsonException)
			{
				message = ex.getCause().getMessage();
			}
			throw new InterceptorException(message, ex);
		}
		catch (final Exception ex)
		{
			throw new InterceptorException("Error parsing json", ex);
		}
	}

	@Override
	public void onPrepare(final CxaiAssistantConfigModel model, final InterceptorContext ctx) throws InterceptorException
	{
		if (ctx.isNew(model))
		{
			if (StringUtils.isBlank(model.getConfigId()))
			{
				createConfigFromJson(model);
			}
			else
			{
				fetchRemoteConfigById(model);
			}
		}
		else if (!currentlyLoading.contains(model.getPk()) && ctx.isModified(model))
		{
			Map<String, Object> putPayload = null;

			if (isModified(model, ctx, CxaiAssistantConfigModel.JSON))
			{
				//here we discard any model changes
				putPayload = parseJson(model.getJson());
			}
			else if (isAnySynchAttributeModified(model, ctx))
			{
				//here we need to get full JSON, adjust it with fresh model data
				putPayload = parseJson(model.getJson());
				this.synchModelToJson(model, putPayload, ctx);
			}

			if (putPayload != null)
			{
				final var result = this.cxaiAssistantApiService.updateRemoteConfig(getCxaiConfig(model), model.getConfigId(),
						putPayload);
				final var jsonResult = parseJson(result);
				this.synchJsonToModel(jsonResult, model);
				this.saveRefreshTime(model);
			}
		}
	}

	protected boolean isAnySynchAttributeModified(final CxaiAssistantConfigModel model, final InterceptorContext ctx)
	{
		if (isModified(model, ctx, CxaiAssistantConfigModel.PRODUCTCATALOG))
		{
			return true;
		}

		return this.synchAttributes.keySet().stream() //
				.anyMatch(a -> isModified(model, ctx, a));
	}

	protected boolean isModified(final CxaiAssistantConfigModel model, final InterceptorContext ctx, final String attribute)
	{
		return ctx.getDirtyAttributes(model).containsKey(attribute);
	}

	@Override
	public void onRemove(final CxaiAssistantConfigModel model, final InterceptorContext ctx) throws InterceptorException
	{
		if (!ctx.isNew(model) && StringUtils.isNotBlank(model.getConfigId()))
		{
			LOGGER.info("Removing config " + model.getConfigId() + ", also remove on remote = "
					+ model.isRemoveRemoteConfigWhenObjectIsDeleted());

			if (model.isRemoveRemoteConfigWhenObjectIsDeleted() && model.isValid())
			{
				try
				{
					this.cxaiAssistantApiService.deleteRemoteConfig(getCxaiConfig(model), model.getConfigId());
				}
				catch (final Exception ex)
				{
					LOGGER.warn("Failed to remove configId " + model.getConfigId(), ex);
				}
			}
		}
	}

	private void fetchRemoteConfigById(final CxaiAssistantConfigModel model) throws InterceptorException
	{
		final String configId = model.getConfigId();
		final var result = this.cxaiAssistantApiService.getRemoteConfig(getCxaiConfig(model), configId);
		final var jsonResponse = parseJson(result);
		this.synchJsonToModel(jsonResponse, model);
	}

	public void createConfigFromJson(final CxaiAssistantConfigModel model) throws InterceptorException
	{
		if (StringUtils.isBlank(model.getJson()) || StringUtils.isNotBlank(model.getConfigId()))
		{
			throw new InterceptorException(
					"Create config: JSON must not be empty, and configId must be empty, configId=" + model.getConfigId());
		}

		final var payload = parseJson(model.getJson());
		final var result = this.cxaiAssistantApiService.createRemoteConfig(getCxaiConfig(model), payload);

		final var jsonResponse = parseJson(result);
		this.synchJsonToModel(jsonResponse, model);
		//we set it to true only for configs created from backoffice
		model.setRemoveRemoteConfigWhenObjectIsDeleted(true);
		this.saveRefreshTime(model);
	}

	protected Object getJsonValue(final Map<String, Object> jsonObject, final String jsonPathString) throws InterceptorException
	{
		return this.getAndPutJsonValue(jsonObject, jsonPathString, null);
	}

	protected Object getAndPutJsonValue(final Map<String, Object> jsonObject, final String jsonPathString,
			final JsonAction newValue) throws InterceptorException
	{
		final String[] jsonPath = jsonPathString.split("\\.");

		Object jsonValue = null;
		Map<String, Object> subObject = jsonObject;

		for (int i = 0; i < jsonPath.length; i++)
		{
			final boolean optional = jsonPath[i].endsWith("?");
			final boolean lastElement = i == jsonPath.length - 1;
			final String key = jsonPath[i].replaceFirst("\\?", "");

			if (!subObject.containsKey(key))
			{
				if (!optional)
				{
					throw new InterceptorException(jsonPathString + " not found in " + jsonObject);
				}
				else if (newValue != null && !lastElement)
				{
					//create object to hold new value
					subObject.put(key, new HashMap<String, Object>());
				}
			}

			jsonValue = subObject.get(key);

			if (newValue != null && lastElement)
			{
				if (newValue instanceof final JsonAction.Set set)
				{
					subObject.put(key, set.value());
				}
				else if (newValue instanceof JsonAction.Remove)
				{
					subObject.remove(key);
				}
			}

			subObject = jsonValue instanceof Map ? (Map) jsonValue : Collections.emptyMap();
		}

		return jsonValue;
	}

	public void synchModelToJson(final CxaiAssistantConfigModel model, final Map<String, Object> jsonObject,
			final InterceptorContext ctx) throws InterceptorException
	{
		final String jsonProductCatalogId = (String) jsonObject.get(CATALOG_ID);
		final String modelProductCatalogId = model.getProductCatalog() == null ? null : model.getProductCatalog().getId();

		if (ctx == null || ctx.isModified(model, CxaiAssistantConfigModel.PRODUCTCATALOG))
		{
			jsonObject.put(CATALOG_ID, modelProductCatalogId);
		}

		for (final var entry : synchAttributes.entrySet())
		{
			if (ctx == null || ctx.isModified(model, entry.getKey()))
			{
				final var modelValue = model.getProperty(entry.getKey());
				final JsonAction action = new JsonAction.Set(modelValue);
				final var jsonValue = getAndPutJsonValue(jsonObject, entry.getValue(), action);

				LOGGER.debug(MessageFormat.format("synchModelToJson {0}: {1} -> {2}", entry.getValue(), jsonValue, modelValue));
				jsonObject.put(entry.getValue(), modelValue);
			}
		}
	}

	public void synchJsonToModel(final Map<String, Object> jsonObject, final CxaiAssistantConfigModel model)
			throws InterceptorException
	{
		if (StringUtils.isBlank(model.getConfigId()))
		{
			model.setConfigId((String) jsonObject.get("agent_id"));
		}

		final String prettyJson = prettyGson.toJson(jsonObject);
		final String oldJson = model.getJson();

		if (!Objects.equals(oldJson, prettyJson))
		{
			model.setJson(prettyJson);
		}

		//productCatalog
		final String jsonProductCatalogId = (String) jsonObject.get(CATALOG_ID);
		final String modelProductCatalogId = model.getProductCatalog() == null ? null : model.getProductCatalog().getId();
		if (!Objects.equals(modelProductCatalogId, jsonProductCatalogId))
		{
			LOGGER.debug(MessageFormat.format("synchJsonToModel {0}: {1} -> {2}", "catalog_id", modelProductCatalogId,
					jsonProductCatalogId));
			final CatalogModel newCatalog = catalogService.getCatalogForId(jsonProductCatalogId);
			model.setProductCatalog(newCatalog);
		}

		for (final var entry : synchAttributes.entrySet())
		{
			final Object modelValue = model.getProperty(entry.getKey());
			final Object jsonValue = getJsonValue(jsonObject, entry.getValue());

			if (!Objects.equals(modelValue, jsonValue))
			{
				LOGGER.debug(MessageFormat.format("synchJsonToModel {0}: {1} -> {2}", entry.getKey(), modelValue, jsonValue));
				model.setProperty(entry.getKey(), jsonValue);
			}
		}
	}

	protected CxaiConfigModel getCxaiConfig(final CxaiAssistantConfigModel model) throws InterceptorException
	{
		if (model.getCxaiConfig() == null)
		{
			throw new InterceptorException("CX AI config is missing");
		}
		return model.getCxaiConfig();
	}

	sealed static interface JsonAction permits JsonAction.Set, JsonAction.Remove
	{
		/** Set key to specific value, including null */
		record Set(Object value) implements JsonAction
		{
		}

		/** Remove key completely */
		record Remove() implements JsonAction
		{
		}
	}
}
