package com.sap.cxaiaskproductaddon.service.impl;

import org.apache.log4j.Logger;

import com.sap.cxaiaskproductaddon.service.AcceleratorOccTokenService;


public class NoopAcceleratorOccTokenService implements AcceleratorOccTokenService
{
	private static final Logger LOG = Logger.getLogger(NoopAcceleratorOccTokenService.class);

	@Override
	public String getOccTokenForCurrentUser()
	{
		LOG.debug("Not using occ token service");
		return null;
	}

}
