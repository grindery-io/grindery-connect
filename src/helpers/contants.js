import home from '../images/home.svg';
import homeLight from '../images/home-light.svg';
import contacts from '../images/contacts.svg';
import contactsLight from '../images/contacts-light.svg';
import payments from '../images/payments.svg';
import paymentsLight from '../images/payments-light.svg';
import settings from '../images/settings.svg';
import settingsLight from '../images/settings-light.svg';
import contracts from '../images/contracts.svg';
import contractsLight from '../images/contracts-light.svg';
import transactions from '../images/list.svg';
import transactionsLight from '../images/list-light.svg';

import gustoLogo from '../images/gusto.svg';
import googleSheetsLogo from '../images/google-sheets.svg';
import circleLogo from '../images/circle.svg';

export const ADDRESS_ZERO = '0x0000000000000000000000000000000000000000';
export const ADDRESS_EXAMPLE = '0xab5801a7d398351b8be11c439e05c5b3259aec9a';
export const ADDRESS_IL_SENDER = '0x0cBB9CCA778De38d48F1795E6B8C7E8C8FFAe59B';
export const ADDRESS_TIM_RECIPIENT = '0xb33cB5D3ceD2A477A6C80910c2962De697dbbe48';
export const ADDRESS_DAVID_SENDER = '0x7037f30B4F542ca66c06D377f79c6140947f49b1';
export const ADDRESS_DAVID_RECIPIENT = '0x560b5C4f74194ac3004f37250CCF8F4A611447F1';

export const EXTENSION_SELECTOR = 'grindery-payroll-extension-root';

export const MESSAGE_TYPES = {
  TASK: 'task',
  NOTIFICATION: 'notification',
  ACTION: 'action',
  EVENT: 'event',
};

export const TASKS = {
  REQUEST_ACCOUNTS: 'request_accounts',
  GET_ACCOUNTS: 'get_accounts',
  GET_NETWORK: 'get_network',
  LISTEN_FOR_WALLET_EVENTS: 'listen_for_wallet_events',
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

export const ACTIONS = {
  CLOSE: 'close',
  GET_ACTIVE_GOOGLE_SHEET_DATA: 'get_active_google_sheet_data',
};

export const SCREENS = {
  AUTH: 'auth',
  HOME: 'home',
  CONTACTS: 'contacts',
  PAYMENTS: 'payments',
  CONTRACTS: 'contracts',
  TRANSACTIONS: 'transactions',
  SETTINGS: 'settings',
};

export const SCREEN_DETAILS = {
  [SCREENS.HOME]: {
    title: 'Dashboard',
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
  [SCREENS.CONTRACTS]: {
    title: 'Contracts',
    icon: {
      main: contracts,
      light: contractsLight,
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
    title: 'General Settings',
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
  SHOW_TRANSACTION_DETAILS: 'show_transaction_details',
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
  CIRCLE: 'circle',
};

export const INTEGRATION_DETAILS = {
  [INTEGRATIONS.GUSTO]: {
    logo: gustoLogo,
  },
  [INTEGRATIONS.GOOGLE_SHEETS]: {
    logo: googleSheetsLogo,
  },
  [INTEGRATIONS.CIRCLE]: {
    logo: circleLogo,
  },
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

export const CONTRACT_VIEWS = {
  ALL: 'All',
  RECEIVED: 'Received',
  SENT: 'Sent'
};

export const PAYMENT_VIEWS = {
  ALL: 'All',
  DUE_TODAY: 'Due Today',
  DUE_SOON: 'Due Soon',
  OVERDUE: 'Overdue',
};

export const PAYMENT_DUE_STATES = {
  DUE_TODAY: 'due_today',
  DUE_SOON: 'due_soon',
  OVERDUE: 'overdue',
}

export const TRANSACTION_VIEWS = {
  ALL: 'All',
  RECEIVED: 'Received',
  SENT: 'Sent'
};

export const TRANSACTION_DIRECTIONS = {
  IN: 'in',
  OUT: 'out',
};

export const WALLET_EVENTS = {
  ACCOUNTS_CHANGED: 'accountsChanged',
  CHAIN_CHANGED: 'chainChanged',
  MESSAGE: 'message',
  CONNECT: 'connect',
  DISCONNECT: 'disconnect',
};