import React, {useContext, useEffect, useState} from 'react';
import {makeStyles} from '@material-ui/core/styles';
import {
  Avatar,
  Card,
  CardContent,
  CircularProgress,
  Grid,
} from '@material-ui/core';
import {Alert} from '@material-ui/lab';
import clsx from 'clsx';
import moment from 'moment';
import Decimal from 'decimal.js';

import AppContext from '../../AppContext';

import {
  getInitials,
  getPaymentContact,
  getPaymentDueDisplay, getPaymentsTotal,
  transactionFinder,
  truncateAddress
} from '../../helpers/utils';
import {ERROR_MESSAGES} from '../../helpers/errors';
import {cardStyles} from '../../helpers/style';

const useStyles = makeStyles((theme) => ({
  container: {
    width: '100%',
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
  }
}));

export default () => {
  const classes = useStyles();
  const cardClasses = cardStyles();
  const {contacts, transactions, getNetworkById, getPayments, getTransactions} = useContext(AppContext);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

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

  return (
    <div className={classes.container}>
      {loading && (
        <div className={classes.loading}>
          <CircularProgress size={30}/>
        </div>
      ) || (
        <>
          {transactions && transactions.length && (
            transactions.map(transaction => {
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
                          {transaction.paid_at && moment.utc(transaction.paid_at).format('DD/MMM/YYYY') || null}
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
                          const contact = getPaymentContact(payment, contacts),
                            transaction = transactionFinder(transactions, payment) || null,
                            isPaid = transaction && (typeof transaction.confirmed !== 'boolean' || transaction.confirmed),
                            isProcessing = transaction && (typeof transaction.confirmed === 'boolean' && !transaction.confirmed),
                            paymentDisplayValue = payableToDisplayValue(paymentValues[idx], transaction.chain);

                          return (
                            <Card className={cardClasses.container}>
                              <CardContent className={cardClasses.content}>
                                <Avatar className={cardClasses.avatar}>{getInitials(contact && contact.name || payment.name)}</Avatar>
                                <div className={cardClasses.detailsContainer}>
                                  <Grid container
                                        direction="row"
                                        justify="space-between">
                                    <div className={cardClasses.header}>
                                      {contact && contact.name || payment.name}
                                    </div>

                                    <div className={cardClasses.header}>
                                      ${payment.amount}
                                    </div>
                                  </Grid>
                                  <Grid container
                                        direction="row"
                                        justify="space-between">
                                    <div className={cardClasses.subheader}>
                                      {truncateAddress(payment.address)}
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
                                    [cardClasses.statusSuccess]: isPaid,
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
  );
};