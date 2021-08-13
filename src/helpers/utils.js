import React from 'react';
import Decimal from 'decimal.js';
import moment from 'moment';
import _ from 'lodash';
import axios from 'axios';
import bcrypt from 'bcryptjs';
import SHA256 from 'crypto-js/sha256';

import cachedChains from './chains.json';

import {INTEGRATION_DETAILS, SCREEN_DETAILS} from './contants';

export const generateVersionedHash = (value, legacy=false) => {
  if(legacy) {
    return SHA256(value || '').toString();
  }
  return [bcrypt.hashSync(value || '', 10), '1'].join('|');
};

export const decodeVersionedHash = data => {
  const [hash, version] = (data || '').split('|');
  return {hash, version};
};

export const getScreenDetails = (id, key) => {
  return SCREEN_DETAILS[id] && SCREEN_DETAILS[id][key] || null;
};

export const getInitials = name => ((name || '').split(' ').map(i => i[0] || '').filter(i => i).join('')).toUpperCase();

export const truncateAddress = (address, first=6, last=4) => {
  const cleanedAddress = address || '',
    headIdx = first || 6,
    tailIdx = Math.max(headIdx, cleanedAddress.length - (last || 4));
  return `${cleanedAddress.slice(0, headIdx)}${tailIdx > headIdx?'…':''}${cleanedAddress.slice(tailIdx)}`;
};

export const getContactPayments = (contact, payments) => {
  return (payments || []).filter(payment => {
    return (payment.address && payment.address === contact.address) && (
      (payment.email && payment.email === contact.email) || (!contact.created_at && !payment.email)
    );
  });
};

export const getPaymentContact = (payment, contacts) => {
  let contact = null;

  const paymentAddress = payment.address,
    paymentEmail = payment.email;

  if(!paymentEmail) {
    contact = (contacts || []).filter(i => !i.created_at).find(i => i.address === paymentAddress);
  }

  if(!contact) {
    contact = (contacts || []).find(i => {
      if(paymentEmail) {
        return i.email === paymentEmail && i.address === paymentAddress;
      }
      return i.address === paymentAddress;
    });
  }
  return contact || null;
};

export const getPaymentsTotal = payments => {
  let total = new Decimal(0);
  if(payments && Array.isArray(payments) && payments.length) {
    for (const item of payments) {
      if(item.amount) {
        total = total.add(item.amount || 0);
      }
    }
  }
  return total.toFixed(2);
};

export const stripTimeFromDate = date => {
  return moment.utc(date || undefined).format('YYYY-MM-DD');
};

export const getPaymentDueDisplay = payment => {
  let segments = [];
  if(payment.due_date) {
    const now = moment.utc(stripTimeFromDate(moment.utc().format())),
      dueDate = moment.utc(stripTimeFromDate(payment.due_date));

    const delta = dueDate.fromNow(true);
    if(dueDate.format() === now.format()) {
      segments = ['DUE', 'TODAY'];
    } else {
      segments = [dueDate > now?'DUE IN':'OVERDUE', delta];
    }
  } else {
    segments = ['DUE'];
  }
  return segments.map((text, idx) => (<div key={idx}>{text}</div>));
};

export const getIntegrationDetails = (id, key) => {
  return INTEGRATION_DETAILS[id] && INTEGRATION_DETAILS[id][key] || null;
};

export const contactComparator = i => ['address', 'email'].map(key => i[key] || '').join('__');

export const deduplicateContacts = contacts => {
  return _.uniqBy(contacts && Array.isArray(contacts)?contacts:[], contactComparator);
};

export const paymentComparator = i => ['address', 'email', 'amount', 'type', 'due_date'].map(key => i[key] || '').join('__');

export const deduplicatePayments = payments => {
  return _.uniqBy(payments && Array.isArray(payments)?payments:[], paymentComparator);
};

export const deduplicateTransactions = transactions => {
  return _.uniqBy(transactions && Array.isArray(transactions)?transactions:[], 'hash');
};

export const transactionFinder = (transactions, payment) => {
  return (transactions || []).find(transaction => {
    const transactionComparators = [];
    if(transaction) {
      if(transaction.payment) {
        transactionComparators.push(paymentComparator(transaction.payment));
      }
      if(transaction.payments) {
        for (const item of (transaction.payments || [])) {
          transactionComparators.push(paymentComparator(item));
        }
      }
    }
    return transactionComparators.includes(paymentComparator(payment));
  }) || null;
};

export const filterPendingPayments = (payments, transactions) => {
  return (payments || []).filter(payment => {
    const transaction = transactionFinder(transactions, payment) || null;
    return payment.amount && !transaction;
  })
};

export const columnToLetter = (column) => {
  let temp,
    letter = '';
  while (column > 0) {
    temp = (column - 1) % 26;
    letter = String.fromCharCode(temp + 65) + letter;
    column = (column - temp - 1) / 26;
  }
  return letter;
}

export const letterToColumn = (letter) => {
  let column = 0,
    length = letter.length;

  for (let i = 0; i < length; i++) {
    column += (letter.charCodeAt(i) - 64) * Math.pow(26, length - i - 1);
  }
  return column;
}

export const getChains = async () => {
  return axios.get('https://chainid.network/chains.json').then(res => {
    const chains = res && res.data || null;
    if(chains && Array.isArray(chains) && chains.length) {
      return chains;
    }
    return cachedChains;
  }).catch(e => {
    return cachedChains;
  });
};

export const getNetworkExplorerUrl = id => {
  const network = (cachedChains || []).find(i => id && i && i.chainId === id) || null;
  return network && network.explorers && Array.isArray(network.explorers) && network.explorers[0] && network.explorers[0].url || null;
};

export const getPriceData = async currencySymbol => {
  // Rate only: https://min-api.cryptocompare.com/data/price?fsym=USD&tsyms=ETH
  // Full details: https://min-api.cryptocompare.com/data/pricemultifull?fsyms=USD&tsyms=ETH
  return axios.get(`https://min-api.cryptocompare.com/data/price?fsym=USD&tsyms=${currencySymbol}`).then(res => {
    const data = res && res.data || null;
    if(data) {
      return data;
    }
    throw new Error('No price data');
  }).catch(e => {
    throw e;
  });
};