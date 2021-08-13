import home from '../images/home.svg';
import homeLight from '../images/home-light.svg';
import contacts from '../images/contacts.svg';
import contactsLight from '../images/contacts-light.svg';
import payments from '../images/payments.svg';
import paymentsLight from '../images/payments-light.svg';
import settings from '../images/settings.svg';
import settingsLight from '../images/settings-light.svg';
import transactions from '../images/list.svg';
import transactionsLight from '../images/list-light.svg';

import gustoLogo from '../images/gusto.svg';
import googleSheetsLogo from '../images/google-sheets.svg';

export const ADDRESS_ZERO = '0x0000000000000000000000000000000000000000';
export const ADDRESS_EXAMPLE = '0xab5801a7d398351b8be11c439e05c5b3259aec9a';

export const MESSAGE_TYPES = {
  TASK: 'task',
  NOTIFICATION: 'notification',
};

export const TASKS = {
  REQUEST_ACCOUNTS: 'request_accounts',
  GET_ACCOUNTS: 'get_accounts',
  GET_NETWORK: 'get_network',
  GET_BALANCE: 'get_balance',
  MAKE_PAYOUT: 'make_payout',
  CLEAN_TRANSACTIONS: 'clean_transactions',
  SYNC_GOOGLE_SHEETS: 'sync_google_sheets',
};

export const NOTIFICATIONS = {
  PAYOUT_INITIATED: 'payout_initiated',
  PAYOUT_COMPLETED: 'payout_completed',
  PAYOUT_FAILED: 'payout_failed',
};

export const SCREENS = {
  AUTH: 'auth',
  HOME: 'home',
  CONTACTS: 'contacts',
  PAYMENTS: 'payments',
  TRANSACTIONS: 'transactions',
  SETTINGS: 'settings',
};

export const SCREEN_DETAILS = {
  [SCREENS.HOME]: {
    title: 'Grindery',
    icon: {
      main: home,
      light: homeLight,
    }
  },
  [SCREENS.CONTACTS]: {
    title: 'Contacts',
    icon: {
      main: contacts,
      light: contactsLight,
    }
  },
  [SCREENS.PAYMENTS]: {
    title: 'Payments',
    icon: {
      main: payments,
      light: paymentsLight,
    }
  },
  [SCREENS.TRANSACTIONS]: {
    title: 'Transactions',
    icon: {
      main: transactions,
      light: transactionsLight,
    }
  },
  [SCREENS.SETTINGS]: {
    title: 'Settings',
    icon: {
      main: settings,
      light: settingsLight,
    }
  },
};

export const DIALOG_ACTIONS = {
  ADD_CONTACT: 'add_contact',
  ADD_PAYMENT: 'add_payment',
  MAKE_PAYOUT: 'make_payout',
  CONNECT_GOOGLE_SHEET: 'connect_google_sheet',
};

export const PAYMENT_TYPES = {
  ONE_TIME: 'one_time',
  WEEKLY: 'weekly',
  BI_WEEKLY: 'bi_weekly',
  MONTHLY: 'monthly',
  QUARTERLY: 'quarterly',
  ANNUAL: 'annual',
};

export const PAYMENT_TYPES_DISPLAY = {
  [PAYMENT_TYPES.ONE_TIME]: 'One Time',
  [PAYMENT_TYPES.WEEKLY]: 'Weekly',
  [PAYMENT_TYPES.BI_WEEKLY]: 'Bi-Weekly',
  [PAYMENT_TYPES.MONTHLY]: 'Monthly',
  [PAYMENT_TYPES.QUARTERLY]: 'Quarterly',
  [PAYMENT_TYPES.ANNUAL]: 'Annual',
};

export const INTEGRATIONS = {
  GUSTO: 'gusto',
  GOOGLE_SHEETS: 'google_sheets',
};

export const INTEGRATION_DETAILS = {
  [INTEGRATIONS.GUSTO]: {
    logo: gustoLogo,
  },
  [INTEGRATIONS.GOOGLE_SHEETS]: {
    logo: googleSheetsLogo,
  }
};

export const SPREADSHEET_COLUMNS = {
  NAME: 'name',
  EMAIL: 'email',
  ADDRESS: 'address',
  AMOUNT: 'amount',
  DUE_DATE: 'due_date',
};

export const SPREADSHEET_COLUMNS_DISPLAY = {
  [SPREADSHEET_COLUMNS.NAME]: 'Name',
  [SPREADSHEET_COLUMNS.EMAIL]: 'Email',
  [SPREADSHEET_COLUMNS.ADDRESS]: 'Wallet Address',
  [SPREADSHEET_COLUMNS.AMOUNT]: 'Amount',
  [SPREADSHEET_COLUMNS.DUE_DATE]: 'Due Date',
};
