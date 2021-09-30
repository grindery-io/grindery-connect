// eslint-disable-next-line
export const ERROR_MESSAGES = {
  UNKNOWN: 'Something went wrong, please try again or contact support.',
  REQUIRED: 'This field is required.',
  WRONG_PASSCODE: 'Wrong passcode.',
  WRONG_CONFIRM_PASSCODE: "This doesn't match your first passcode.",
  INVALID_WALLET_ADDRESS: 'Invalid wallet address.',
  INVALID_PAYMENT_DETAILS: 'Invalid payment details.',
  INVALID_AMOUNT: 'Amount must be greater than zero.',
  SAVE_FAILED: 'Failed to save, please try again or contact support.',
  INVALID_INPUT: 'Invalid input.',
  READ_CONTACTS_FAILED: 'Failed to retrieve contacts.',
  READ_PAYMENTS_FAILED: 'Failed to retrieve payments.',
  READ_INTEGRATIONS_FAILED: 'Failed to retrieve integrations.',
  NO_CONTACTS: 'No contacts created yet.',
  NO_PAYMENTS: 'No payments created yet.',
  NO_PAYMENTS_AND_NO_CONTACTS: 'No payments and no contacts created yet.',
  NO_PENDING_PAYMENTS: 'No pending payments.',
  NO_TRANSACTIONS: 'No transactions processed yet.',
  GOOGLE_CONNECT_FAILED: 'Failed to connect to Google.',
  GOOGLE_SHEETS_CONNECT_FAILED: 'Failed to retrieve your Google Sheets. Please try again.',
  GOOGLE_SHEETS_NO_INTEGRATION: 'No Google Sheets Integration.',
  GOOGLE_SHEETS_READ_FAILED: 'Failed to read Google Sheet.',
  GOOGLE_SHEETS_MERGE_FAILED: 'Failed to merge with Google Sheet.',
  NETWORK_BATCH_NOT_SUPPORTED: 'Batch payments are not supported on the current network.',
  METAMASK_AUTH_REQUIRED: 'Please sign into MetaMask.',
  CREATE_WALLET_FAILED: 'Failed to create wallet',
  AMOUNT_MORE_THAN_BALANCE: 'Amount must be less than the available balance.',
  SMART_WALLET_PAYMENT_FAILED: 'Failed to make payment from smart wallet.',
};

export class GrinderyError extends Error {
  constructor(messageOrError, fallbackMessage) {
    let message = '';
    if(typeof messageOrError === 'string') {
      message = messageOrError;
    } else if(messageOrError && messageOrError.name === 'GrinderyError' && messageOrError.message) {
      message = messageOrError.message;
    } else {
      message = fallbackMessage || ERROR_MESSAGES.UNKNOWN;
    }

    super(message);

    // Maintains proper stack trace for where our error was thrown (only available on V8)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, GrinderyError)
    }

    this.name = 'GrinderyError';
  }
}