import React from 'react';

export const defaultAppState = {
  isNewUser: false,
  hidePaymentNotice: false,
  accessToken: null,
  screen: null,
  dialog: null,
  addresses: [],
  networks: null,
  currency: null,
  rate: 0,
  contacts: [],
  payments: [],
  transactions: [],
  integrations: [],
};

const defaultFunction = () => {};

export default React.createContext({
  ...defaultAppState,
  authenticate: defaultFunction(),

  // Actions
  logOut: defaultFunction(),
  changeScreen: defaultFunction(),
  openDialog: defaultFunction(),
  closeDialog: defaultFunction(),
  addNotification: defaultFunction(),
  updateHidePaymentNotice: defaultFunction(),

  // Wallet
  getWalletInfo: defaultFunction(),
  getNetworkById: defaultFunction(),
  convertToCrypto: defaultFunction(),
  convertToPayableCrypto: defaultFunction(),
  convertPayableToDisplayValue: defaultFunction(),
  convertToFiat: defaultFunction(),

  // Contacts
  getContacts: defaultFunction(),
  addContact: defaultFunction(),
  addContacts: defaultFunction(),

  // Payments
  getPayments: defaultFunction(),
  addPayment: defaultFunction(),
  addPayments: defaultFunction(),

  // Transactions
  getTransactions: defaultFunction(),

  // Integrations
  getIntegrations: defaultFunction(),
  addIntegration: defaultFunction(),
  removeIntegration: defaultFunction(),
});
