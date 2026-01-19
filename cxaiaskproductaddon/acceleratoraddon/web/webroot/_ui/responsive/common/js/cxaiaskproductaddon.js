ACC.cxaiaskproduct = {
  //option to overwrite default i18n values
  i18n: {},
  // set in JSP component to disable fetching it from occ endpoint
  config: undefined,
};

ACC.cxaiassistant = {
  //option to overwrite default i18n values
  i18n: {},
};

ACC.spartacus = {
  occEndpoints: {
    cxaiAssistant_postMessage: '/cxai/assistant/chat',
    cxaiAssistant_getChatSession: '/cxai/assistant/chat_session/${sessionId}',
    cxaiAssistant_createChatSession: '/cxai/assistant/chat_session',
    cxaiAssistant_deleteChatSession: '/cxai/assistant/sessions',
    product:
      'products/${productCode}?fields=DEFAULT,averageRating,images(FULL),classifications,manufacturer,numberOfReviews,categories(FULL),baseOptions,baseProduct,variantOptions,variantType',
  },
  urls: {
    //ACC.config.encodedContextPath will be prefixed in runtime for urls starting with /
    product: '/p',
    orderDetails: '/my-account/order',
  },
	//image formats to try to render from media container
  imageFormats: ['thumbnail', 'product', 'zoom'],
};
