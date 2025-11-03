/**
 *
 */
package com.sap.cxaiaskproductocc.model;

import de.hybris.platform.commercewebservicescommons.dto.order.ConsignmentWsDTO;


/**
 * Normally orderCode is added by warehousingfacades extension but we can't hardcode this dependency
 */
public class CxaiExtendedConsignmentWsDTO extends ConsignmentWsDTO
{
	private String orderCode;

	//@Override
	public String getOrderCode()
	{
		return orderCode;
	}

	//@Override
	public void setOrderCode(final String orderCode)
	{
		this.orderCode = orderCode;
	}
}
