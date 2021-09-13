import React, {useContext, useEffect, useState} from 'react';
import {makeStyles} from '@material-ui/core/styles';
import {
  Avatar,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Grid,
} from '@material-ui/core';
import {Alert} from '@material-ui/lab';
import _ from 'lodash';
import clsx from 'clsx';

import FilterTabs from '../shared/FilterTabs';
import SearchAndAdd from '../shared/SearchAndAdd';

import AppContext from '../../AppContext';

import {DIALOG_ACTIONS, PAYMENT_DUE_STATES, PAYMENT_VIEWS, SCREENS, TRANSACTION_VIEWS} from '../../helpers/contants';
import {
  getPendingPayments,
  getInitials,
  getPaymentContact,
  getPaymentDueDisplay, getPaymentDueState, searchItems,
  transactionFinder,
  truncateAddress
} from '../../helpers/utils';
import {ERROR_MESSAGES} from '../../helpers/errors';
import {cardStyles, COLORS} from '../../helpers/style';

const useStyles = makeStyles((theme) => ({
  container: {
    width: '100%',
  },
  header: {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    position: 'sticky',
    top: 0,
    zIndex: 1,
    padding: theme.spacing(1.25, 0),
  },
  headerInfo: {
    fontSize: 14,
    fontWeight: 'normal',
    lineHeight: 1.6,
    opacity: 0.6,
  },
  content: {
    padding: theme.spacing(1.5, 2, 2),
    '& > *': {
      width: '100%',
    }
  },
  payButton: {
    minWidth: 130,
  },
  bold: {
    fontWeight: 'bold',
  },
  loading: {
    textAlign: 'center',
    padding: theme.spacing(2),
  },
  emptyActions: {
    textAlign: 'center',
    margin: theme.spacing(3, 0),
    '& > *': {
      marginBottom: theme.spacing(2),
    }
  },
  filterGroup: {
    marginBottom: theme.spacing(2.5),
  },
  filterLabel: {
    fontSize: 12,
    lineHeight: 1.5,
    marginBottom: theme.spacing(1),
  }
}));

export default () => {
  const classes = useStyles();
  const cardClasses = cardStyles();
  const {currency, contacts, payments, transactions, changeScreen, openDialog, convertToCrypto, getPayments, getTransactions} = useContext(AppContext);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedPayments, setSelectedPayments] = useState([]);
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

    getTransactions().catch(() => {
    });
  }, []);

  const togglePayment = (payment, groupIdx) => {
    let newSelectPayments = [...selectedPayments];
    const currentIdx = newSelectPayments.findIndex(i => i.index === groupIdx);
    if (currentIdx > -1) {
      // Remove
      newSelectPayments = newSelectPayments.filter(i => i.index !== groupIdx);
    } else {
      // Add
      newSelectPayments.push({...payment, index: groupIdx});
    }
    // Filter out paid payments :-)
    newSelectPayments = getPendingPayments(newSelectPayments, transactions);
    setSelectedPayments(newSelectPayments);
  };

  const onAddPayment = e => {
    e && e.preventDefault();
    openDialog(DIALOG_ACTIONS.ADD_PAYMENT);
  };

  const onAddContact = e => {
    e && e.preventDefault();
    openDialog(DIALOG_ACTIONS.ADD_CONTACT);
  };

  const goToSettings = e => {
    e && e.preventDefault();
    changeScreen(SCREENS.SETTINGS);
  };

  const onPay = () => {
    openDialog(DIALOG_ACTIONS.MAKE_PAYOUT, {
      payments: (selectedPayments || []).map(payment => _.omit(payment, ['contact']))
    });
  };

  useEffect(() => {
    setSelectedPayments(getPendingPayments(selectedPayments, transactions));
  }, [transactions]);

  const pendingPayments = (getPendingPayments(payments, transactions) || []).map(payment => {
    return {
      ...payment,
      contact: getPaymentContact(payment, contacts),
    };
  });

  const FILTERS = [PAYMENT_VIEWS.ALL, PAYMENT_VIEWS.DUE_TODAY, PAYMENT_VIEWS.DUE_SOON, PAYMENT_VIEWS.OVERDUE];

  const pendingPaymentResults = searchItems(
    search, pendingPayments, [
      'name', 'email', 'address',
      'contact.name', 'contact.email', 'contact.address',
    ]
  );

  return (
    <div className={classes.container}>
      <FilterTabs items={FILTERS} onChange={setCurrentFilter}/>

      <div className={classes.content}>
        <SearchAndAdd placeholder="Pending Payments"
                      onSearch={value => setSearch(value || '')}
                      onAdd={onAddPayment} />

        {(selectedPayments || []).length && (
          <div className={classes.header}>
            <Button type="button"
                    color="primary"
                    variant="contained"
                    className={classes.payButton}
                    disabled={!(selectedPayments || []).length}
                    onClick={onPay}>
              Pay
            </Button>

            <div className={classes.headerInfo}>
              {(selectedPayments || []).length} of {(pendingPayments || []).length} selected
            </div>
          </div>
        ) || null}

        {loading && (
          <div className={classes.loading}>
            <CircularProgress size={30}/>
          </div>
        ) || (
          <>
            {pendingPayments && pendingPayments.length && (
              <>
                {[
                  [PAYMENT_DUE_STATES.DUE_TODAY, PAYMENT_VIEWS.DUE_TODAY],
                  [PAYMENT_DUE_STATES.DUE_SOON, PAYMENT_VIEWS.DUE_SOON],
                  [PAYMENT_DUE_STATES.OVERDUE, PAYMENT_VIEWS.OVERDUE],
                ].filter(([, filter]) => (filter === currentFilter || currentFilter === PAYMENT_VIEWS.ALL)).map(([dueState, filter]) => {
                  const statePayments = (pendingPaymentResults || []).filter(payment => getPaymentDueState(payment) === dueState);
                  if(statePayments && statePayments.length) {
                    const showLabels = currentFilter === PAYMENT_VIEWS.ALL;
                    return (
                      <div className={showLabels && classes.filterGroup || ''}>
                        {showLabels && (
                          <div className={classes.filterLabel}>
                            {filter}
                          </div>
                        ) || null}
                        <div>
                          {statePayments.map((payment, idx) => {
                            const contact = payment.contact || getPaymentContact(payment, contacts),
                              transaction = transactionFinder(transactions, payment) || null,
                              isPaid = transaction && (typeof transaction.confirmed !== 'boolean' || transaction.confirmed),
                              isProcessing = transaction && (typeof transaction.confirmed === 'boolean' && !transaction.confirmed);
                            const groupIdx = `${dueState}_${idx}`;

                            return (
                              <Card className={clsx(cardClasses.container, {'selected': selectedPayments.findIndex(i => i.index === groupIdx) > -1})}
                                    onClick={() => !transaction && togglePayment(payment, groupIdx)}>
                                <CardContent className={cardClasses.content}>
                                  <Avatar
                                    className={cardClasses.avatar}>{getInitials(contact && contact.name || payment.name)}</Avatar>
                                  <div
                                    className={cardClasses.detailsContainer}>
                                    <Grid container
                                          direction="row"
                                          justify="space-between">
                                      <div className={cardClasses.header}>
                                        {contact && contact.name || payment.name}
                                      </div>

                                      <div className={clsx(cardClasses.header, cardClasses.bold)}>
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
                                        {currency && (
                                          <>
                                            {convertToCrypto(payment.amount)}{' '}{currency}
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
                  return null;
                })}
              </>
            ) || (
              <>
                <Alert severity={error && 'error' || 'info'}>
                  {error || (
                    <>
                      {contacts.length && (
                        <>
                          <div>{payments && payments.length ? ERROR_MESSAGES.NO_PENDING_PAYMENTS : ERROR_MESSAGES.NO_PAYMENTS}</div>
                        </>
                      ) || (
                        <>
                          <div>{ERROR_MESSAGES.NO_PAYMENTS_AND_NO_CONTACTS}</div>
                        </>
                      )}
                    </>
                  )}
                </Alert>

                <div className={classes.emptyActions}>
                  {contacts.length && (
                    <Button type="button"
                            color="primary"
                            variant="outlined"
                            onClick={onAddPayment}>
                      Create a payment
                    </Button>
                  ) || (
                    <>
                      <Button type="button"
                              color="primary"
                              variant="outlined"
                              onClick={onAddContact}>
                        Add a Contact
                      </Button>

                      <Button type="button"
                              color="primary"
                              variant="outlined"
                              onClick={goToSettings}>
                        Configure an Integration
                      </Button>
                    </>
                  )}
                </div>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
};