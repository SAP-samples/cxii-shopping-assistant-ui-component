package com.sap.cxaiaskproductocc.controllers;

import static de.hybris.platform.webservicescommons.mapping.FieldSetLevelHelper.DEFAULT_LEVEL;

import de.hybris.platform.commercefacades.order.data.ConsignmentData;
import de.hybris.platform.ordersplitting.model.ConsignmentModel;
import de.hybris.platform.servicelayer.dto.converter.Converter;
import de.hybris.platform.servicelayer.search.FlexibleSearchService;
import de.hybris.platform.servicelayer.user.UserService;
import de.hybris.platform.webservicescommons.mapping.DataMapper;
import de.hybris.platform.webservicescommons.swagger.ApiFieldsParam;

import org.apache.log4j.Logger;
import org.springframework.security.access.annotation.Secured;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.sap.cxaiaskproductocc.model.CxaiExtendedConsignmentWsDTO;


@RestController
@RequestMapping("/{baseSiteId}/cxai/tools")
public class AssistantToolsController
{
	private static final Logger LOGGER = Logger.getLogger(AssistantToolsController.class);
	private final FlexibleSearchService flexibleSearchService;
	private final Converter<ConsignmentModel, ConsignmentData> consignmentConverter;
	private final DataMapper dataMapper;
	private final UserService userService;

	public AssistantToolsController(final FlexibleSearchService flexibleSearchService,
			final Converter<ConsignmentModel, ConsignmentData> consignmentConverter, final DataMapper dataMapper,
			final UserService userService)
	{
		this.flexibleSearchService = flexibleSearchService;
		this.consignmentConverter = consignmentConverter;
		this.dataMapper = dataMapper;
		this.userService = userService;
	}

	@GetMapping("/find-consignment/{trackingId}")
	@Secured(
	{ "ROLE_CUSTOMERGROUP" })
	public CxaiExtendedConsignmentWsDTO getConsignmentByTrackingId(@PathVariable final String trackingId, @ApiFieldsParam
	@RequestParam(defaultValue = DEFAULT_LEVEL) final String fields)
	{
		final ConsignmentModel example = new ConsignmentModel();
		example.setTrackingID(trackingId);

		final var results = flexibleSearchService.getModelsByExample(example);
		if (results.size() != 1)
		{
			LOGGER.warn(results.size() + " consignments found for tracking ID " + trackingId);
			return null;
		}
		else
		{
			final var consignment = results.get(0);
			final var currentUser = userService.getCurrentUser();
			if (consignment.getOrder().getUser() == null || !consignment.getOrder().getUser().getUid().equals(currentUser.getUid()))
			{
				LOGGER.warn("Consignment " + trackingId + " does not belong to " + currentUser.getUid());
				return null;
			}

			final ConsignmentData consignmentData = consignmentConverter.convert(consignment);

			final CxaiExtendedConsignmentWsDTO result = dataMapper.map(consignmentData, CxaiExtendedConsignmentWsDTO.class, fields);
			result.setOrderCode(consignment.getOrder().getCode());
			return result;
		}
	}

}
