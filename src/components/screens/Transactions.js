import React, {useContext, useEffect, useState} from 'react';
import {makeStyles} from '@material-ui/core/styles';
import {
  AppBar,
  Avatar,
  Card,
  CardContent,
  CircularProgress,
  Grid,
  Tabs,
  Tab
} from '@material-ui/core';
import {Alert} from '@material-ui/lab';
import clsx from 'clsx';
import moment from 'moment';
import Decimal from 'decimal.js';
import Web3 from 'web3';
import _ from 'lodash';

import FilterTabs from '../shared/FilterTabs';
import SearchBox from '../shared/SearchBox';

import AppContext from '../../AppContext';

import {
  getInitials,
  getPaymentContact,
  getPaymentDueDisplay,
  getPaymentsTotal, searchItems,
  truncateAddress
} from '../../helpers/utils';
import {ERROR_MESSAGES} from '../../helpers/errors';
import {cardStyles} from '../../helpers/style';
import {
  DIALOG_ACTIONS, ADDRESS_IL_SENDER,
  ADDRESS_TIM_RECIPIENT, TRANSACTION_DIRECTIONS,
  TRANSACTION_VIEWS, ADDRESS_DAVID_RECIPIENT, ADDRESS_EXAMPLE
} from '../../helpers/contants';

import arrowLeft from '../../images/long-arrow-left.svg';
import arrowRight from '../../images/long-arrow-right.svg';

const useStyles = makeStyles((theme) => ({
  container: {
    width: '100%',
  },
  content: {
    padding: theme.spacing(1.5, 2, 2),
  },
  searchBox: {
    marginBottom: theme.spacing(2),
  },
  bold: {
    fontWeight: 'bold',
  },
  light: {
    fontSize: 12,
    opacity: 0.4,
  },
  loading: {
    textAlign: 'center',
    padding: theme.spacing(2),
  },
  transaction: {
    marginBottom: theme.spacing(2.5),
  },
  transactionHeader: {
    padding: theme.spacing(0, 0.5),
    marginBottom: theme.spacing(1),
  },
  transactionAmounts: {
    lineHeight: 1,
    '& > *': {
      display: 'inline-block',
    },
    '& > *:not(:last-child)': {
      paddingRight: theme.spacing(1),
      marginRight: theme.spacing(1),
      borderRight: `1px solid ${theme.palette.common.black}`,
    }
  },
}));

export default () => {
  const classes = useStyles();
  const cardClasses = cardStyles();
  const {contacts, transactions, openDialog, addresses, networks, payments, getNetworkById, getPayments, getTransactions} = useContext(AppContext);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [currentFilter, setCurrentFilter] = useState(null);
  const [search, setSearch] = useState('');

  useEffect(() => {
    // Load payments
    setLoading(true);
    setError(null);

    getPayments().then(payments => {
      setLoading(false);
    }).catch(e => {
      setLoading(false);
      setError(ERROR_MESSAGES.READ_PAYMENTS_FAILED);
    });

    getTransactions().catch(() => {});
  }, []);

  const payableToDisplayValue = (value, chain) => {
    if(value && chain) {
      const network = chain && getNetworkById(chain) || null;
      if(network) {
        const decimals = network && network.nativeCurrency && network.nativeCurrency.decimals || null;
        return new Decimal(value || 0).dividedBy(new Decimal(10).pow(decimals || 18).toNumber()).toFixed(4);
      }
    }
    return 0;
  };

  const FILTERS = [TRANSACTION_VIEWS.ALL, TRANSACTION_VIEWS.RECEIVED, TRANSACTION_VIEWS.SENT];
  const currentAddress = addresses && addresses[0] || null;

  let RECIPIENT_ADDRESSES = _.flatten([ADDRESS_TIM_RECIPIENT, ADDRESS_DAVID_RECIPIENT].map(i => ([i, Web3.utils.toChecksumAddress(i)])));

  let filteredTransactions = [
    ...((
      currentAddress && (
        RECIPIENT_ADDRESSES.includes(currentAddress) ||
        RECIPIENT_ADDRESSES.includes(Web3.utils.toChecksumAddress(currentAddress))
      )
    )?[
      {
        from: ADDRESS_IL_SENDER,
        paid_at: moment.utc().format(),
        sender: 'InboundLabs',
        payment: {
          amount: 100,
          address: ADDRESS_TIM_RECIPIENT,
          email: 'tim.delhaes@gmail.com',
          due_date: moment.utc().format(),
          details: 'InboundLabs Consultancy',
          name: 'Tim Delhaes',
        },
        direction: TRANSACTION_DIRECTIONS.IN,
      },
    ]:[]),
    /*
    {
      from: ADDRESS_EXAMPLE,
      paid_at: moment.utc().format(),
      sender: 'InboundLabs',
      payments: payments,
    },
    */
    ...transactions,
  ];

  filteredTransactions = filteredTransactions.filter(i => {
    if(currentFilter === TRANSACTION_VIEWS.RECEIVED) {
      return i.direction === TRANSACTION_DIRECTIONS.IN;
    } else if(currentFilter === TRANSACTION_VIEWS.SENT) {
      return i.direction !== TRANSACTION_DIRECTIONS.IN;
    } else {
      return true;
    }
  }).map(transaction => {
    return {
      ...transaction,
      ...(transaction.payment?{
        payment: {
          ...transaction.payment,
          contact: getPaymentContact(transaction.payment, contacts),
        }
      }:{}),
      ...(transaction.payments && Array.isArray(transaction.payments)?{
        payments: (transaction.payments || []).map(payment => {
          return {
            ...payment,
            contact: getPaymentContact(payment, contacts),
          };
        }),
      }:{})
    }
  });

  const transactionResults = searchItems(
    search, filteredTransactions, [
      'from', 'sender', 'name', 'email', 'address',
      'payment.name', 'payment.email', 'payment.address',
      'payments.name', 'payments.email', 'payments.address',
      'payment.contact.name', 'payment.contact.email', 'payment.contact.address',
      'payments.contact.name', 'payments.contact.email', 'payments.contact.address',
    ]
  );

  return (
    <div className={classes.container}>
      <FilterTabs items={FILTERS} onChange={setCurrentFilter}/>

      <div className={classes.content}>
        <SearchBox placeholder="Transactions"
                   onSearch={value => setSearch(value || '')}
                   className={classes.searchBox}/>

        {loading && (
          <div className={classes.loading}>
            <CircularProgress size={30}/>
          </div>
        ) || (
          <>
            {filteredTransactions && filteredTransactions.length && (
              (transactionResults || []).map(transaction => {
                if(transaction) {
                  const displayValue = payableToDisplayValue(transaction.value, transaction.chain);
                  let transactionPayments = [],
                    paymentValues = [];

                  if(transaction.payment) {
                    transactionPayments.push(transaction.payment);
                    paymentValues.push(transaction.value || 0);
                  }

                  if(transaction.payments && Array.isArray(transaction.payments)) {
                    const transactionValues = transaction.values && Array.isArray(transaction.values) && transaction.values || [];
                    for (const [idx, payment] of (transaction.payments || []).entries()) {
                      transactionPayments.push(payment);
                      paymentValues.push(transactionValues[idx] || 0);
                    }
                  }

                  if(transactionPayments && transactionPayments.length) {
                    return (
                      <div className={classes.transaction}>
                        <Grid container
                              direction="row"
                              justify="space-between"
                              alignItems="center"
                              className={classes.transactionHeader}>
                          <div className={classes.light}>
                            {transaction.paid_at && moment.utc(transaction.paid_at).format('DD.MMMM.YYYY') || null}
                          </div>

                          <div className={classes.transactionAmounts}>
                            {displayValue && transaction.currency && (
                              <span className={classes.light}>
                              {displayValue}{' '}{transaction.currency}
                            </span>
                            ) || null}
                            <span className={classes.bold}>
                            ${getPaymentsTotal(transactionPayments)}
                          </span>
                          </div>
                        </Grid>
                        <div className={cardClasses.group}>
                          {transactionPayments.map((payment, idx) => {
                            const contact = payment.contact || getPaymentContact(payment, contacts),
                              isPaid = transaction && (typeof transaction.confirmed !== 'boolean' || transaction.confirmed),
                              isProcessing = transaction && (typeof transaction.confirmed === 'boolean' && !transaction.confirmed),
                              paymentDisplayValue = payableToDisplayValue(paymentValues[idx], transaction.chain);

                            let transactorName = null,
                              transactorAddress = null;
                            if(transaction.direction === TRANSACTION_DIRECTIONS.IN) {
                              transactorName = transaction.sender || 'InboundLabs';
                              transactorAddress = transaction.from || ADDRESS_IL_SENDER;
                            } else {
                              transactorName = (contact && contact.name) || (payment && payment.name);
                              transactorAddress = (contact && contact.address) || (payment && payment.address);
                            }

                            return (
                              <Card className={cardClasses.container}
                                    onClick={e => {
                                      openDialog(DIALOG_ACTIONS.SHOW_TRANSACTION_DETAILS, {
                                        transaction: transaction,
                                        payment: payment
                                      });
                                    }}>
                                <CardContent className={cardClasses.content}>
                                  <div className={cardClasses.avatarContainer}>
                                    <Avatar className={cardClasses.avatar}>{getInitials(transactorName)}</Avatar>
                                    <img src={transaction.direction === TRANSACTION_DIRECTIONS.IN?arrowRight:arrowLeft}
                                         className={cardClasses.avatarExtraIcon}/>
                                  </div>
                                  <div className={cardClasses.detailsContainer}>
                                    <Grid container
                                          direction="row"
                                          justify="space-between">
                                      <div className={cardClasses.header}>
                                        {transactorName}
                                      </div>

                                      <div className={cardClasses.header}>
                                        ${payment.amount}
                                      </div>
                                    </Grid>
                                    <Grid container
                                          direction="row"
                                          justify="space-between">
                                      <div className={cardClasses.subheader}>
                                        {truncateAddress(transactorAddress)}
                                      </div>

                                      <div className={cardClasses.subheader} style={{whiteSpace: 'nowrap'}}>
                                        {paymentDisplayValue && transaction.currency && (
                                          <>
                                            {paymentDisplayValue}{' '}{transaction.currency}
                                          </>
                                        ) || ' '}
                                      </div>
                                    </Grid>
                                  </div>
                                  <div className={cardClasses.actions}>
                                    <div className={clsx(cardClasses.status, {
                                      [cardClasses.statusPaid]: isPaid,
                                      [cardClasses.statusInfo]: isProcessing,
                                    })}>
                                      {(isPaid && 'Paid') || (isProcessing && (
                                        <>
                                          <div>In</div>
                                          <div>Progress</div>
                                        </>
                                      )) || getPaymentDueDisplay(payment)}
                                    </div>
                                  </div>
                                </CardContent>
                              </Card>
                            );
                          })}
                        </div>
                      </div>
                    );
                  }
                }
                return null;
              })
            ) || (
              <Alert severity={error && 'error' || 'info'}>{error || ERROR_MESSAGES.NO_TRANSACTIONS}</Alert>
            )}
          </>
        )}
      </div>
    </div>
  );
};