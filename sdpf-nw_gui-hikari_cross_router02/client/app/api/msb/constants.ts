export const MSB_LINK = {
  DETAIL: 'https://sdpf.ntt.com/services/rink-edr-lite/',
  CONSOLE: 'https://my.webrootanywhere.com/default.asp',
}

export const CustomerTypes = {
  Corporate: 'corporate',
  Government: 'government',
} as const

export const initialMsbInputData = {
  departmentName: '',
  customerType: CustomerTypes.Corporate,
  emailAddress: '',
  customerSpecialNote: '',
  licensePacks: {
    '1licensePacks': '0',
    '10licensePacks': '0',
    '100licensePacks': '0',
    '1000licensePacks': '0',
    '10000licensePacks': '0',
  },
}

export const initialMsbValid = {
  departmentName: false,
  emailAddress: false,
  customerSpecialNote: true,
}

export const initialMsbEditInputData = {
  emailAddress: '',
  customerSpecialNote: '',
  licensePacks: {
    '1licensePacks': '0',
    '10licensePacks': '0',
    '100licensePacks': '0',
    '1000licensePacks': '0',
    '10000licensePacks': '0',
  },
}

export const initialMsbEditValid = {
  emailAddress: false,
  customerSpecialNote: true,
}

export const initialMsbDeleteInputData = {
  emailAddress: '',
  reason: '',
  customerSpecialNote: '',
}

export const initialMsbDeleteValid = {
  emailAddress: false,
  reason: false,
  customerSpecialNote: true,
}
