package com.sap.cxaiaskproductaddon.controllers.cms;

import de.hybris.platform.cms2.model.contents.components.AbstractCMSComponentModel;

import javax.annotation.Resource;
import javax.servlet.http.HttpServletRequest;

import org.apache.log4j.Logger;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.RequestMapping;

import com.sap.cxaiaskproductaddon.controllers.CxaiaskproductaddonControllerConstants;
import com.sap.cxaiaskproductaddon.service.AcceleratorOccTokenService;


@Controller("CxaiAssistantChatJspComponentController")
@RequestMapping(value = CxaiaskproductaddonControllerConstants.Views.Cms.CxaiAssistantChatJsp)
public class CxaiAssistantChatJspComponentController extends BaseCxaiJspComponentController
{
	private static final Logger LOG = Logger.getLogger(CxaiAssistantChatJspComponentController.class);

	@Resource(name = "acceleratorOccTokenService")
	private AcceleratorOccTokenService acceleratorOccTokenService;

	@Override
	protected void fillModel(final HttpServletRequest request, final Model model, final AbstractCMSComponentModel component)
	{
		super.fillModel(request, model, component);

		final String occToken = this.acceleratorOccTokenService.getOccTokenForCurrentUser();

		model.addAttribute("occToken", occToken);
	}

}
