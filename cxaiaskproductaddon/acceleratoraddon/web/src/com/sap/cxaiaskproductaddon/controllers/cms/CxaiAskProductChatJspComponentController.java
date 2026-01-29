package com.sap.cxaiaskproductaddon.controllers.cms;

import de.hybris.platform.cms2.model.contents.components.AbstractCMSComponentModel;

import javax.servlet.http.HttpServletRequest;

import org.apache.log4j.Logger;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.RequestMapping;

import com.sap.cxaiaskproductaddon.controllers.CxaiaskproductaddonControllerConstants;


@Controller("CxaiAskProductChatJspComponentController")
@RequestMapping(value = CxaiaskproductaddonControllerConstants.Views.Cms.CxaiAskProductChatJsp)
public class CxaiAskProductChatJspComponentController extends BaseCxaiJspComponentController
{
	private static final Logger LOG = Logger.getLogger(CxaiAskProductChatJspComponentController.class);

	@Override
	protected void fillModel(final HttpServletRequest request, final Model model, final AbstractCMSComponentModel component)
	{
		super.fillModel(request, model, component);
	}
}
