import homeIcon from '../images/home.svg';
import homeIconLight from '../images/home-light.svg';
import contactsIcon from '../images/contacts.svg';
import contactsLightIcon from '../images/contacts-light.svg';
import paymentsIcon from '../images/payments.svg';
import paymentsLightIcon from '../images/payments-light.svg';
import contractsIcon from '../images/contracts.svg';
import contractsLightIcon from '../images/contracts-light.svg';
import transactionsIcon from '../images/list.svg';
import transactionsLightIcon from '../images/list-light.svg';
import walletIcon from '../images/wallet.svg';
import walletLightIcon from '../images/wallet-light.svg';
import fundIcon from '../images/fund.svg';
import fundLightIcon from '../images/fund-light.svg';
import withdrawIcon from '../images/withdraw.svg';
import withdrawLightIcon from '../images/withdraw-light.svg';
import settingsIcon from '../images/settings.svg';
import settingsLightIcon from '../images/settings-light.svg';

import gustoLogo from '../images/gusto.svg';
import googleSheetsLogo from '../images/google-sheets.svg';
import circleLogo from '../images/circle.svg';

import ETHIcon from '../images/ETH.svg';
import ONEIcon from '../images/ONE.svg';
import USTIcon from '../images/UST.svg';
import BUSDIcon from '../images/BUSD.svg';
import USDCIcon from '../images/USDC.svg';
import LINKIcon from '../images/LINK.svg';
import USDTIcon from '../images/USDT.svg';
import DAIIcon from '../images/DAI.svg';

export const ADDRESS_ZERO = '0x0000000000000000000000000000000000000000';
export const ADDRESS_EXAMPLE = '0xab5801a7d398351b8be11c439e05c5b3259aec9a';

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
  CREATE_WALLET: 'create_wallet',
  CHANGE_NETWORK: 'change_network',
  GET_TOKEN_BALANCE: 'get_token_balance',
};

export const NOTIFICATIONS = {
  PAYOUT_INITIATED: 'payout_initiated',
  PAYOUT_COMPLETED: 'payout_completed',
  PAYOUT_FAILED: 'payout_failed',
  CREATE_WALLET_INITIATED: 'create_wallet_initiated',
  CREATE_WALLET_COMPLETED: 'create_wallet_completed',
  CREATE_WALLET_FAILED: 'create_wallet_failed',
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
  WALLET: 'wallet',
  FUND: 'fund',
  WITHDRAW: 'withdraw',
  SETTINGS: 'settings',
};

export const SCREEN_DETAILS = {
  [SCREENS.HOME]: {
    title: 'Dashboard',
    icon: {
      main: homeIcon,
      light: homeIconLight,
    }
  },
  [SCREENS.CONTACTS]: {
    title: 'Contacts',
    icon: {
      main: contactsIcon,
      light: contactsLightIcon,
    }
  },
  [SCREENS.PAYMENTS]: {
    title: 'Payments',
    icon: {
      main: paymentsIcon,
      light: paymentsLightIcon,
    }
  },
  [SCREENS.CONTRACTS]: {
    title: 'Contracts',
    icon: {
      main: contractsIcon,
      light: contractsLightIcon,
    }
  },
  [SCREENS.TRANSACTIONS]: {
    title: 'Transactions',
    icon: {
      main: transactionsIcon,
      light: transactionsLightIcon,
    }
  },
  [SCREENS.WALLET]: {
    title: 'Wallet',
    icon: {
      main: walletIcon,
      light: walletLightIcon,
    }
  },
  [SCREENS.FUND]: {
    title: 'Fund',
    icon: {
      main: fundIcon,
      light: fundLightIcon,
    }
  },
  [SCREENS.WITHDRAW]: {
    title: 'Withdraw',
    icon: {
      main: withdrawIcon,
      light: withdrawLightIcon,
    }
  },
  [SCREENS.SETTINGS]: {
    title: 'General Settings',
    tooltip: 'Settings',
    icon: {
      main: settingsIcon,
      light: settingsLightIcon,
    }
  },
};

export const DIALOG_ACTIONS = {
  ADD_CONTACT: 'add_contact',
  ADD_PAYMENT: 'add_payment',
  MAKE_PAYOUT: 'make_payout',
  CONNECT_GOOGLE_SHEET: 'connect_google_sheet',
  SHOW_TRANSACTION_DETAILS: 'show_transaction_details',
  CHANGE_NETWORK: 'change_network',
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

export const WITHDRAW_VIEWS = {
  FIAT: 'FIAT',
  CRYPTO: 'CRYPTO',
};

export const FIAT_CURRENCIES = {
  USD: 'USD',
  //EUR: 'EUR',
};

export const NATIVE_TOKENS = {
  ETH: 'ETH',
  ONE: 'ONE',
};

export const CUSTOM_TOKENS = {
  UST: 'UST',
  BUSD: 'BUSD',
  //USDC: 'USDC',
  //DAI: 'DAI',
  //USDT: 'USDT',
  //LINK: 'LINK',
};

export const DEFAULT_STABLE_COINS = {
  UST_HARMONY_TEST: {
    symbol: CUSTOM_TOKENS.UST,
    name: 'UST-Harmony Testnet',
    chainId: 1666700000,
    icon: USTIcon,
  },
  BUSD_HARMONY_TEST: {
    symbol: CUSTOM_TOKENS.BUSD,
    name: 'BUSD-Harmony Testnet',
    chainId: 1666700000,
    icon: BUSDIcon,
  },
  /*
  UST_HARMONY: {
    symbol: 'UST',
    name: 'UST-Harmony',
    chainId: 1666600000
  },
  BUSD_HARMONY: {
    symbol: 'BUSD',
    name: 'BUSD-Harmony',
    chainId: 1666600000
  },
  */
};

export const TOKEN_ICONS = {
  [NATIVE_TOKENS.ETH]: ETHIcon,
  [NATIVE_TOKENS.ONE]: ONEIcon,
  [CUSTOM_TOKENS.UST]: USTIcon,
  [CUSTOM_TOKENS.BUSD]: BUSDIcon,
  //[CUSTOM_TOKENS.USDC]: USDCIcon,
  //[CUSTOM_TOKENS.USDT]: USDTIcon,
  //[CUSTOM_TOKENS.DAI]: DAIIcon,
  //[CUSTOM_TOKENS.LINK]: LINKIcon,
};

export const NETWORKS = {
  ETHEREUM: {
    icon: ETHIcon,
    name: 'Ethereum',
    chainId: 1,
  },
  HARMONY: {
    icon: ONEIcon,
    name: 'Harmony',
    chainId: 1666600000,
  },
  HARMONY_TESTNET: {
    icon: ONEIcon,
    name: 'Harmony Testnet',
    chainId: 1666700000,
  },
  ROPSTEN: {
    icon: ETHIcon,
    name: 'Ropsten Testnet',
    chainId: 3,
  },
  RINKEBY: {
    icon: ETHIcon,
    name: 'Rinkeby Testnet',
    chainId: 4,
  },
  GOERLI: {
    icon: ETHIcon,
    name: 'Goerli Testnet',
    chainId: 5,
  },
  KOVAN: {
    icon: ETHIcon,
    name: 'Kovan Testnet',
    chainId: 42,
  },
};

export const SMART_WALLET_NETWORKS = [
  NETWORKS.HARMONY_TESTNET,
  NETWORKS.KOVAN,
  NETWORKS.ROPSTEN,
];

export const WALLET_OPTIONS = {
  SMART: 'smart',
  DEFAULT: 'default',
};

export const WALLET_OPTIONS_LABELS = {
  [WALLET_OPTIONS.DEFAULT]: 'Metamask',
  [WALLET_OPTIONS.SMART]: 'Smart Wallet',
};