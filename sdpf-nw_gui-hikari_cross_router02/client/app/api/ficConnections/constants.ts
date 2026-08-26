export const RouteAdvertisementTypes = {
  Full: 'fullRoute',
  Private: 'privateAll',
  Default: 'defaultRoute',
} as const

export const FicRequestTypes = {
  FicConnection: 'ficConnection',
  SimpleFicConnection: 'simpleFicConnection',
} as const

export const FIC_URL = {
  FIC_TUTORIAL: 'https://sdpf.ntt.com/services/docs/rink/tutorials/flow/function/fic.html',
  SIMPLE_FIC_TUTORIAL: 'https://sdpf.ntt.com/services/docs/rink/tutorials/flow/function/fic_simple.html',
  SIMPLE_FIC_EXPLANATION:
    'https://sdpf.ntt.com/services/docs/rink/service-descriptions/menu/option_detail/fic.html#fic-simple-transfer',
  FIC_CONSOLE: 'https://jp1.ecl.ntt.com/gui/areas?menu_name=sss.menu.fic&area_name=menu.area.gl1',
} as const
