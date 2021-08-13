import React, {useContext, useEffect, useState} from 'react';
import {makeStyles} from '@material-ui/core/styles';
import {
  Avatar,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Grid,
  IconButton,
} from '@material-ui/core';
import {Add as AddIcon} from '@material-ui/icons';
import {Alert} from '@material-ui/lab';
import clsx from 'clsx';

import AppContext from '../../AppContext';

import {DIALOG_ACTIONS, SCREENS} from '../../helpers/contants';
import {
  filterPendingPayments,
  getInitials,
  getPaymentContact,
  getPaymentDueDisplay,
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
    backgroundColor: COLORS.contentBg,
    padding: theme.spacing(1.25, 2.5),
    minHeight: 48 + theme.spacing(2.5),
  },
  headerInfo: {
    fontSize: 14,
    fontWeight: 'normal',
    lineHeight: 1.6,
    opacity: 0.6,
  },
  content: {
    padding: theme.spacing(0, 2.5, 2.5),
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
  }
}));

export default () => {
  const classes = useStyles();
  const cardClasses = cardStyles();
  const {currency, contacts, payments, transactions, changeScreen, openDialog, convertToCrypto, getPayments, getTransactions} = useContext(AppContext);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedPayments, setSelectedPayments] = useState([]);

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

  const togglePayment = (payment, idx) => {
    let newSelectPayments = [...selectedPayments];
    const currentIdx = newSelectPayments.findIndex(i => i.index === idx);
    if (currentIdx > -1) {
      // Remove
      newSelectPayments = newSelectPayments.filter(i => i.index !== idx);
    } else {
      // Add
      newSelectPayments.push({...payment, index: idx});
    }
    // Filter out paid payments :-)
    newSelectPayments = filterPendingPayments(newSelectPayments, transactions);
    setSelectedPayments(newSelectPayments);
  };

  const onAddPayment = e => {
    e.preventDefault();
    openDialog(DIALOG_ACTIONS.ADD_PAYMENT);
  };

  const onAddContact = e => {
    e.preventDefault();
    openDialog(DIALOG_ACTIONS.ADD_CONTACT);
  };

  const goToSettings = e => {
    e.preventDefault();
    changeScreen(SCREENS.SETTINGS);
  }

  useEffect(() => {
    setSelectedPayments(filterPendingPayments(selectedPayments, transactions));
  }, [transactions]);

  const pendingPayments = filterPendingPayments(payments, transactions) || [];

  return (
    <div className={classes.container}>
      <div className={classes.header}>
        <Button type="button"
                color="secondary"
                variant="contained"
                className={classes.payButton}
                disabled={!(selectedPayments || []).length}
                onClick={() => openDialog(DIALOG_ACTIONS.MAKE_PAYOUT, {payments: selectedPayments})}>
          Pay
        </Button>

        {(selectedPayments || []).length && (
          <div className={classes.headerInfo}>
            {(selectedPayments || []).length} of {(pendingPayments || []).length} selected
          </div>
        ) || (
          contacts.length && (
            <IconButton color="secondary"
                        onClick={onAddPayment}>
              <AddIcon/>
            </IconButton>
          ) || null
        )}
      </div>

      <div className={classes.content}>
        {loading && (
          <div className={classes.loading}>
            <CircularProgress size={30}/>
          </div>
        ) || (
          <>
            {pendingPayments && pendingPayments.length && (
              pendingPayments.map((payment, idx) => {
                const contact = getPaymentContact(payment, contacts),
                  transaction = transactionFinder(transactions, payment) || null,
                  isPaid = transaction && (typeof transaction.confirmed !== 'boolean' || transaction.confirmed),
                  isProcessing = transaction && (typeof transaction.confirmed === 'boolean' && !transaction.confirmed);

                return (
                  <Card
                    className={clsx(cardClasses.container, {'selected': selectedPayments.findIndex(i => i.index === idx) > -1})}
                    onClick={() => !transaction && togglePayment(payment, idx)}>
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
              })
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
                            color="secondary"
                            variant="outlined"
                            onClick={onAddPayment}>
                      Create a payment
                    </Button>
                  ) || (
                    <>
                      <Button type="button"
                              color="secondary"
                              variant="outlined"
                              onClick={onAddContact}>
                        Add a Contact
                      </Button>

                      <Button type="button"
                              color="secondary"
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