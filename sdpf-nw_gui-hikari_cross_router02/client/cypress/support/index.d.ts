// テスト用なので実装の手間を考えて any を許容する
/* eslint-disable @typescript-eslint/no-explicit-any */

// 名前空間Cypressのinterface Chainable<Subject = any>を拡張する
declare namespace Cypress {
  interface Chainable {
    editApplicationFileUpload: (params: { className: string; filePath: string }) => Chainable<void>
    pngFileUpload: (params: {
      className: string
      aliasName: string
      documentId: string
      type?: string
      service?: string
    }) => Chainable<void>
    fieldSurveyLessFileUpload: (params: { className: string; aliasName: string; documentId: string }) => Chainable<void>
    confirmFileUpload: (params: { className: string; documentId: string; disabled?: boolean }) => Chainable<void>
    removeRow: (params: { className: string; buttonClassName: string }) => Chainable<void>
    removeRowEditTable: (params: { className: string }) => Chainable<void>
    removeRowMultipleForm: (params: { className: string }) => Chainable<void>
    inputSelectForm: (params: { selector: string; value: string }) => Chainable<void>
    inputDatePicker: (params: { className: string; date: string }) => Chainable<void>
    confirmDatePicker: (params: { className: string; date: string; disabled?: boolean }) => Chainable<void>
    inputBreakOut: (params: {
      breakOut: string[]
      interceptDnsServers: string[]
      breakOutList: Array<{ breakOutListId: string; customerNote: string }>
      breakOutClassName: string
      breakOutDnsServersClassName: string
    }) => Chainable<void>
    inputEditCustomLocalBreakOutList: (params: {
      customLocalBreakOutList: Array<any>
      maxItems: number
      className: string
    }) => Chainable<void>
    assertSystemLocalBreakOutList: (params: {
      systemLocalBreakOutList: Array<any>
      customLocalBreakOutList: Array<any>
      className: string
    }) => Chainable<void>
    assertEditCustomLocalBreakOutList: (params: {
      customLocalBreakOutList: Array<any>
      className: string
      disabled: boolean
    }) => Chainable<void>
    inputEditVpnNats: (params: { vpnNats: Array<any>; className: string }) => Chainable<void>
    inputEditVpnFilterList: (params: { vpnFilterList: Array<any>; className: string }) => Chainable<void>
    assertEditVpnFilterList: (params: {
      vpnFilterList: Array<any>
      className: string
      disabled: boolean
    }) => Chainable<void>
    inputEditLans: (params: {
      lans: any
      className: string
      lanType?: string
      hideLanInFilters?: boolean
    }) => Chainable<void>
    confirmEditLans: (params: {
      lans: any
      className: string
      disabled?: boolean
      lanType?: string
      hideLanInFilters?: boolean
    }) => Chainable<void>
    inputEditLanStaticRoutes: (params: {
      lanStaticRoutes?: Array<{
        destinationIpv4Prefix: string
        nexthopIpv4Address: string
        vpnRouting: string
        vpnNats?: Array<{ type: string; innerIpv4Prefix: string; outerIpv4Prefix: string }>
      }>
      className: string
    }) => Chainable<void>
    confirmEditLanStaticRoutes: (params: {
      lanStaticRoutes?: Array<{
        destinationIpv4Prefix: string
        nexthopIpv4Address: string
        vpnRouting: string
        vpnNats?: Array<{ type: string; innerIpv4Prefix: string; outerIpv4Prefix: string }>
      }>
      className: string
      disabled?: boolean
    }) => Chainable<void>
    inputEditWanStaticRoutes: (params: {
      wanStaticRoutes?: Array<{ destinationIpv4Prefix: string; nexthopNetwork: string }>
      className: string
    }) => Chainable<void>
    confirmEditWanStaticRoutes: (params: {
      wanStaticRoutes?: Array<{ destinationIpv4Prefix: string; nexthopNetwork: string }>
      className: string
      disabled?: boolean
    }) => Chainable<void>
    inputEditFilters: (params: {
      inputData: any
      className: string
      sourceIpv4PrefixStaticValue?: string
      destinationIpv4PrefixStaticValue?: string
    }) => Chainable<void>
    confirmEditFilters: (params: {
      inputData: any
      className: string
      disabled?: boolean
      sourceIpv4PrefixStaticValue?: string
      destinationIpv4PrefixStaticValue?: string
    }) => Chainable<void>
    confirmEditCircuitTypes: (params: {
      className: string
      isRouter02?: boolean
      circuitType?: { primary: string; secondary?: string }
    }) => Chainable<void>
    inputTerminalMobile: (params: {
      inputData: any
      document: { aliasName: string; id: string }
      originalRat?: 'auto' | 'lte'
    }) => Chainable<void>
    inputTerminalMobilePicInformationInPerson: (params: {
      inputData: any
      document: { aliasName: string; id: string }
    }) => Chainable<void>
    inputTerminalMobilePicInformationMyNumberCard: (params: { inputData: any }) => Chainable<void>
    inputTerminalWithoutMobile: (params: {
      inputData: any
      className?: string
      isEdit?: boolean
      isBulk?: boolean
      breakOutList: Array<{ breakOutListId: string; customerNote: string }>
      guaranteeList?: Array<{ guaranteeId: string; customerNote: string }>
      ipoeList?: Array<{ ipoeId: string; customerNote: string }>
      vpnList?: Array<{ vpnId: string; customerNote: string }>
      originalData?: any
    }) => Chainable<void>
    confirmTerminalMobile: (params: { inputData: any; disabled?: boolean }) => Chainable<void>
    confirmTerminalMobilePicInformationMyNumberCard: (params: { inputData: any; disabled?: boolean }) => Chainable<void>
    confirmTerminalMobilePicInformationInPerson: (params: { inputData: any; disabled?: boolean }) => Chainable<void>
    confirmTerminalWithoutMobile: (params: {
      inputData: any
      className?: string
      isBulk?: boolean
      disabled?: boolean
      guaranteeList?: Array<{ guaranteeId: string; customerNote: string }>
      ipoeList?: Array<{ ipoeId: string; customerNote: string }>
      vpnList?: Array<{ vpnId: string; customerNote: string }>
      assertion?: {
        lanStaticRoutes?: Array<any>
        wanStaticRoutes?: Array<any>
      }
    }) => Chainable<void>
    inputReserveDateAndSubmit: (params: { inputData: any; errorCode?: number; retry?: boolean }) => Chainable<void>
    assertEditFieldSurveyAndConstruction: (params: { fieldSurvey: any; construction: any }) => Chainable<void>
    inputEditFieldSurveyAndConstruction: (params: { fieldSurvey: any; construction: any }) => Chainable<void>
    inputGuaranteeCreate: (params: {
      inputData: any
      terminalType: 'rentalTerminal' | 'selfTerminal'
      reserveDate: { time: string; fieldSurveyMinDate: string; constructionMinDate: string }
      postalCode: string
    }) => Chainable<void>
    inputGuaranteeRemove: (params: { inputData: any; time?: string; removalMinDate?: string }) => Chainable<void>
    checkGuaranteeRemove: (params: {
      inputData: any
      time?: string
      removalMinDate?: string
      isOrderRequest?: boolean
      isConfirmation?: boolean
    }) => Chainable<void>
    checkGuaranteeYearMonthSelectOptions: (params: { minDate: string }) => Chainable<void>
    getResourceIdName: (params: { fixturePath: string; resourceId: string }) => string
    checkTermsLinkButtonLabel: (params: {
      primaryCircuitType: string
      trafficReportFlowAnalyzerTermsOfServiceAccepted: boolean
      securityTermsOfServiceAccepted: boolean
    }) => Chainable<void>
    checkTermsOfServiceConfirmDialogContent: (params: {
      trafficReportFlowAnalyzer: boolean
      securityOptions: boolean
      behaviorDetectionPlan: boolean
    }) => Chainable<void>
    checkTerminalSuccessDialog: (params: {
      securityHelpDeskStatus?: string
      threatDetectionPlan?: string
      flowCollectorPlan?: string
      behaviorDetectionPlan?: string
      orderId?: string
      bulkOrderId?: string
      terminalId?: string
    }) => Chainable<void>
    clickCreateConfirmCheckboxes: (params: {
      terminal: {
        vpnId: string
        primaryCircuitType: string
        secondaryCircuitType?: string
      }
    }) => Chainable<void>
    clickCreateTermsOfServiceCheckboxes: (params: {
      terminal: {
        primaryCircuitType: string
        secondaryCircuitType?: string
        defaultGateway: { nexthopNetwork: string }
        breakOut: string[]
        vpnId?: string
        threatDetection?: { threatDetectionPlan: string }
        flowCollector?: { flowCollectorPlan: string }
        behaviorDetection?: { behaviorDetectionPlan: string }
        trafficReportFlowAnalyzer?: { trafficReportFlowAnalyzerPlan: string }
      }
    }) => Chainable<void>
    inputTimeFrame: (params: { className: string; scheduleNetworks: string[] }) => Chainable<void>
    inputShippingInformation: (params: {
      shippingPostalCode: string
      shippingPrefecture: string
      shippingCity: string
      shippingCityAdditionalInfo: string
      shippingAddressBlock: string
      shippingAddressNumber: string
      shippingBuilding?: string
      packageRecipient: string
      phoneNumber: string
    }) => Chainable<void>
    confirmShippingInformation: (params?: {
      shippingPostalCode: string
      shippingPrefecture: string
      shippingCity: string
      shippingCityAdditionalInfo: string
      shippingAddressBlock: string
      shippingAddressNumber: string
      shippingBuilding?: string
      packageRecipient: string
      phoneNumber: string
    }) => Chainable<void>
  }
}
