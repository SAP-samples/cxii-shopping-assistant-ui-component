/*
 * Copyright (c) 2019 SAP SE or an SAP affiliate company. All rights reserved.
 */
package com.sap.cxaiaskproductaddon.controllers;

import com.sap.cxaiaskproductaddon.model.components.CxaiAskProductChatJspComponentModel;


/**
 */
public interface CxaiaskproductaddonControllerConstants
{
	String ADDON_PREFIX = "addon:/cxaiaskproductaddon";

	interface Views
	{
		interface Cms
		{
			String _Prefix = "/view/";
			String _Suffix = "Controller";

			/**
			 * Customized AddToCartAction controller
			 */
			String CxaiAskProductChatJsp = _Prefix + CxaiAskProductChatJspComponentModel._TYPECODE + _Suffix;

		}
	}
}
